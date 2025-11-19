
import { AGENTS } from '../constants';
import { generateResponseStream } from './geminiService';
import { TranslationResource } from '../types';
import { ModelConfig } from '../config/models';

// Define the subset of state actions required
interface PresidentStateActions {
    setCurrentStatus: (status: string) => void;
    addMessage: (agentId: string, message: any) => void;
    setAgentThinking: (agentId: string, isThinking: boolean) => void;
    updateAgentLastMessage: (agentId: string, content: string) => void;
    appendToHistory: (text: string) => void;
    registerArtifacts: (artifacts: any[]) => void;
    setFinalReport: (report: string) => void;
    setSystemStatus: (status: any) => void;
    showToast: (message: string) => void;
    addGraphEvent: (event: any) => void;
}

interface PresidentContext {
    conversationHistory: string;
    sharedKnowledgeBase: string;
}

export interface PresidentReviewResult {
    success: boolean;
    reinstruction?: string;
}

export const executePresidentReview = async (
    finalReportText: string,
    actions: PresidentStateActions,
    context: PresidentContext,
    modelConfig: ModelConfig,
    t: TranslationResource,
    language: 'ja' | 'en'
): Promise<PresidentReviewResult> => {
    
    const president = AGENTS.find(a => a.id === 'president');
    if (!president) throw new Error("President not found");

    const getSystemInstruction = (basePrompt: string) => {
        return basePrompt + t.prompts.systemInstructionOverride;
    };

    actions.setCurrentStatus(t.status.presidentReviewing);
    
    const reviewPrompt = t.prompts.orchestratorReviewRequest.replace('{finalReportText}', finalReportText);
    actions.addMessage('president', { sender: 'user', content: reviewPrompt, timestamp: new Date().toLocaleTimeString() });

    actions.setAgentThinking('president', true);
    
    // 1. Initial Generation (Pass 1)
    const reviewResponse = await generateResponseStream(
        getSystemInstruction(president.systemPrompt),
        reviewPrompt,
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
    
    if (reviewResponse.artifacts && reviewResponse.artifacts.length > 0) {
        actions.registerArtifacts(reviewResponse.artifacts);
    }
    
    let currentPresidentResponseText = reviewResponse.text;
    actions.appendToHistory(`--- President (Phase 2 - Draft 1) ---\n${currentPresidentResponseText}`);

    // Check if it's a candidate for refinement (Contains HTML and NOT Reinstructing)
    if (!currentPresidentResponseText.includes('REINSTRUCT::') && currentPresidentResponseText.includes('<!DOCTYPE html>')) {
        const MAX_REFINEMENT_LOOPS = 2; // 2 additional passes = Total 3 passes
        
        for (let i = 0; i < MAX_REFINEMENT_LOOPS; i++) {
                actions.setCurrentStatus(t.status.presidentRefining.replace('{current}', (i+1).toString()).replace('{total}', MAX_REFINEMENT_LOOPS.toString()));
                actions.setAgentThinking('president', true);
                
                const refinementPrompt = t.prompts.presidentRefinementPrompt;
                
                // Add invisible prompt to context (visible in history log but maybe redundant in UI)
                // We force the prompt into the stream context
                const refineResponse = await generateResponseStream(
                getSystemInstruction(president.systemPrompt),
                refinementPrompt, // This prompts the "Self-Correction"
                    (chunk) => actions.updateAgentLastMessage('president', chunk),
                    context.conversationHistory + `\n\n[System] Refinement Pass ${i+1} initiated.\n`, // Inject refinement marker
                    context.sharedKnowledgeBase,
                    modelConfig.model,
                    false,
                    undefined,
                    undefined,
                    modelConfig.thinkingConfig,
                    language,
                    'president'
                );
                
                currentPresidentResponseText = refineResponse.text;
                actions.appendToHistory(`--- President (Phase 2 - Refinement ${i+1}) ---\n${currentPresidentResponseText}`);
                
                if (refineResponse.artifacts && refineResponse.artifacts.length > 0) {
                    actions.registerArtifacts(refineResponse.artifacts);
                }

                // If president changes mind and asks for re-instruct, break loop
                if (currentPresidentResponseText.includes('REINSTRUCT::')) {
                    break; 
                }
        }
    }
    
    actions.setAgentThinking('president', false);

    if (currentPresidentResponseText.includes('REINSTRUCT::')) {
        actions.addGraphEvent({ from: 'president', to: 'orchestrator', type: 'instruction', timestamp: Date.now() });
        actions.setCurrentStatus(t.status.presidentReinstructing);
        return { success: false, reinstruction: currentPresidentResponseText };
    } else {
        actions.setFinalReport(currentPresidentResponseText); 
        actions.setSystemStatus('completed');
        actions.showToast(t.status.completed);
        return { success: true };
    }
};
