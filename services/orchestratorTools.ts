
import { Agent } from '../types';
import { AGENTS } from '../constants';
import { TranslationResource, GraphEvent } from '../types';

// Define the subset of state actions required by the tools
export interface OrchestratorStateActions {
    addGraphEvent: (event: GraphEvent) => void;
    appendToHistory: (text: string) => void;
    setSelectedAgents: (updater: (prev: Set<string>) => Set<string>) => void;
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
    setHumanQuestion: (q: string) => void;
    setIsWaitingForHuman: (waiting: boolean) => void;
    setSystemStatus: (status: any) => void;
}

export interface ToolProcessingResult {
    agentTasks: { agent: Agent; query: string }[];
    isMissionComplete: boolean;
    finalReport?: string;
    memberAdded: boolean;
    isWaitingForHuman: boolean;
}

export const processToolCalls = (
    functionCalls: any[],
    actions: OrchestratorStateActions,
    t: TranslationResource,
    language: 'ja' | 'en'
): ToolProcessingResult => {
    const result: ToolProcessingResult = {
        agentTasks: [],
        isMissionComplete: false,
        memberAdded: false,
        isWaitingForHuman: false,
    };

    for (const call of functionCalls) {
        const fnName = call.name;
        const args = call.args;

        if (fnName === 'complete') {
            actions.addGraphEvent({ from: 'orchestrator', to: 'president', type: 'report', timestamp: Date.now() });
            result.isMissionComplete = true;
            result.finalReport = args.final_report;
        
        } else if (fnName === 'ask_human') {
            actions.setHumanQuestion(args.question);
            actions.setIsWaitingForHuman(true);
            actions.setSystemStatus('waiting');
            result.isWaitingForHuman = true;
            // If asking human, we stop processing other tools immediately
            return result;

        } else if (['invoke', 'consult', 'review'].includes(fnName)) {
            let targetAlias = '';
            let query = '';
            
            if (fnName === 'invoke') {
                targetAlias = args.agent_alias;
                query = t.prompts.taskInstruction.replace('{query}', args.query);
                actions.addGraphEvent({ from: 'orchestrator', to: targetAlias, type: 'invoke', timestamp: Date.now() });

            } else if (fnName === 'consult') {
                targetAlias = args.to_alias;
                query = t.prompts.consultation.replace('{from}', args.from_alias).replace('{query}', args.query);
                actions.addGraphEvent({ from: args.from_alias, to: args.to_alias, type: 'consult', timestamp: Date.now() });

            } else if (fnName === 'review') {
                targetAlias = args.reviewer_alias;
                query = t.prompts.reviewRequest.replace('{target}', args.target_alias).replace('{query}', args.query);
                actions.addGraphEvent({ from: 'orchestrator', to: args.reviewer_alias, type: 'invoke', label: 'Review Request', timestamp: Date.now() });
                actions.addGraphEvent({ from: args.reviewer_alias, to: args.target_alias, type: 'review', timestamp: Date.now() });
            }
            
            const targetAgent = AGENTS.find(a => a.alias === targetAlias);
            if (targetAgent) {
                result.agentTasks.push({ agent: targetAgent, query });
            } else {
                console.warn(`Agent alias ${targetAlias} not found`);
                actions.appendToHistory(`[System Error] '${fnName}' failed: Agent alias '${targetAlias}' not found in directory. Please check valid aliases.`);
            }

        } else if (fnName === 'invoke_parallel') {
                const invocations = args.invocations || [];
                invocations.forEach((inv: any) => {
                    const targetAgent = AGENTS.find(a => a.alias === inv.agent_alias);
                    if (targetAgent) {
                        result.agentTasks.push({ agent: targetAgent, query: t.prompts.taskInstruction.replace('{query}', inv.query) });
                        actions.addGraphEvent({ from: 'orchestrator', to: inv.agent_alias, type: 'invoke', timestamp: Date.now() });
                    } else {
                        actions.appendToHistory(`[System Error] invoke_parallel failed for one agent: Agent alias '${inv.agent_alias}' not found.`);
                    }
                });
        } else if (fnName === 'add_member') {
            const targetAgent = AGENTS.find(a => a.alias === args.agent_alias);
            if (targetAgent) {
                actions.setSelectedAgents(prev => new Set(prev).add(targetAgent.id));
                actions.appendToHistory(`[System] ${targetAgent.name} (${args.agent_alias}) added to team. Reason: ${args.reason}`);
                actions.addGraphEvent({ from: 'orchestrator', to: args.agent_alias, type: 'add_member', label: 'Added', timestamp: Date.now() });

                const transAgentName = t.agents[targetAgent.id]?.name || targetAgent.name;
                const message = language === 'en' 
                    ? `${transAgentName} has joined the team.`
                    : `${transAgentName} がチームに参加しました`;
                    
                actions.showToast(message, 'info');
                result.memberAdded = true;
            } else {
                actions.appendToHistory(`[System Error] add_member failed: Agent alias '${args.agent_alias}' not found in directory. Please check valid aliases in the prompt.`);
                console.warn(`add_member failed: alias ${args.agent_alias} not found`);
            }
        }
    }

    return result;
};
