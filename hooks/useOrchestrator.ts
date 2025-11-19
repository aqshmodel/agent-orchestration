
import { Agent } from '../types';
import { AGENTS } from '../constants';
import { generateResponseStream } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAgisState } from './useAgisState';
import { playNotificationSound, playCompletionSound } from '../services/soundService';
import { ORCHESTRATOR_TOOLS } from '../config/tools';
import { getModelConfig } from '../config/models';
import { processToolCalls } from '../services/orchestratorTools';
import { executePresidentReview } from '../services/presidentOperations';

export const useOrchestrator = (state: ReturnType<typeof useAgisState>) => {
    const { t, language } = useLanguage();
    
    const getSystemInstruction = (basePrompt: string) => {
        return basePrompt + t.prompts.systemInstructionOverride;
    };

    const runOrchestratorLoop = async (initialPrompt: string) => {
        const orchestrator = AGENTS.find(a => a.id === 'orchestrator');
        
        if (!orchestrator) throw new Error("Orchestrator agent not found");

        let currentPrompt = initialPrompt;
        let loopCount = 0;
        const MAX_LOOPS = 50; 
        let missionComplete = false;

        const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(state.selectedModel);
        const modelConfig = { model: activeModel, thinkingConfig: activeThinkingConfig };

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
            
            // Process all tool calls using the separated service
            const toolResult = processToolCalls(
                functionCalls, 
                state, // State object has all methods required by OrchestratorStateActions
                t, 
                language
            );

            // Handle Human Interaction
            if (toolResult.isWaitingForHuman) {
                playNotificationSound();
                return; 
            }

            // Handle Mission Completion & President Review
            if (toolResult.isMissionComplete && toolResult.finalReport) {
                missionComplete = true;
                
                const reviewResult = await executePresidentReview(
                    toolResult.finalReport,
                    state, // State object has all methods required by PresidentStateActions
                    {
                        conversationHistory: state.conversationHistoryRef.current,
                        sharedKnowledgeBase: state.sharedKnowledgeBaseRef.current
                    },
                    modelConfig,
                    t,
                    language
                );

                if (reviewResult.success) {
                    playCompletionSound();
                    state.setSystemStatus('completed');
                } else if (reviewResult.reinstruction) {
                    missionComplete = false;
                    currentPrompt = t.prompts.reinstructReceived.replace('{reviewText}', reviewResult.reinstruction);
                    state.addMessage('orchestrator', { sender: 'user', content: currentPrompt, timestamp: new Date().toLocaleTimeString() });
                }
            }

            // Handle Agent Executions
            if (toolResult.agentTasks.length > 0 && !missionComplete) {
                const agentNames = toolResult.agentTasks.map(task => {
                    const transAgent = t.agents?.[task.agent.id]; 
                    return transAgent ? transAgent.name : task.agent.name; 
                }).join(', ');
                
                state.setCurrentStatus(t.status.agentsWorking.replace('{names}', agentNames));

                toolResult.agentTasks.forEach(task => {
                    state.addMessage(task.agent.id, { sender: 'user', content: task.query, timestamp: new Date().toLocaleTimeString() });
                });

                state.setThinkingAgents(prev => {
                    const next = new Set(prev);
                    toolResult.agentTasks.forEach(task => next.add(task.agent.id));
                    return next;
                });

                const results = await Promise.all(toolResult.agentTasks.map(async (task) => {
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

            } else if (toolResult.memberAdded && !missionComplete) {
                state.addMessage('orchestrator', { 
                    sender: 'system', 
                    content: t.status.memberAdded, 
                    timestamp: new Date().toLocaleTimeString() 
                });
                currentPrompt = t.prompts.memberAddedPrompt;

            } else if (functionCalls.length === 0 && !missionComplete) {
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
