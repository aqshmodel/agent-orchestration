

import { AGENTS } from '../constants';
import { generateResponseStream } from './geminiService';
import { TranslationResource } from '../types';
import { ModelConfig } from '../config/models';
import { Phase } from '../hooks/state/useUIState';

// Define the subset of state actions required
interface LeadershipStateActions {
    setCurrentStatus: (status: string) => void;
    addMessage: (agentId: string, message: any) => void;
    setAgentThinking: (agentId: string, isThinking: boolean) => void;
    updateAgentLastMessage: (agentId: string, content: string) => void;
    appendToHistory: (text: string) => void;
    registerArtifacts: (artifacts: any[]) => void;
    setFinalReport: (report: string) => void;
    setSystemStatus: (status: any) => void;
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
    addGraphEvent: (event: any) => void;
    setCurrentPhase: (phase: Phase) => void;
    setRefinementCount: (updater: (prev: number) => number) => void;
}

interface LeadershipContext {
    conversationHistory: string;
    sharedKnowledgeBase: string;
}

export interface LeadershipWorkflowResult {
    success: boolean;
    reinstruction?: string;
}

export const runLeadershipWorkflow = async (
    orchestratorSummary: string,
    actions: LeadershipStateActions,
    context: LeadershipContext,
    modelConfig: ModelConfig,
    t: TranslationResource,
    language: 'ja' | 'en'
): Promise<LeadershipWorkflowResult> => {
    
    const president = AGENTS.find(a => a.id === 'president');
    const coo = AGENTS.find(a => a.id === 'coo');
    const cos = AGENTS.find(a => a.id === 'chief_of_staff');
    
    if (!president || !coo || !cos) throw new Error("Leadership team not found");

    const getSystemInstruction = (basePrompt: string) => {
        return basePrompt + t.prompts.systemInstructionOverride;
    };

    // --- Phase 3: Reporting & Evaluation (President decides) ---
    actions.setCurrentPhase('reporting');
    actions.setCurrentStatus(t.status.presidentReviewing);

    // Prompt President to evaluate Orchestrator's summary
    const evaluationPrompt = t.prompts.presidentEvaluationPrompt.replace('{orchestratorSummary}', orchestratorSummary);

    actions.addMessage('president', { sender: 'system', content: "Evaluating Orchestrator's report...", timestamp: new Date().toLocaleTimeString() });
    actions.setAgentThinking('president', true);

    const evalResponse = await generateResponseStream(
        getSystemInstruction(president.systemPrompt),
        evaluationPrompt,
        (chunk) => actions.updateAgentLastMessage('president', chunk),
        context.conversationHistory,
        context.sharedKnowledgeBase,
        modelConfig.model,
        false,
        undefined,
        undefined,
        modelConfig.thinkingConfig,
        language,
        'president'
    );
    actions.setAgentThinking('president', false);
    actions.appendToHistory(`--- President Evaluation ---\n${evalResponse.text}`);

    if (evalResponse.text.includes("REINSTRUCT::")) {
        // Case A: Re-investigation needed
        actions.addGraphEvent({ from: 'president', to: 'coo', type: 'instruction', label: 'Re-org Order', timestamp: Date.now() });
        actions.setCurrentPhase('execution');
        actions.showToast(t.status.presidentReinstructing, "info");
        return { success: false, reinstruction: evalResponse.text };
    }

    // --- Phase 4: Drafting & Refinement Loop (CoS <-> President) ---
    actions.setCurrentPhase('refinement');
    
    // Loop Variables
    const MAX_LOOPS = 3;
    let currentRefinementLoop = 0;
    let isApproved = false;
    
    // Initial instruction to CoS
    let cosInstruction = evalResponse.text.replace("PROCEED::", "").trim();
    if (!cosInstruction) cosInstruction = t.prompts.cosDefaultInstruction;

    while (currentRefinementLoop < MAX_LOOPS && !isApproved) {
        // 1. Chief of Staff writes Draft
        actions.setCurrentStatus(t.status.cosDrafting.replace('{count}', (currentRefinementLoop + 1).toString()));
        actions.addMessage('chief_of_staff', { sender: 'user', content: cosInstruction, timestamp: new Date().toLocaleTimeString() });
        actions.setAgentThinking('chief_of_staff', true);
        actions.addGraphEvent({ from: 'president', to: 'chief_of_staff', type: 'instruction', label: `Draft ${currentRefinementLoop + 1}`, timestamp: Date.now() });

        const cosResponse = await generateResponseStream(
            getSystemInstruction(cos.systemPrompt),
            cosInstruction,
            (chunk) => actions.updateAgentLastMessage('chief_of_staff', chunk),
            context.conversationHistory, // CoS sees full history including Orchestrator's report
            context.sharedKnowledgeBase,
            modelConfig.model, // Use generic model or specific model for long context?
            false,
            undefined,
            undefined,
            modelConfig.thinkingConfig,
            language,
            'chief_of_staff'
        );
        
        if (cosResponse.artifacts && cosResponse.artifacts.length > 0) {
            actions.registerArtifacts(cosResponse.artifacts);
        }
        const draftText = cosResponse.text;
        actions.appendToHistory(`--- CoS Draft ${currentRefinementLoop + 1} ---\n${draftText}`);
        actions.setFinalReport(draftText); // Update preview with latest draft
        actions.setAgentThinking('chief_of_staff', false);

        // 2. President Reviews Draft
        actions.setCurrentStatus(t.status.presidentRefining.replace('{count}', (currentRefinementLoop + 1).toString()));
        actions.setAgentThinking('president', true);
        actions.addGraphEvent({ from: 'chief_of_staff', to: 'president', type: 'report', label: 'Review', timestamp: Date.now() });

        let reviewSystemPrompt = getSystemInstruction(president.systemPrompt);
        let reviewInputPrompt = "";

        // FORCE REJECTION LOGIC
        if (currentRefinementLoop < 2) {
             reviewInputPrompt = t.prompts.presidentDraftReviewPrompt
                .replace('{draftText}', draftText)
                .replace('{currentLoop}', currentRefinementLoop.toString());
        } else {
             reviewInputPrompt = t.prompts.presidentFinalApprovalPrompt
                .replace('{draftText}', draftText);
        }

        const reviewResponse = await generateResponseStream(
            reviewSystemPrompt,
            reviewInputPrompt,
            (chunk) => actions.updateAgentLastMessage('president', chunk),
            context.conversationHistory,
            context.sharedKnowledgeBase,
            modelConfig.model,
            false,
            undefined,
            undefined,
            modelConfig.thinkingConfig,
            language,
            'president'
        );
        actions.setAgentThinking('president', false);
        actions.appendToHistory(`--- President Review ${currentRefinementLoop + 1} ---\n${reviewResponse.text}`);

        if (reviewResponse.text.includes("APPROVE::")) {
            isApproved = true;
            actions.showToast(language === 'en' ? "Final Report Approved!" : "最終レポートが承認されました", "success");
        } else {
            // Prepare for next loop
            const feedback = reviewResponse.text.replace("REINSTRUCT::", "").trim();
            if (feedback) {
                 cosInstruction = t.prompts.presidentRefinementPrompt + `\n\n[President's Feedback]\n${feedback}`;
            } else {
                 cosInstruction = t.prompts.presidentRefinementPrompt;
            }
            
            currentRefinementLoop++;
            actions.setRefinementCount(prev => prev + 1);
        }
    }

    actions.setCurrentPhase('completed');
    actions.setSystemStatus('completed');
    return { success: true };
};