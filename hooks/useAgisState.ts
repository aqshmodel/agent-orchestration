
import { useEffect } from 'react';
import { Message, GraphEvent, Artifact } from '../types';
import { generateImage } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessageState } from './state/useMessageState';
import { useArtifactState } from './state/useArtifactState';
import { useUIState } from './state/useUIState';

export const useAgisState = () => {
  const { t, language } = useLanguage();

  // Sub-states
  const messageState = useMessageState();
  const artifactState = useArtifactState();
  const uiState = useUIState();

  // Initialization
  useEffect(() => {
    const presidentMessages = messageState.messages['president'] || [];
    const isInitialState = presidentMessages.length <= 1;

    if (isInitialState) {
      if (presidentMessages.length === 0 || presidentMessages[0].sender === 'agent') {
        messageState.setMessages(prev => ({
          ...prev,
          'president': [{
            sender: 'agent',
            content: t.prompts.initialMessage,
            timestamp: presidentMessages[0]?.timestamp || new Date().toLocaleTimeString()
          }]
        }));
      }
    }
  }, [language]);

  // Logic that crosses state boundaries (Messages <-> Artifacts)

  const injectArtifactId = (agentId: string, prompt: string, id: string) => {
      const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const targetStr = `PROMPT="${escapedPrompt}"`;
      
      // 1. Update Message State
      messageState.setMessages(prev => {
          const newMsgs = { ...prev };
          if (!newMsgs[agentId]) return prev;
          
          let updated = false;
          newMsgs[agentId] = newMsgs[agentId].map(msg => {
              if (msg.sender !== 'agent') return msg;
              if (msg.content.includes(targetStr) && !msg.content.includes(`ID="${id}"`)) { 
                   const regex = new RegExp(`(<GENERATE_IMAGE\\s+(?:(?!ID=).)*?)PROMPT="${escapedPrompt}"`, 'g');
                   const newContent = msg.content.replace(regex, `$1ID="${id}" PROMPT="${prompt}"`);
                   if (newContent !== msg.content) {
                       updated = true;
                       return { ...msg, content: newContent };
                   }
              }
              return msg;
          });
          
          return updated ? newMsgs : prev;
      });

      // 2. Update Context Refs
      const regex = new RegExp(`(<GENERATE_IMAGE\\s+(?:(?!ID=).)*?)PROMPT="${escapedPrompt}"`, 'g');
      messageState.conversationHistoryRef.current = messageState.conversationHistoryRef.current.replace(regex, `$1ID="${id}" PROMPT="${prompt}"`);
      uiState.sharedKnowledgeBaseRef.current = uiState.sharedKnowledgeBaseRef.current.replace(regex, `$1ID="${id}" PROMPT="${prompt}"`);
  };

  const processImageGenerationTags = async (text: string, agentId: string) => {
    const tagRegex = /<GENERATE_IMAGE\s+PROMPT="([^"]+)"\s*(?:ASPECT="([^"]+)")?\s*\/>/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const prompt = match[1];
      const aspect = (match[2] || '1:1') as '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
      const tagKey = `${agentId}-${prompt.substring(0, 50)}-${prompt.length}-${aspect}`;

      if (!artifactState.processedImageTagsRef.current.has(tagKey)) {
        artifactState.processedImageTagsRef.current.add(tagKey);
        console.log(`Detected image generation tag: ${prompt} (${aspect})`);

        generateImage(prompt, aspect).then(artifact => {
          if (artifact) {
            console.log("Image generated successfully:", artifact.id);
            artifactState.registerArtifacts([artifact]);
            injectArtifactId(agentId, prompt, artifact.id);
            uiState.showToast(t.agentCard.downloadImage + " Ready", 'success');
          }
        }).catch(err => {
          console.error("Failed to generate image in background:", err);
        });
      }
    }
  };

  const updateAgentLastMessage = (agentId: string, content: string) => {
    processImageGenerationTags(content, agentId);

    messageState.setMessages(prev => {
      const agentMessages = prev[agentId] || [];
      const lastMsg = agentMessages[agentMessages.length - 1];

      if (lastMsg && lastMsg.sender === 'agent' && lastMsg.content !== content) {
        const newMessages = [...agentMessages];
        newMessages[newMessages.length - 1] = { ...lastMsg, content };
        return { ...prev, [agentId]: newMessages };
      } else if (!lastMsg || lastMsg.sender !== 'agent') {
        return { ...prev, [agentId]: [...agentMessages, { sender: 'agent', content, timestamp: new Date().toLocaleTimeString() }] };
      }
      return prev;
    });
  };

  const addGraphEvent = (event: GraphEvent) => {
    uiState.setGraphEvents(prev => [...prev, event]);
  };

  const resetState = () => {
    messageState.setMessages({
      'president': [{
        sender: 'agent',
        content: t.prompts.initialMessage,
        timestamp: new Date().toLocaleTimeString()
      }]
    });
    uiState.setIsLoading(false);
    uiState.setThinkingAgents(new Set());
    uiState.setFinalReport(null);
    uiState.setHumanQuestion(null);
    uiState.setIsWaitingForHuman(false);
    uiState.setCurrentStatus('');
    uiState.setErrorLogs([]);
    uiState.setExpandedAgentId(null);
    uiState.setSelectedAgents(new Set());
    uiState.setSystemStatus('idle');
    uiState.setCurrentSessionId(null);
    uiState.setGraphEvents([]);
    artifactState.setArtifacts({});
    uiState.setPreviewCode(null);
    artifactState.processedImageTagsRef.current = new Set();
    messageState.conversationHistoryRef.current = '';
    uiState.sharedKnowledgeBaseRef.current = '';
    uiState.processingRef.current = false;
    uiState.setCurrentPhase('strategy');
    uiState.setRefinementCount(0);
  };

  return {
    // Message State
    messages: messageState.messages,
    setMessages: messageState.setMessages,
    conversationHistoryRef: messageState.conversationHistoryRef,
    addMessage: messageState.addMessage,
    appendToHistory: messageState.appendToHistory,
    updateAgentLastMessage,

    // Artifact State
    artifacts: artifactState.artifacts,
    setArtifacts: artifactState.setArtifacts,
    processedImageTagsRef: artifactState.processedImageTagsRef,
    registerArtifacts: artifactState.registerArtifacts,

    // UI State
    isLoading: uiState.isLoading, setIsLoading: uiState.setIsLoading,
    thinkingAgents: uiState.thinkingAgents, setThinkingAgents: uiState.setThinkingAgents,
    finalReport: uiState.finalReport, setFinalReport: uiState.setFinalReport,
    toast: uiState.toast, setToast: uiState.setToast,
    humanQuestion: uiState.humanQuestion, setHumanQuestion: uiState.setHumanQuestion,
    isWaitingForHuman: uiState.isWaitingForHuman, setIsWaitingForHuman: uiState.setIsWaitingForHuman,
    currentStatus: uiState.currentStatus, setCurrentStatus: uiState.setCurrentStatus,
    currentPhase: uiState.currentPhase, setCurrentPhase: uiState.setCurrentPhase,
    refinementCount: uiState.refinementCount, setRefinementCount: uiState.setRefinementCount,
    errorLogs: uiState.errorLogs, setErrorLogs: uiState.setErrorLogs,
    isErrorLogModalOpen: uiState.isErrorLogModalOpen, setIsErrorLogModalOpen: uiState.setIsErrorLogModalOpen,
    isKnowledgeBaseOpen: uiState.isKnowledgeBaseOpen, setIsKnowledgeBaseOpen: uiState.setIsKnowledgeBaseOpen,
    isSessionManagerOpen: uiState.isSessionManagerOpen, setIsSessionManagerOpen: uiState.setIsSessionManagerOpen,
    isGraphModalOpen: uiState.isGraphModalOpen, setIsGraphModalOpen: uiState.setIsGraphModalOpen,
    isPreviewModalOpen: uiState.isPreviewModalOpen, setIsPreviewModalOpen: uiState.setIsPreviewModalOpen,
    expandedAgentId: uiState.expandedAgentId, setExpandedAgentId: uiState.setExpandedAgentId,
    selectedAgents: uiState.selectedAgents, setSelectedAgents: uiState.setSelectedAgents,
    systemStatus: uiState.systemStatus, setSystemStatus: uiState.setSystemStatus,
    currentSessionId: uiState.currentSessionId, setCurrentSessionId: uiState.setCurrentSessionId,
    selectedModel: uiState.selectedModel, setSelectedModel: uiState.setSelectedModel,
    graphEvents: uiState.graphEvents, setGraphEvents: uiState.setGraphEvents,
    previewCode: uiState.previewCode, setPreviewCode: uiState.setPreviewCode,
    processingRef: uiState.processingRef,
    sharedKnowledgeBaseRef: uiState.sharedKnowledgeBaseRef,
    
    // Actions mixed
    addErrorLog: uiState.addErrorLog,
    clearErrorLogs: uiState.clearErrorLogs,
    showToast: uiState.showToast,
    setAgentThinking: uiState.setAgentThinking,
    addGraphEvent,
    resetState,
  };
};
