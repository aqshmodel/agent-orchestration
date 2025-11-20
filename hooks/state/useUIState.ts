
import { useState, useRef } from 'react';
import { GraphEvent } from '../../types';

export type Phase = 'strategy' | 'execution' | 'reporting' | 'refinement' | 'completed';

export const useUIState = () => {
  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'waiting' | 'completed' | 'error'>('idle');
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentPhase, setCurrentPhase] = useState<Phase>('strategy');
  const [refinementCount, setRefinementCount] = useState(0);
  
  // Interactivity
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [humanQuestion, setHumanQuestion] = useState<string | null>(null);
  const [isWaitingForHuman, setIsWaitingForHuman] = useState(false);
  
  // Data
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<{ timestamp: string; message: string }[]>([]);
  const [graphEvents, setGraphEvents] = useState<GraphEvent[]>([]);
  
  // Modals
  const [isErrorLogModalOpen, setIsErrorLogModalOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<{code: string, language: string} | null>(null);

  // Config
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview-high');
  
  // Refs
  const processingRef = useRef(false);
  const sharedKnowledgeBaseRef = useRef('');

  // Helpers
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addErrorLog = (message: string) => {
      setErrorLogs(prev => [...prev, { timestamp: new Date().toISOString(), message }]);
  };

  const clearErrorLogs = () => setErrorLogs([]);

  const setAgentThinking = (agentId: string, isThinking: boolean) => {
    setThinkingAgents(prev => {
      const newSet = new Set(prev);
      if (isThinking) newSet.add(agentId);
      else newSet.delete(agentId);
      return newSet;
    });
  };

  return {
      isLoading, setIsLoading,
      systemStatus, setSystemStatus,
      currentStatus, setCurrentStatus,
      currentPhase, setCurrentPhase,
      refinementCount, setRefinementCount,
      thinkingAgents, setThinkingAgents, setAgentThinking,
      selectedAgents, setSelectedAgents,
      toast, setToast, showToast,
      humanQuestion, setHumanQuestion,
      isWaitingForHuman, setIsWaitingForHuman,
      finalReport, setFinalReport,
      errorLogs, setErrorLogs, addErrorLog, clearErrorLogs,
      graphEvents, setGraphEvents,
      isErrorLogModalOpen, setIsErrorLogModalOpen,
      isKnowledgeBaseOpen, setIsKnowledgeBaseOpen,
      isSessionManagerOpen, setIsSessionManagerOpen,
      isGraphModalOpen, setIsGraphModalOpen,
      isPreviewModalOpen, setIsPreviewModalOpen,
      expandedAgentId, setExpandedAgentId,
      previewCode, setPreviewCode,
      currentSessionId, setCurrentSessionId,
      selectedModel, setSelectedModel,
      processingRef,
      sharedKnowledgeBaseRef
  };
};
