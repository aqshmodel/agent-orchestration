

import { useState, useRef, useEffect } from 'react';
import { Message, GraphEvent, Artifact } from '../types';
import { generateImage } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

export const useAgisState = () => {
  const { t, language } = useLanguage();

  // State definitions
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [humanQuestion, setHumanQuestion] = useState<string | null>(null);
  const [isWaitingForHuman, setIsWaitingForHuman] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [errorLogs, setErrorLogs] = useState<{ timestamp: string; message: string }[]>([]);
  
  // Modal States
  const [isErrorLogModalOpen, setIsErrorLogModalOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'waiting' | 'completed' | 'error'>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview-high');
  const [graphEvents, setGraphEvents] = useState<GraphEvent[]>([]);
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({});
  const [previewCode, setPreviewCode] = useState<{code: string, language: string} | null>(null);

  // Refs
  const conversationHistoryRef = useRef('');
  const sharedKnowledgeBaseRef = useRef('');
  const processingRef = useRef(false);
  const processedImageTagsRef = useRef<Set<string>>(new Set());

  // Initialization
  useEffect(() => {
    const presidentMessages = messages['president'] || [];
    const isInitialState = presidentMessages.length <= 1;

    if (isInitialState) {
      if (presidentMessages.length === 0 || presidentMessages[0].sender === 'agent') {
        setMessages(prev => ({
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

  // Helper functions
  const addErrorLog = (message: string) => {
    setErrorLogs(prev => [...prev, { timestamp: new Date().toISOString(), message }]);
  };

  const clearErrorLogs = () => setErrorLogs([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setAgentThinking = (agentId: string, isThinking: boolean) => {
    setThinkingAgents(prev => {
      const newSet = new Set(prev);
      if (isThinking) newSet.add(agentId);
      else newSet.delete(agentId);
      return newSet;
    });
  };

  const appendToHistory = (text: string) => {
    conversationHistoryRef.current += text + '\n\n';
  };

  const registerArtifacts = (newArtifacts: Artifact[]) => {
    if (newArtifacts.length === 0) return;
    setArtifacts(prev => {
      const next = { ...prev };
      newArtifacts.forEach(art => {
        next[art.id] = art;
      });
      return next;
    });
  };

  const injectArtifactId = (agentId: string, prompt: string, id: string) => {
      const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const targetStr = `PROMPT="${escapedPrompt}"`;
      
      // 1. Update Message State (UI)
      setMessages(prev => {
          const newMsgs = { ...prev };
          if (!newMsgs[agentId]) return prev;
          
          let updated = false;
          newMsgs[agentId] = newMsgs[agentId].map(msg => {
              if (msg.sender !== 'agent') return msg;
              // Check if tag exists and doesn't have ID yet
              if (msg.content.includes(targetStr) && !msg.content.includes(`ID="${id}"`)) { 
                   // Look for <GENERATE_IMAGE ... PROMPT="..." ... > ensuring we don't replace if ID exists
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

      // 2. Update History Ref (Context)
      const regex = new RegExp(`(<GENERATE_IMAGE\\s+(?:(?!ID=).)*?)PROMPT="${escapedPrompt}"`, 'g');
      conversationHistoryRef.current = conversationHistoryRef.current.replace(regex, `$1ID="${id}" PROMPT="${prompt}"`);
      
      // 3. Update Knowledge Base (if present)
      sharedKnowledgeBaseRef.current = sharedKnowledgeBaseRef.current.replace(regex, `$1ID="${id}" PROMPT="${prompt}"`);
  };

  const processImageGenerationTags = async (text: string, agentId: string) => {
    const tagRegex = /<GENERATE_IMAGE\s+PROMPT="([^"]+)"\s*(?:ASPECT="([^"]+)")?\s*\/>/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const prompt = match[1];
      const aspect = (match[2] || '1:1') as '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
      const tagKey = `${agentId}-${prompt.substring(0, 50)}-${prompt.length}-${aspect}`;

      if (!processedImageTagsRef.current.has(tagKey)) {
        processedImageTagsRef.current.add(tagKey);
        console.log(`Detected image generation tag: ${prompt} (${aspect})`);

        generateImage(prompt, aspect).then(artifact => {
          if (artifact) {
            console.log("Image generated successfully:", artifact.id);
            registerArtifacts([artifact]);
            injectArtifactId(agentId, prompt, artifact.id); // Inject ID back into state/history
            showToast(t.agentCard.downloadImage + " Ready", 'success');
          }
        }).catch(err => {
          console.error("Failed to generate image in background:", err);
        });
      }
    }
  };

  const updateAgentLastMessage = (agentId: string, content: string) => {
    processImageGenerationTags(content, agentId);

    setMessages(prev => {
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

  const addMessage = (agentId: string, message: Message) => {
    setMessages(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), message]
    }));
  };

  const addGraphEvent = (event: GraphEvent) => {
    setGraphEvents(prev => [...prev, event]);
  };

  const resetState = () => {
    setMessages({
      'president': [{
        sender: 'agent',
        content: t.prompts.initialMessage,
        timestamp: new Date().toLocaleTimeString()
      }]
    });
    setIsLoading(false);
    setThinkingAgents(new Set());
    setFinalReport(null);
    setHumanQuestion(null);
    setIsWaitingForHuman(false);
    setCurrentStatus('');
    setErrorLogs([]);
    setExpandedAgentId(null);
    setSelectedAgents(new Set());
    setSystemStatus('idle');
    setCurrentSessionId(null);
    setGraphEvents([]);
    setArtifacts({});
    setPreviewCode(null);
    processedImageTagsRef.current = new Set();
    conversationHistoryRef.current = '';
    sharedKnowledgeBaseRef.current = '';
    processingRef.current = false;
  };

  return {
    // State
    messages, setMessages,
    isLoading, setIsLoading,
    thinkingAgents, setThinkingAgents,
    finalReport, setFinalReport,
    toast, setToast,
    humanQuestion, setHumanQuestion,
    isWaitingForHuman, setIsWaitingForHuman,
    currentStatus, setCurrentStatus,
    errorLogs, setErrorLogs,
    isErrorLogModalOpen, setIsErrorLogModalOpen,
    isKnowledgeBaseOpen, setIsKnowledgeBaseOpen,
    isSessionManagerOpen, setIsSessionManagerOpen,
    isGraphModalOpen, setIsGraphModalOpen,
    isPreviewModalOpen, setIsPreviewModalOpen,
    expandedAgentId, setExpandedAgentId,
    selectedAgents, setSelectedAgents,
    systemStatus, setSystemStatus,
    currentSessionId, setCurrentSessionId,
    selectedModel, setSelectedModel,
    graphEvents, setGraphEvents,
    artifacts, setArtifacts,
    previewCode, setPreviewCode,
    
    // Refs (exposed for direct access/modification in orchestrator)
    conversationHistoryRef,
    sharedKnowledgeBaseRef,
    processingRef,
    processedImageTagsRef,

    // Actions
    addErrorLog,
    clearErrorLogs,
    showToast,
    setAgentThinking,
    appendToHistory,
    registerArtifacts,
    updateAgentLastMessage,
    addMessage,
    addGraphEvent,
    resetState,
  };
};
