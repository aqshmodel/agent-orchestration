

import React, { createContext, useContext, ReactNode } from 'react';
import { useAgisState } from '../hooks/useAgisState';
import { useSession } from '../hooks/useSession';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { useLanguage } from './LanguageContext';
import { AGENTS } from '../constants';
import { Team } from '../types';
import { generateResponseStream, UploadedFile } from '../services/geminiService';
import { playStartSound } from '../services/soundService';
import { getModelConfig } from '../config/models';

// Define the shape of the context
type AgisContextType = ReturnType<typeof useAgisState> & {
    sharedKnowledgeBaseContent: string;
    contextChars: number;
    handleSendMessage: (prompt: string, files?: UploadedFile[]) => Promise<void>;
    handleHumanResponse: (answer: string) => Promise<void>;
    handleResetAll: () => void;
    handleClearConversationHistory: () => void;
    handleClearKnowledgeBase: () => void;
    handleLoadSession: (id: string) => void;
    handleSaveSession: (name: string) => void;
    handleDeleteSession: (id: string) => void;
    handleNewSession: () => void;
    clearErrorLogs: () => void;
    handleOpenPreview: (code: string, language: string) => void;
};

const AgisContext = createContext<AgisContextType | undefined>(undefined);

export const AgisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t, language } = useLanguage();
    const state = useAgisState();
    const session = useSession();
    const { runOrchestratorLoop } = useOrchestrator(state);

    const getSystemInstruction = (basePrompt: string) => {
        return basePrompt + t.prompts.systemInstructionOverride;
    };

    const handleResetAll = () => {
        state.resetState();
        state.showToast(t.status.reset, 'info');
    };

    const handleClearConversationHistory = () => {
        state.setMessages({});
        state.conversationHistoryRef.current = '';
        state.showToast(t.status.historyCleared, 'info');
    };

    const handleClearKnowledgeBase = () => {
        state.sharedKnowledgeBaseRef.current = '';
        state.showToast(t.status.brainCleared, 'info');
    };
    
    const handleOpenPreview = (code: string, language: string) => {
        state.setPreviewCode({ code, language });
        state.setIsPreviewModalOpen(true);
    };

    const handleSaveSession = (name: string) => {
        const sessionData = {
            messages: state.messages,
            finalReport: state.finalReport,
            errorLogs: state.errorLogs,
            selectedAgents: Array.from(state.selectedAgents),
            conversationHistory: state.conversationHistoryRef.current,
            sharedKnowledgeBase: state.sharedKnowledgeBaseRef.current,
            graphEvents: state.graphEvents,
            artifacts: state.artifacts,
        };

        const result = session.saveSessionToStorage(name, sessionData);
        if (result.success && result.id) {
            state.setCurrentSessionId(result.id);
            state.showToast(result.message);
        } else {
            state.showToast(result.message, 'error');
        }
    };

    const handleLoadSession = (id: string) => {
        const result = session.loadSessionFromStorage(id);
        if (result.success && result.data) {
            const data = result.data;
            state.setMessages(data.messages);
            state.setFinalReport(data.finalReport);
            state.setErrorLogs(data.errorLogs);
            state.setSelectedAgents(new Set(data.selectedAgents));
            state.conversationHistoryRef.current = data.conversationHistory;
            state.sharedKnowledgeBaseRef.current = data.sharedKnowledgeBase;
            state.setGraphEvents(data.graphEvents || []);
            state.setArtifacts(data.artifacts || {});
            state.processedImageTagsRef.current = new Set();
            
            state.setCurrentSessionId(id);
            state.showToast(result.message);
        } else {
            state.showToast(result.message, 'error');
        }
    };

    const handleDeleteSession = (id: string) => {
        const result = session.deleteSessionFromStorage(id);
        if (result.success) {
            if (state.currentSessionId === id) {
                handleResetAll();
            }
            state.showToast(result.message);
        } else {
            state.showToast(result.message, 'error');
        }
    };

    const handleSendMessage = async (prompt: string, files?: UploadedFile[]) => {
        if (state.processingRef.current) return;
        state.processingRef.current = true;
        state.setIsLoading(true);
        state.setSystemStatus('processing');
        playStartSound();

        const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(state.selectedModel);

        try {
            // 1. President Phase: Strategy Formulation
            const president = AGENTS.find(a => a.id === 'president');
            const coo = AGENTS.find(a => a.id === 'coo');
            
            if (!president || !coo) throw new Error("Leadership agents not found");

            state.addMessage('president', { sender: 'user', content: prompt, timestamp: new Date().toLocaleTimeString() });
            state.addGraphEvent({ from: 'User', to: 'president', type: 'invoke', timestamp: Date.now() });

            if (files && files.length > 0) {
                state.appendToHistory(`[User uploaded ${files.length} files]`);
            }
            state.appendToHistory(`--- User Request ---\n${prompt}`);

            state.setCurrentStatus(t.status.presidentThinking);
            state.setAgentThinking('president', true);

            const presResponse = await generateResponseStream(
                getSystemInstruction(president.systemPrompt),
                `${t.prompts.userRequestPrefix}${prompt}`,
                (chunk) => state.updateAgentLastMessage('president', chunk),
                state.conversationHistoryRef.current,
                state.sharedKnowledgeBaseRef.current,
                activeModel,
                true,
                files,
                undefined,
                activeThinkingConfig,
                language,
                'president'
            );

            if (presResponse.artifacts && presResponse.artifacts.length > 0) {
                state.registerArtifacts(presResponse.artifacts);
            }

            state.setAgentThinking('president', false);
            const presText = presResponse.text;
            state.appendToHistory(`--- President (Strategy) ---\n${presText}`);

            // 2. COO Phase: Team Formation
            const cooPrompt = t.prompts.presidentInstructionReceived + presText;
            state.addMessage('coo', { sender: 'user', content: cooPrompt, timestamp: new Date().toLocaleTimeString() });
            state.addGraphEvent({ from: 'president', to: 'coo', type: 'instruction', label: 'Strategic Directive', timestamp: Date.now() });
            
            state.setCurrentStatus(t.status.cooAssembling);
            state.setAgentThinking('coo', true);

            const cooResponse = await generateResponseStream(
                getSystemInstruction(coo.systemPrompt),
                cooPrompt,
                (chunk) => state.updateAgentLastMessage('coo', chunk),
                state.conversationHistoryRef.current,
                state.sharedKnowledgeBaseRef.current,
                activeModel,
                false,
                undefined,
                undefined,
                activeThinkingConfig,
                language,
                'coo'
            );

            if (cooResponse.artifacts && cooResponse.artifacts.length > 0) {
                state.registerArtifacts(cooResponse.artifacts);
            }
            
            state.setAgentThinking('coo', false);
            const cooText = cooResponse.text;
            state.appendToHistory(`--- COO (Team Formation) ---\n${cooText}`);

            // Robust Parsing of Team from COO output
            try {
                // 1. Try standard format with flexible regex (supports fullwidth brackets/colons)
                const teamMatch = cooText.match(/AGIS_TEAM[:：]+\s*[\[［【](.*?)[\]］】]/i);
                
                const newSelectedAgents = new Set<string>();

                if (teamMatch) {
                    const content = teamMatch[1];
                    // Split by comma, Japanese comma, or newline
                    const aliases = content.split(/[,、\n]/).map(s => s.trim().replace(/['"”’]/g, ''));
                    
                    aliases.forEach(alias => {
                        if (!alias) return;
                        // Exact match alias or ID
                        const agent = AGENTS.find(a => a.alias.toLowerCase() === alias.toLowerCase() || a.id === alias);
                        if (agent) {
                            newSelectedAgents.add(agent.id);
                        }
                    });
                }
                
                // 2. Fallback: If no agents found or format broken, scan text for known aliases
                if (newSelectedAgents.size === 0) {
                    console.warn("AGIS_TEAM format parsing failed or empty. Scanning text for agent mentions...");
                    // Scan entire text for agent aliases (excluding leadership to avoid false positives if mentioned)
                    const specialistAgents = AGENTS.filter(a => a.team !== Team.LEADERSHIP && a.id !== 'president' && a.id !== 'coo' && a.id !== 'orchestrator' && a.id !== 'chief_of_staff');
                    
                    specialistAgents.forEach(agent => {
                        // Check if alias or name appears in the text
                        // Use word boundaries for English aliases to avoid partial matches (e.g. "or" in "orchestrator")
                        const aliasRegex = new RegExp(`\\b${agent.alias}\\b`, 'i');
                        if (aliasRegex.test(cooText) || cooText.includes(agent.name)) {
                            newSelectedAgents.add(agent.id);
                        }
                    });
                }

                if (newSelectedAgents.size > 0) {
                    state.setSelectedAgents(newSelectedAgents);
                    const agentNames = Array.from(newSelectedAgents).map(id => t.agents[id]?.name || id).join(', ');
                    state.showToast(language === 'en' ? `Team Assembled: ${agentNames}` : `チーム編成完了: ${agentNames}`, 'success');
                } else {
                     throw new Error("No agents detected in COO response.");
                }

            } catch (e) {
                console.warn("Failed to parse COO team selection, using fallback.", e);
                // Fallback: Select default analysts
                const fallbackAgents = ['A1', 'A3', 'A5']; 
                state.setSelectedAgents(new Set(fallbackAgents));
                state.addErrorLog(`COO parsing error: ${e instanceof Error ? e.message : String(e)}. Using fallback team.`);
            }

            // 3. Orchestrator Phase: Execution
            const nextPrompt = "COO Instructions:\n" + cooText;
            state.addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
            state.addGraphEvent({ from: 'coo', to: 'orchestrator', type: 'invoke', label: 'Handoff', timestamp: Date.now() });

            await runOrchestratorLoop(nextPrompt);

        } catch (error: any) {
            console.error(error);
            state.addErrorLog(error.message || 'Unknown error occurred');
            const errorMsg = language === 'en'
                ? 'An error occurred. Please check the error log.'
                : 'エラーが発生しました。エラーログを確認してください。';
            state.showToast(errorMsg, 'error');
            state.setSystemStatus('error');
            state.setCurrentStatus(t.status.error);
        } finally {
            state.processingRef.current = false;
            state.setIsLoading(false);
            state.setThinkingAgents(new Set());
        }
    };

    const handleHumanResponse = async (answer: string) => {
        state.setHumanQuestion(null);
        state.setIsWaitingForHuman(false);

        state.appendToHistory(`--- User Answer ---\n${answer}`);
        state.addGraphEvent({ from: 'User', to: 'orchestrator', type: 'invoke', label: 'Answer', timestamp: Date.now() });

        if (state.processingRef.current) return;
        state.processingRef.current = true;
        state.setIsLoading(true);

        try {
            const nextPrompt = t.prompts.userAnswerReceived.replace('{answer}', answer);
            state.addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
            await runOrchestratorLoop(nextPrompt);
        } catch (error: any) {
            console.error(error);
            state.addErrorLog(error.message || 'Unknown error occurred');
            const errorMsg = language === 'en'
                ? 'An error occurred. Please check the error log.'
                : 'エラーが発生しました。エラーログを確認してください。';
            state.showToast(errorMsg, 'error');
            state.setSystemStatus('error');
            state.setCurrentStatus(t.status.error);
        } finally {
            state.processingRef.current = false;
            state.setIsLoading(false);
            state.setThinkingAgents(new Set());
        }
    };

    const value = {
        ...state,
        sharedKnowledgeBaseContent: state.sharedKnowledgeBaseRef.current,
        contextChars: state.conversationHistoryRef.current.length + state.sharedKnowledgeBaseRef.current.length,
        handleSendMessage,
        handleHumanResponse,
        handleResetAll,
        handleClearConversationHistory,
        handleClearKnowledgeBase,
        handleLoadSession,
        handleSaveSession,
        handleDeleteSession,
        handleNewSession: handleResetAll,
        clearErrorLogs: state.clearErrorLogs,
        handleOpenPreview,
    };

    return (
        <AgisContext.Provider value={value}>
            {children}
        </AgisContext.Provider>
    );
};

export const useAgisContext = () => {
    const context = useContext(AgisContext);
    if (context === undefined) {
        throw new Error('useAgisContext must be used within an AgisProvider');
    }
    return context;
};
