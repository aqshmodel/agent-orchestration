
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
    setSelectedAgents: (updater: (prev: Set<string>) => Set<string>) => void;
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

    // --- Phase 3: Reporting & Evaluation ---
    actions.setCurrentPhase('reporting');

    // ==========================================
    // STEP 1: COO Audit (COOによる品質監査)
    // ==========================================
    actions.setCurrentStatus(t.status.cooAssembling); // Reuse message or add new one "COO is auditing..."
    actions.addMessage('coo', { sender: 'user', content: `[Orchestrator Report]\n${orchestratorSummary}\n\nAudit this report.`, timestamp: new Date().toLocaleTimeString() });
    actions.setAgentThinking('coo', true);
    actions.addGraphEvent({ from: 'orchestrator', to: 'coo', type: 'report', label: 'Review Request', timestamp: Date.now() });

    const cooAuditResponse = await generateResponseStream(
        getSystemInstruction(coo.systemPrompt),
        `[Orchestrator Report]\n${orchestratorSummary}\n\nEvaluate this based on the strategy. Output AGIS_AUDIT::APPROVE or AGIS_AUDIT::REJECT.`,
        (chunk) => actions.updateAgentLastMessage('coo', chunk),
        context.conversationHistory,
        context.sharedKnowledgeBase,
        modelConfig.model,
        false,
        undefined,
        undefined,
        modelConfig.thinkingConfig,
        language,
        'coo'
    );
    actions.setAgentThinking('coo', false);
    actions.appendToHistory(`--- COO Audit ---\n${cooAuditResponse.text}`);
    
    const cooText = cooAuditResponse.text;
    
    // Check for Member Addition during Audit
    const addMemberMatch = cooText.match(/AGIS_TEAM_ADD::\s*[\[［【](.*?)[\]］】]/i);
    if (addMemberMatch) {
        const alias = addMemberMatch[1].trim();
        const agent = AGENTS.find(a => a.alias === alias || a.id === alias);
        if (agent) {
             actions.setSelectedAgents(prev => new Set(prev).add(agent.id));
             actions.showToast(`COO added ${agent.name} for reinforcement.`, 'info');
             actions.addGraphEvent({ from: 'coo', to: agent.alias, type: 'add_member', label: 'Reinforcement', timestamp: Date.now() });
        }
    }

    // Logic Branching based on COO Audit
    if (cooText.includes("AGIS_AUDIT::REJECT")) {
        // Case: COO Rejected
        actions.addGraphEvent({ from: 'coo', to: 'orchestrator', type: 'instruction', label: 'Reject & Retry', timestamp: Date.now() });
        actions.setCurrentPhase('execution');
        actions.showToast("COO rejected the report. Re-assigning tasks.", "error");
        
        // Extract instruction part
        const instruction = cooText.replace(/AGIS_AUDIT::REJECT/, '').trim();
        return { success: false, reinstruction: `[COO Order] Report Rejected.\n${instruction}` };
    }

    // ==========================================
    // STEP 2: President Evaluation (プレジデントによる最終判断)
    // ==========================================
    // COO Approved. Now President evaluates based on COO's summary.
    actions.setCurrentStatus(t.status.presidentReviewing);
    const evaluationPrompt = t.prompts.presidentEvaluationPrompt.replace('{orchestratorSummary}', cooText); // Use COO's filtered summary

    actions.addMessage('president', { sender: 'system', content: "Reviewing COO's recommendation...", timestamp: new Date().toLocaleTimeString() });
    actions.setAgentThinking('president', true);
    actions.addGraphEvent({ from: 'coo', to: 'president', type: 'report', label: 'Recommendation', timestamp: Date.now() });

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
        // Case: President Rejects -> Instructions go to COO first for Re-org
        actions.addGraphEvent({ from: 'president', to: 'coo', type: 'instruction', label: 'Re-org Order', timestamp: Date.now() });
        actions.showToast(t.status.presidentReinstructing, "info");

        // COO Re-organization Step
        actions.setCurrentStatus("COO is reorganizing the team...");
        actions.setAgentThinking('coo', true);
        const reorgResponse = await generateResponseStream(
            getSystemInstruction(coo.systemPrompt),
            `President's Reinstruction:\n${evalResponse.text}\n\nReorganize the team (AGIS_TEAM::[...]) and instruct Orchestrator.`,
            (chunk) => actions.updateAgentLastMessage('coo', chunk),
            context.conversationHistory,
            context.sharedKnowledgeBase,
            modelConfig.model,
            false,
            undefined,
            undefined,
            modelConfig.thinkingConfig,
            language,
            'coo'
        );
        actions.setAgentThinking('coo', false);
        actions.appendToHistory(`--- COO Re-org ---\n${reorgResponse.text}`);

        // Parse new team
        const teamMatch = reorgResponse.text.match(/AGIS_TEAM[:：]+\s*[\[［【](.*?)[\]］】]/i);
        if (teamMatch) {
             const aliases = teamMatch[1].split(/[,、\n]/).map(s => s.trim().replace(/['"”’]/g, ''));
             aliases.forEach(alias => {
                 const agent = AGENTS.find(a => a.alias === alias || a.id === alias);
                 if (agent) actions.setSelectedAgents(prev => new Set(prev).add(agent.id));
             });
        }

        actions.addGraphEvent({ from: 'coo', to: 'orchestrator', type: 'instruction', label: 'Re-execution', timestamp: Date.now() });
        actions.setCurrentPhase('execution');

        return { success: false, reinstruction: reorgResponse.text };
    }

    // ==========================================
    // STEP 3: Drafting & Refinement Loop (CoS <-> President)
    // ==========================================
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
        // IMPORTANT: Do NOT set finalReport here yet to avoid premature preview button
        // actions.setFinalReport(draftText); 
        actions.setAgentThinking('chief_of_staff', false);

        // 2. President Reviews Draft
        actions.setCurrentStatus(t.status.presidentRefining.replace('{count}', (currentRefinementLoop + 1).toString()));
        actions.setAgentThinking('president', true);
        actions.addGraphEvent({ from: 'chief_of_staff', to: 'president', type: 'report', label: 'Review', timestamp: Date.now() });

        let reviewSystemPrompt = getSystemInstruction(president.systemPrompt);
        let reviewInputPrompt = "";

        // FORCE REJECTION LOGIC for first few loops
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
            actions.setFinalReport(draftText); // Set Final Report ONLY when approved
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
