
import React, { createContext, useContext, ReactNode } from 'react';
import { useAgisState } from '../hooks/useAgisState';
import { useSession } from '../hooks/useSession';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { useLanguage } from './LanguageContext';
import { AGENTS } from '../constants';
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
            const president = AGENTS.find(a => a.id === 'president');
            if (!president) throw new Error("President agent not found");

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
            state.appendToHistory(`--- President (Phase 1) ---\n${presText}`);

            const teamMatch = presText.match(/AGIS_TEAM::\[(.*?)\]/);
            if (teamMatch) {
                const aliases = teamMatch[1].split(',').map(s => s.trim());
                const newSelectedAgents = new Set<string>();
                aliases.forEach(alias => {
                    const agent = AGENTS.find(a => a.alias === alias);
                    if (agent) newSelectedAgents.add(agent.id);
                });
                state.setSelectedAgents(newSelectedAgents);
            }

            const nextPrompt = t.prompts.presidentInstructionReceived + presText;
            state.addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
            state.addGraphEvent({ from: 'president', to: 'orchestrator', type: 'invoke', timestamp: Date.now() });

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
