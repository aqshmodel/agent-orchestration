

import { Agent } from '../types';
import { AGENTS } from '../constants';
import { generateResponseStream } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAgisState } from './useAgisState';
import { playNotificationSound, playCompletionSound } from '../services/soundService';
import { ORCHESTRATOR_TOOLS } from '../config/tools';
import { getModelConfig } from '../config/models';

export const useOrchestrator = (state: ReturnType<typeof useAgisState>) => {
    const { t, language } = useLanguage();
    
    const getSystemInstruction = (basePrompt: string) => {
        return basePrompt + t.prompts.systemInstructionOverride;
    };

    const runOrchestratorLoop = async (initialPrompt: string) => {
        const orchestrator = AGENTS.find(a => a.id === 'orchestrator');
        const president = AGENTS.find(a => a.id === 'president');
        
        if (!orchestrator || !president) throw new Error("Core agents not found");

        let currentPrompt = initialPrompt;
        let loopCount = 0;
        const MAX_LOOPS = 50; 
        let missionComplete = false;

        const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(state.selectedModel);

        while (loopCount < MAX_LOOPS && !missionComplete) {
            loopCount++;
            state.setCurrentStatus(t.status.orchestratorThinking.replace('{count}', loopCount.toString()));
            state.setAgentThinking('orchestrator', true);

            const enforcedSystemPrompt = getSystemInstruction(orchestrator.systemPrompt) + t.prompts.orchestratorMandatoryRules;

            const orchestratorResponse = await generateResponseStream(
                enforcedSystemPrompt, 
                currentPrompt, 
                (chunk) => state.updateAgentLastMessage('orchestrator', chunk),
                state.conversationHistoryRef.current,
                state.sharedKnowledgeBaseRef.current,
                activeModel,
                false, 
                undefined, 
                ORCHESTRATOR_TOOLS,
                activeThinkingConfig,
                language,
                'orchestrator'
            );
            
            if (orchestratorResponse.artifacts && orchestratorResponse.artifacts.length > 0) {
                state.registerArtifacts(orchestratorResponse.artifacts);
            }
            
            let responseText = orchestratorResponse.text || '';
            
            const cleanedText = responseText
                .replace(/^(?:Action|行動)[:：\s]*AGIS_CMD::[\s\S]*$/im, '')
                .replace(/AGIS_CMD::[\w_]+\s*\([\s\S]*?\)/g, '')
                .trim();
            
            if (cleanedText !== responseText) {
                state.updateAgentLastMessage('orchestrator', cleanedText);
            }

            if (cleanedText) {
                state.appendToHistory(`--- Project Orchestrator ---\n${cleanedText}`);
            }
            
            state.setAgentThinking('orchestrator', false);

            const functionCalls = orchestratorResponse.functionCalls || [];
            
            const agentTasks: { agent: Agent, query: string }[] = [];
            let isMissionComplete = false;
            let memberAdded = false;

            for (const call of functionCalls) {
                const fnName = call.name;
                const args = call.args as any;
                
                if (fnName === 'complete') {
                    state.addGraphEvent({ from: 'orchestrator', to: 'president', type: 'report', timestamp: Date.now() });

                    isMissionComplete = true;
                    missionComplete = true;
                    const finalReportText = args.final_report;
                    
                    state.setCurrentStatus(t.status.presidentReviewing);
                    
                    const reviewPrompt = t.prompts.orchestratorReviewRequest.replace('{finalReportText}', finalReportText);
                    state.addMessage('president', { sender: 'user', content: reviewPrompt, timestamp: new Date().toLocaleTimeString() });

                    state.setAgentThinking('president', true);
                    
                    // 1. Initial Generation (Pass 1)
                    const reviewResponse = await generateResponseStream(
                        getSystemInstruction(president.systemPrompt),
                        reviewPrompt,
                        (chunk) => state.updateAgentLastMessage('president', chunk),
                        state.conversationHistoryRef.current,
                        state.sharedKnowledgeBaseRef.current,
                        activeModel,
                        false,
                        undefined,
                        undefined,
                        activeThinkingConfig,
                        language,
                        'president'
                    );
                    
                    if (reviewResponse.artifacts && reviewResponse.artifacts.length > 0) {
                        state.registerArtifacts(reviewResponse.artifacts);
                    }
                    
                    let currentPresidentResponseText = reviewResponse.text;
                    state.appendToHistory(`--- President (Phase 2 - Draft 1) ---\n${currentPresidentResponseText}`);

                    // Check if it's a candidate for refinement (Contains HTML and NOT Reinstructing)
                    if (!currentPresidentResponseText.includes('REINSTRUCT::') && currentPresidentResponseText.includes('<!DOCTYPE html>')) {
                        const MAX_REFINEMENT_LOOPS = 2; // 2 additional passes = Total 3 passes
                        
                        for (let i = 0; i < MAX_REFINEMENT_LOOPS; i++) {
                             state.setCurrentStatus(t.status.presidentRefining.replace('{current}', (i+1).toString()).replace('{total}', MAX_REFINEMENT_LOOPS.toString()));
                             state.setAgentThinking('president', true);
                             
                             const refinementPrompt = t.prompts.presidentRefinementPrompt;
                             
                             // Add invisible prompt to context (visible in history log but maybe redundant in UI)
                             // We force the prompt into the stream context
                             const refineResponse = await generateResponseStream(
                                getSystemInstruction(president.systemPrompt),
                                refinementPrompt, // This prompts the "Self-Correction"
                                 (chunk) => state.updateAgentLastMessage('president', chunk),
                                 state.conversationHistoryRef.current, // Contains Draft 1
                                 state.sharedKnowledgeBaseRef.current,
                                 activeModel,
                                 false,
                                 undefined,
                                 undefined,
                                 activeThinkingConfig,
                                 language,
                                 'president'
                             );
                             
                             currentPresidentResponseText = refineResponse.text;
                             state.appendToHistory(`--- President (Phase 2 - Refinement ${i+1}) ---\n${currentPresidentResponseText}`);
                             
                             if (refineResponse.artifacts && refineResponse.artifacts.length > 0) {
                                state.registerArtifacts(refineResponse.artifacts);
                             }

                             // If president changes mind and asks for re-instruct, break loop
                             if (currentPresidentResponseText.includes('REINSTRUCT::')) {
                                 break; 
                             }
                        }
                    }
                    
                    state.setAgentThinking('president', false);

                    if (currentPresidentResponseText.includes('REINSTRUCT::')) {
                            missionComplete = false;
                            currentPrompt = t.prompts.reinstructReceived.replace('{reviewText}', currentPresidentResponseText);
                            state.addMessage('orchestrator', { sender: 'user', content: currentPrompt, timestamp: new Date().toLocaleTimeString() });
                            state.addGraphEvent({ from: 'president', to: 'orchestrator', type: 'instruction', timestamp: Date.now() });
                            state.setCurrentStatus(t.status.presidentReinstructing);
                    } else {
                        state.setFinalReport(currentPresidentResponseText); 
                        state.setSystemStatus('completed');
                        playCompletionSound();
                        state.showToast(t.status.completed);
                    }
                    
                } else if (fnName === 'ask_human') {
                    state.setHumanQuestion(args.question);
                    state.setIsWaitingForHuman(true);
                    state.setSystemStatus('waiting');
                    playNotificationSound();
                    return; 
                } else if (['invoke', 'consult', 'review'].includes(fnName)) {
                    let targetAlias = '';
                    let query = '';
                    
                    if (fnName === 'invoke') {
                        targetAlias = args.agent_alias;
                        query = t.prompts.taskInstruction.replace('{query}', args.query);
                        state.addGraphEvent({ from: 'orchestrator', to: targetAlias, type: 'invoke', timestamp: Date.now() });

                    } else if (fnName === 'consult') {
                        targetAlias = args.to_alias;
                        query = t.prompts.consultation.replace('{from}', args.from_alias).replace('{query}', args.query);
                        state.addGraphEvent({ from: args.from_alias, to: args.to_alias, type: 'consult', timestamp: Date.now() });

                    } else if (fnName === 'review') {
                        targetAlias = args.reviewer_alias;
                        query = t.prompts.reviewRequest.replace('{target}', args.target_alias).replace('{query}', args.query);
                        state.addGraphEvent({ from: 'orchestrator', to: args.reviewer_alias, type: 'invoke', label: 'Review Request', timestamp: Date.now() });
                        state.addGraphEvent({ from: args.reviewer_alias, to: args.target_alias, type: 'review', timestamp: Date.now() });
                    }
                    
                    const targetAgent = AGENTS.find(a => a.alias === targetAlias);
                    if (targetAgent) {
                        agentTasks.push({ agent: targetAgent, query });
                    } else {
                        console.warn(`Agent alias ${targetAlias} not found`);
                        state.appendToHistory(`[System Error] '${fnName}' failed: Agent alias '${targetAlias}' not found in directory. Please check valid aliases.`);
                    }

                } else if (fnName === 'invoke_parallel') {
                        const invocations = args.invocations || [];
                        invocations.forEach((inv: any) => {
                            const targetAgent = AGENTS.find(a => a.alias === inv.agent_alias);
                            if (targetAgent) {
                                agentTasks.push({ agent: targetAgent, query: t.prompts.taskInstruction.replace('{query}', inv.query) });
                                state.addGraphEvent({ from: 'orchestrator', to: inv.agent_alias, type: 'invoke', timestamp: Date.now() });
                            } else {
                                state.appendToHistory(`[System Error] invoke_parallel failed for one agent: Agent alias '${inv.agent_alias}' not found.`);
                            }
                        });
                } else if (fnName === 'add_member') {
                    const targetAgent = AGENTS.find(a => a.alias === args.agent_alias);
                    if (targetAgent) {
                        state.setSelectedAgents(prev => new Set(prev).add(targetAgent.id));
                        state.appendToHistory(`[System] ${targetAgent.name} (${args.agent_alias}) added to team. Reason: ${args.reason}`);
                        state.addGraphEvent({ from: 'orchestrator', to: args.agent_alias, type: 'add_member', label: 'Added', timestamp: Date.now() });

                        const transAgentName = t.agents[targetAgent.id]?.name || targetAgent.name;
                        const message = language === 'en' 
                            ? `${transAgentName} has joined the team.`
                            : `${transAgentName} がチームに参加しました`;
                            
                        state.showToast(message, 'info');
                        memberAdded = true;
                    } else {
                        state.appendToHistory(`[System Error] add_member failed: Agent alias '${args.agent_alias}' not found in directory. Please check valid aliases in the prompt.`);
                        console.warn(`add_member failed: alias ${args.agent_alias} not found`);
                    }
                }
            }

            if (agentTasks.length > 0 && !isMissionComplete) {
                const agentNames = agentTasks.map(task => {
                    const transAgent = t.agents?.[task.agent.id]; 
                    return transAgent ? transAgent.name : task.agent.name; 
                }).join(', ');
                
                state.setCurrentStatus(t.status.agentsWorking.replace('{names}', agentNames));

                agentTasks.forEach(task => {
                    state.addMessage(task.agent.id, { sender: 'user', content: task.query, timestamp: new Date().toLocaleTimeString() });
                });

                state.setThinkingAgents(prev => {
                    const next = new Set(prev);
                    agentTasks.forEach(task => next.add(task.agent.id));
                    return next;
                });

                const results = await Promise.all(agentTasks.map(async (task) => {
                    try {
                        const agentResponse = await generateResponseStream(
                            getSystemInstruction(task.agent.systemPrompt),
                            task.query,
                            (chunk) => state.updateAgentLastMessage(task.agent.id, chunk),
                            state.conversationHistoryRef.current, 
                            state.sharedKnowledgeBaseRef.current,
                            activeModel,
                            true, 
                            undefined,
                            undefined,
                            activeThinkingConfig,
                            language,
                            task.agent.id
                        );
                        return { agent: task.agent, text: agentResponse.text, artifacts: agentResponse.artifacts };
                    } catch (e) {
                        console.error(`Error executing agent ${task.agent.alias}`, e);
                        const errorMsg = language === 'en' ? "An error occurred." : "エラーが発生しました。";
                        return { agent: task.agent, text: errorMsg, artifacts: [] };
                    } finally {
                        state.setThinkingAgents(prev => {
                            const next = new Set(prev);
                            next.delete(task.agent.id);
                            return next;
                        });
                    }
                }));

                let combinedResults = "";
                for (const res of results) {
                    const { agent, text, artifacts } = res;
                    
                    if (artifacts && artifacts.length > 0) {
                        state.registerArtifacts(artifacts);
                    }
                    
                    state.appendToHistory(`--- ${agent.name} (${agent.alias}) ---\n${text}`);
                    combinedResults += `--- ${agent.alias} Report ---\n${text}\n\n`;
                    
                    const keyInsightsMatch = text.match(/(?:【キーインサイト】|(?:\*\*|##|\[)?\s*Key Insights\s*(?:\*\*|\]|:)?)([\s\S]*?)(?=(?:【|\[Orchestrator|\[Next|AGIS_CMD|REINSTRUCT|オーケストレーターへの提案|Proposals to Orchestrator|\*\*Proposals|$))/i);
                    if (keyInsightsMatch) {
                        state.sharedKnowledgeBaseRef.current += `\n[${agent.alias}]: ${keyInsightsMatch[1].trim()}\n`;
                    }
                }

                state.addMessage('orchestrator', { 
                    sender: 'system', 
                    content: t.status.agentsReported, 
                    timestamp: new Date().toLocaleTimeString() 
                });

                currentPrompt = t.prompts.agentsReportedPrompt.replace('{combinedResults}', combinedResults);

            } else if (memberAdded && !isMissionComplete) {
                state.addMessage('orchestrator', { 
                    sender: 'system', 
                    content: t.status.memberAdded, 
                    timestamp: new Date().toLocaleTimeString() 
                });
                currentPrompt = t.prompts.memberAddedPrompt;

            } else if (functionCalls.length === 0 && !isMissionComplete) {
                if (responseText.includes('AGIS_CMD::complete')) {
                    currentPrompt = t.prompts.checkCompletePrompt;
                } else {
                    currentPrompt = t.prompts.evaluateSituationPrompt;
                }
            }
        }

        if (!missionComplete && !state.isLoading && !state.processingRef.current) {
            state.setHumanQuestion(t.status.loopLimit);
            state.setIsWaitingForHuman(true);
            state.setSystemStatus('waiting');
            playNotificationSound();
        }
    };

    return { runOrchestratorLoop };
};