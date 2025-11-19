
import { useState, useRef, useEffect } from 'react';
import { Agent, Message, GraphEvent, Artifact } from '../types';
import { AGENTS } from '../constants';
import { generateResponseStream, UploadedFile, generateImage } from '../services/geminiService';
import { playStartSound, playNotificationSound, playCompletionSound } from '../services/soundService';
import { Type, FunctionDeclaration } from '@google/genai';
import { SessionMetadata } from '../components/SessionManagerModal';
import { useLanguage } from '../contexts/LanguageContext';

// Define Orchestrator Tools
const ORCHESTRATOR_TOOLS: FunctionDeclaration[] = [
  {
    name: 'invoke',
    description: '特定の専門エージェントを呼び出し、タスクを依頼する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agent_alias: { type: Type.STRING, description: 'エージェントのエイリアス' },
        query: { type: Type.STRING, description: 'エージェントへの指示' },
      },
      required: ['agent_alias', 'query'],
    },
  },
  {
    name: 'invoke_parallel',
    description: '複数の専門エージェントを同時に呼び出し、タスクを依頼する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        invocations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agent_alias: { type: Type.STRING },
              query: { type: Type.STRING },
            },
            required: ['agent_alias', 'query'],
          },
        },
      },
      required: ['invocations'],
    },
  },
    {
    name: 'consult',
    description: 'あるエージェントが別のエージェントに質問する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        from_alias: { type: Type.STRING, description: '相談元のエイリアス' },
        to_alias: { type: Type.STRING, description: '相談先のエイリアス' },
        query: { type: Type.STRING, description: '相談内容' },
      },
      required: ['from_alias', 'to_alias', 'query'],
    },
  },
  {
    name: 'add_member',
    description: 'チームに新たな専門エージェントを追加する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agent_alias: { type: Type.STRING, description: '追加するエージェントのエイリアス' },
        reason: { type: Type.STRING, description: '追加理由' },
      },
      required: ['agent_alias', 'reason'],
    },
  },
  {
    name: 'review',
    description: 'あるエージェント(reviewer)に別のエージェント(target)の報告書をレビューさせる。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reviewer_alias: { type: Type.STRING, description: 'レビューを行うエージェント（レビュアー）のエイリアス' },
        target_alias: { type: Type.STRING, description: 'レビュー対象となる報告書を書いたエージェントのエイリアス' },
        query: { type: Type.STRING, description: 'レビュー指示' },
      },
      required: ['reviewer_alias', 'target_alias', 'query'],
    },
  },
  {
    name: 'ask_human',
    description: '人間に質問する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: '質問内容' },
      },
      required: ['question'],
    },
  },
  {
    name: 'complete',
    description: 'ミッションを完了し、最終報告を提出する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        final_report: { type: Type.STRING, description: '最終報告書の内容' },
      },
      required: ['final_report'],
    },
  },
];

// Helper to get model configuration based on UI selection
const getModelConfig = (selection: string) => {
    if (selection === 'gemini-3-pro-preview-high') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 32768 } };
    }
    if (selection === 'gemini-3-pro-preview-low') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 2048 } };
    }
    if (selection === 'gemini-flash-latest') {
         return { model: 'gemini-flash-latest', thinkingConfig: undefined };
    }
    return { model: selection, thinkingConfig: undefined };
};

export const useAgis = () => {
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
  const [isErrorLogModalOpen, setIsErrorLogModalOpen] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false); 
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'waiting' | 'completed' | 'error'>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview-high');
  const [graphEvents, setGraphEvents] = useState<GraphEvent[]>([]); 
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({}); // New state for artifacts
  const processedImageTagsRef = useRef<Set<string>>(new Set()); // Track processed image tags to avoid duplicates
  
  const { language, t } = useLanguage();

  // Refs
  const conversationHistoryRef = useRef('');
  const sharedKnowledgeBaseRef = useRef('');
  const processingRef = useRef(false);

  // Initialization
  useEffect(() => {
     const presidentMessages = messages['president'] || [];
     const isInitialState = presidentMessages.length <= 1;
     
     if (isInitialState) {
         if (presidentMessages.length === 0 || presidentMessages[0].sender === 'agent') {
              setMessages({
                 'president': [{
                    sender: 'agent',
                    content: t.prompts.initialMessage,
                    timestamp: presidentMessages[0]?.timestamp || new Date().toLocaleTimeString()
                }]
             });
         }
     }
  }, [language]);

  const contextChars = conversationHistoryRef.current.length + sharedKnowledgeBaseRef.current.length;
  
  const getSystemInstruction = (basePrompt: string) => {
      return basePrompt + t.prompts.systemInstructionOverride;
  };

  // Helper functions
  const addErrorLog = (message: string) => {
    setErrorLogs(prev => [...prev, { timestamp: new Date().toISOString(), message }]);
  };

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

  const processImageGenerationTags = async (text: string, agentId: string) => {
      // Regex to catch <GENERATE_IMAGE ... />
      // Supports PROMPT and ASPECT attributes
      const tagRegex = /<GENERATE_IMAGE\s+PROMPT="([^"]+)"\s*(?:ASPECT="([^"]+)")?\s*\/>/g;
      let match;
      
      // We iterate through all matches
      while ((match = tagRegex.exec(text)) !== null) {
          const fullTag = match[0];
          const prompt = match[1];
          const aspect = (match[2] || '1:1') as '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
          
          // Simple unique key for deduplication within session
          // We use prompt length to avoid very long key names if prompt is huge
          const tagKey = `${agentId}-${prompt.substring(0, 50)}-${prompt.length}-${aspect}`;
          
          if (!processedImageTagsRef.current.has(tagKey)) {
              processedImageTagsRef.current.add(tagKey);
              
              console.log(`Detected image generation tag: ${prompt} (${aspect})`);
              
              // Trigger async image generation
              // We don't await here to keep the UI responsive, but we update artifacts state when done
              generateImage(prompt, aspect).then(artifact => {
                  if (artifact) {
                      console.log("Image generated successfully:", artifact.id);
                      // Attach prompt as description for easier matching
                      registerArtifacts([artifact]);
                      showToast(t.agentCard.downloadImage + " Ready", 'success');
                  }
              }).catch(err => {
                  console.error("Failed to generate image in background:", err);
              });
          }
      }
  };

  const updateAgentLastMessage = (agentId: string, content: string) => {
    // Trigger image generation check on every chunk update
    // This ensures we catch tags as they appear
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

  const clearErrorLogs = () => setErrorLogs([]);

  const handleResetAll = () => {
      setMessages({ 'president': [{
          sender: 'agent',
          content: t.prompts.initialMessage,
          timestamp: new Date().toLocaleTimeString()
      }] }); 
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
      setArtifacts({}); // Reset Artifacts
      processedImageTagsRef.current = new Set();
      conversationHistoryRef.current = '';
      sharedKnowledgeBaseRef.current = '';
      showToast(t.status.reset, 'info');
  };

  const handleClearConversationHistory = () => {
      setMessages({});
      conversationHistoryRef.current = '';
      showToast(t.status.historyCleared, 'info');
  };

  const handleClearKnowledgeBase = () => {
      sharedKnowledgeBaseRef.current = '';
      showToast(t.status.brainCleared, 'info');
  };

    const serializeSession = (name: string) => {
        const sessionData = {
            id: Date.now().toString(),
            name,
            lastModified: Date.now(),
            state: {
                messages,
                finalReport,
                errorLogs,
                selectedAgents: Array.from(selectedAgents),
                conversationHistory: conversationHistoryRef.current,
                sharedKnowledgeBase: sharedKnowledgeBaseRef.current,
                graphEvents,
                artifacts, // Save Artifacts
            }
        };
        return sessionData;
    };

    const handleSaveSession = (name: string) => {
        try {
            const sessionData = serializeSession(name);
            const indexStr = localStorage.getItem('agis_sessions_index');
            let index: SessionMetadata[] = indexStr ? JSON.parse(indexStr) : [];
            
            index.push({
                id: sessionData.id,
                name: sessionData.name,
                lastModified: sessionData.lastModified,
                preview: conversationHistoryRef.current.substring(0, 100) + '...'
            });
            
            localStorage.setItem('agis_sessions_index', JSON.stringify(index));
            localStorage.setItem(`agis_session_${sessionData.id}`, JSON.stringify(sessionData));
            
            setCurrentSessionId(sessionData.id);
            showToast(t.status.sessionSaved);
        } catch (e) {
            console.error(e);
            showToast(t.status.saveFailed, 'error');
        }
    };

    const handleLoadSession = (id: string) => {
         try {
            const sessionStr = localStorage.getItem(`agis_session_${id}`);
            if (!sessionStr) throw new Error("Session not found");
            
            const sessionData = JSON.parse(sessionStr);
            
            setMessages(sessionData.state.messages);
            setFinalReport(sessionData.state.finalReport);
            setErrorLogs(sessionData.state.errorLogs);
            setSelectedAgents(new Set(sessionData.state.selectedAgents));
            conversationHistoryRef.current = sessionData.state.conversationHistory;
            sharedKnowledgeBaseRef.current = sessionData.state.sharedKnowledgeBase;
            setGraphEvents(sessionData.state.graphEvents || []);
            setArtifacts(sessionData.state.artifacts || {}); // Load Artifacts
            processedImageTagsRef.current = new Set(); // Reset tag tracking on load
            
            setCurrentSessionId(id);
            showToast(t.status.sessionLoaded);
         } catch (e) {
             console.error(e);
             showToast(t.status.loadFailed, 'error');
         }
    };

    const handleDeleteSession = (id: string) => {
        try {
            localStorage.removeItem(`agis_session_${id}`);
            const indexStr = localStorage.getItem('agis_sessions_index');
            if (indexStr) {
                let index: SessionMetadata[] = JSON.parse(indexStr);
                index = index.filter(s => s.id !== id);
                localStorage.setItem('agis_sessions_index', JSON.stringify(index));
            }
            if (currentSessionId === id) {
                handleNewSession();
            }
            showToast(t.status.sessionDeleted);
        } catch (e) {
            console.error(e);
            showToast(t.status.deleteFailed, 'error');
        }
    };
    
    const handleNewSession = handleResetAll;

  const runOrchestratorLoop = async (initialPrompt: string) => {
    const orchestrator = AGENTS.find(a => a.id === 'orchestrator');
    const president = AGENTS.find(a => a.id === 'president');
    
    if (!orchestrator || !president) throw new Error("Core agents not found");

    let currentPrompt = initialPrompt;
    let loopCount = 0;
    const MAX_LOOPS = 50; 
    let missionComplete = false;

    const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(selectedModel);

    while (loopCount < MAX_LOOPS && !missionComplete) {
        loopCount++;
        setCurrentStatus(t.status.orchestratorThinking.replace('{count}', loopCount.toString()));
        setAgentThinking('orchestrator', true);

        const enforcedSystemPrompt = getSystemInstruction(orchestrator.systemPrompt) + t.prompts.orchestratorMandatoryRules;

        const orchestratorResponse = await generateResponseStream(
            enforcedSystemPrompt, 
            currentPrompt, 
            (chunk) => updateAgentLastMessage('orchestrator', chunk),
            conversationHistoryRef.current,
            sharedKnowledgeBaseRef.current,
            activeModel,
            false, 
            undefined, 
            ORCHESTRATOR_TOOLS,
            activeThinkingConfig,
            language,
            'orchestrator'
        );
        
        // Save any artifacts produced by Orchestrator (unlikely but possible)
        if (orchestratorResponse.artifacts && orchestratorResponse.artifacts.length > 0) {
            registerArtifacts(orchestratorResponse.artifacts);
        }
        
        let responseText = orchestratorResponse.text || '';
        
        const cleanedText = responseText
            .replace(/^(?:Action|行動)[:：\s]*AGIS_CMD::[\s\S]*$/im, '')
            .replace(/AGIS_CMD::[\w_]+\s*\([\s\S]*?\)/g, '')
            .trim();
        
        if (cleanedText !== responseText) {
             updateAgentLastMessage('orchestrator', cleanedText);
        }

        if (cleanedText) {
            appendToHistory(`--- Project Orchestrator ---\n${cleanedText}`);
        }
        
        setAgentThinking('orchestrator', false);

        const functionCalls = orchestratorResponse.functionCalls || [];
        
        const agentTasks: { agent: Agent, query: string }[] = [];
        let isMissionComplete = false;
        let isWaitingForUser = false;
        let memberAdded = false;

        for (const call of functionCalls) {
            const fnName = call.name;
            const args = call.args as any;
            
            if (fnName === 'complete') {
                // Graph: Orchestrator -> President (Report)
                addGraphEvent({ from: 'orchestrator', to: 'president', type: 'report', timestamp: Date.now() });

                isMissionComplete = true;
                missionComplete = true;
                const finalReportText = args.final_report;
                
                setCurrentStatus(t.status.presidentReviewing);
                
                const reviewPrompt = t.prompts.orchestratorReviewRequest.replace('{finalReportText}', finalReportText);
                addMessage('president', { sender: 'user', content: reviewPrompt, timestamp: new Date().toLocaleTimeString() });

                setAgentThinking('president', true);
                
                const reviewResponse = await generateResponseStream(
                    getSystemInstruction(president.systemPrompt),
                    reviewPrompt,
                    (chunk) => updateAgentLastMessage('president', chunk),
                    conversationHistoryRef.current,
                    sharedKnowledgeBaseRef.current,
                    activeModel,
                    false,
                    undefined,
                    undefined,
                    activeThinkingConfig,
                    language,
                    'president'
                );
                
                if (reviewResponse.artifacts && reviewResponse.artifacts.length > 0) {
                    registerArtifacts(reviewResponse.artifacts);
                }
                
                setAgentThinking('president', false);
                const reviewText = reviewResponse.text;
                appendToHistory(`--- President (Phase 2) ---\n${reviewText}`);

                if (reviewText.includes('REINSTRUCT::')) {
                        missionComplete = false;
                        currentPrompt = t.prompts.reinstructReceived.replace('{reviewText}', reviewText);
                        addMessage('orchestrator', { sender: 'user', content: currentPrompt, timestamp: new Date().toLocaleTimeString() });
                        
                        // Graph: President -> Orchestrator (Instruction)
                        addGraphEvent({ from: 'president', to: 'orchestrator', type: 'instruction', timestamp: Date.now() });
                        
                        setCurrentStatus(t.status.presidentReinstructing);
                } else {
                    setFinalReport(reviewText); 
                    setSystemStatus('completed');
                    playCompletionSound();
                    showToast(t.status.completed);
                }
                
            } else if (fnName === 'ask_human') {
                setHumanQuestion(args.question);
                setIsWaitingForHuman(true);
                setSystemStatus('waiting');
                playNotificationSound();
                isWaitingForUser = true;
                return; 
            } else if (['invoke', 'consult', 'review'].includes(fnName)) {
                let targetAlias = '';
                let query = '';
                
                if (fnName === 'invoke') {
                    targetAlias = args.agent_alias;
                    query = t.prompts.taskInstruction.replace('{query}', args.query);
                    
                    // Graph: Orchestrator -> Agent (Invoke)
                    addGraphEvent({ from: 'orchestrator', to: targetAlias, type: 'invoke', timestamp: Date.now() });

                } else if (fnName === 'consult') {
                    targetAlias = args.to_alias;
                    query = t.prompts.consultation.replace('{from}', args.from_alias).replace('{query}', args.query);
                    
                    // Graph: From -> To (Consult)
                    addGraphEvent({ from: args.from_alias, to: args.to_alias, type: 'consult', timestamp: Date.now() });

                } else if (fnName === 'review') {
                    targetAlias = args.reviewer_alias;
                    query = t.prompts.reviewRequest.replace('{target}', args.target_alias).replace('{query}', args.query);
                    
                    addGraphEvent({ from: 'orchestrator', to: args.reviewer_alias, type: 'invoke', label: 'Review Request', timestamp: Date.now() });
                    addGraphEvent({ from: args.reviewer_alias, to: args.target_alias, type: 'review', timestamp: Date.now() });
                }
                
                const targetAgent = AGENTS.find(a => a.alias === targetAlias);
                if (targetAgent) {
                    agentTasks.push({ agent: targetAgent, query });
                } else {
                    console.warn(`Agent alias ${targetAlias} not found`);
                }

            } else if (fnName === 'invoke_parallel') {
                    const invocations = args.invocations || [];
                    invocations.forEach((inv: any) => {
                        const targetAgent = AGENTS.find(a => a.alias === inv.agent_alias);
                         if (targetAgent) {
                             agentTasks.push({ agent: targetAgent, query: t.prompts.taskInstruction.replace('{query}', inv.query) });
                             // Graph: Orchestrator -> Agent (Invoke)
                             addGraphEvent({ from: 'orchestrator', to: inv.agent_alias, type: 'invoke', timestamp: Date.now() });
                         }
                    });
            } else if (fnName === 'add_member') {
                const targetAgent = AGENTS.find(a => a.alias === args.agent_alias);
                if (targetAgent) {
                    setSelectedAgents(prev => new Set(prev).add(targetAgent.id));
                    appendToHistory(`[System] ${targetAgent.name} (${args.agent_alias}) added to team. Reason: ${args.reason}`);
                    
                    // Graph: Orchestrator -> Agent (Add)
                    addGraphEvent({ from: 'orchestrator', to: args.agent_alias, type: 'add_member', label: 'Added', timestamp: Date.now() });

                    const transAgentName = (t.agents as any)[targetAgent.id]?.name || targetAgent.name;
                    const message = language === 'en' 
                        ? `${transAgentName} has joined the team.`
                        : `${transAgentName} がチームに参加しました`;
                        
                    showToast(message, 'info');
                    memberAdded = true;
                }
            }
        }

        if (agentTasks.length > 0 && !isMissionComplete && !isWaitingForUser) {
            const agentNames = agentTasks.map(task => {
                const transAgent = (t.agents as any)?.[task.agent.id]; 
                return transAgent ? transAgent.name : task.agent.name; 
            }).join(', ');
            
            setCurrentStatus(t.status.agentsWorking.replace('{names}', agentNames));

            agentTasks.forEach(task => {
                 addMessage(task.agent.id, { sender: 'user', content: task.query, timestamp: new Date().toLocaleTimeString() });
            });

            setThinkingAgents(prev => {
                const next = new Set(prev);
                agentTasks.forEach(task => next.add(task.agent.id));
                return next;
            });

            const results = await Promise.all(agentTasks.map(async (task) => {
                try {
                    const agentResponse = await generateResponseStream(
                        getSystemInstruction(task.agent.systemPrompt),
                        task.query,
                        (chunk) => updateAgentLastMessage(task.agent.id, chunk),
                        conversationHistoryRef.current, 
                        sharedKnowledgeBaseRef.current,
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
                    setThinkingAgents(prev => {
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
                    registerArtifacts(artifacts);
                }
                
                appendToHistory(`--- ${agent.name} (${agent.alias}) ---\n${text}`);
                combinedResults += `--- ${agent.alias} Report ---\n${text}\n\n`;
                
                // Extract Key Insights using regex compatible with multi-language headers
                const keyInsightsMatch = text.match(/(?:【キーインサイト】|(?:\*\*|##|\[)?\s*Key Insights\s*(?:\*\*|\]|:)?)([\s\S]*?)(?=(?:【|\[Orchestrator|\[Next|AGIS_CMD|REINSTRUCT|オーケストレーターへの提案|Proposals to Orchestrator|\*\*Proposals|$))/i);
                if (keyInsightsMatch) {
                    sharedKnowledgeBaseRef.current += `\n[${agent.alias}]: ${keyInsightsMatch[1].trim()}\n`;
                }
            }

            addMessage('orchestrator', { 
                sender: 'system', 
                content: t.status.agentsReported, 
                timestamp: new Date().toLocaleTimeString() 
            });

            currentPrompt = t.prompts.agentsReportedPrompt.replace('{combinedResults}', combinedResults);

        } else if (memberAdded && !isMissionComplete && !isWaitingForUser) {
            addMessage('orchestrator', { 
                sender: 'system', 
                content: t.status.memberAdded, 
                timestamp: new Date().toLocaleTimeString() 
            });
            currentPrompt = t.prompts.memberAddedPrompt;

        } else if (functionCalls.length === 0 && !isMissionComplete && !isWaitingForUser) {
             if (responseText.includes('AGIS_CMD::complete')) {
                 currentPrompt = t.prompts.checkCompletePrompt;
             } else {
                 currentPrompt = t.prompts.evaluateSituationPrompt;
             }
        }
    }

    if (!missionComplete && !isWaitingForHuman && !isLoading && !processingRef.current) {
        setHumanQuestion(t.status.loopLimit);
        setIsWaitingForHuman(true);
        setSystemStatus('waiting');
        playNotificationSound();
    }
  };

  const handleSendMessage = async (prompt: string, files?: UploadedFile[]) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);
      setSystemStatus('processing');
      playStartSound();
      
      const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(selectedModel);

      try {
        const president = AGENTS.find(a => a.id === 'president');
        if (!president) throw new Error("President agent not found");

        addMessage('president', { sender: 'user', content: prompt, timestamp: new Date().toLocaleTimeString() });
        
        // Graph: User -> President
        addGraphEvent({ from: 'User', to: 'president', type: 'invoke', timestamp: Date.now() });
        
        if (files && files.length > 0) {
             appendToHistory(`[User uploaded ${files.length} files]`);
        }
        appendToHistory(`--- User Request ---\n${prompt}`);

        setCurrentStatus(t.status.presidentThinking);
        setAgentThinking('president', true);
        
        const presResponse = await generateResponseStream(
            getSystemInstruction(president.systemPrompt),
            `${t.prompts.userRequestPrefix}${prompt}`,
            (chunk) => updateAgentLastMessage('president', chunk),
            conversationHistoryRef.current,
            sharedKnowledgeBaseRef.current,
            activeModel, 
            true, 
            files,
            undefined,
            activeThinkingConfig,
            language,
            'president'
        );
        
        if (presResponse.artifacts && presResponse.artifacts.length > 0) {
             registerArtifacts(presResponse.artifacts);
        }
        
        setAgentThinking('president', false);
        const presText = presResponse.text;
        appendToHistory(`--- President (Phase 1) ---\n${presText}`);
        
        const teamMatch = presText.match(/AGIS_TEAM::\[(.*?)\]/);
        if (teamMatch) {
            const aliases = teamMatch[1].split(',').map(s => s.trim());
            const newSelectedAgents = new Set<string>();
            aliases.forEach(alias => {
                const agent = AGENTS.find(a => a.alias === alias);
                if (agent) newSelectedAgents.add(agent.id);
            });
            setSelectedAgents(newSelectedAgents);
        }

        const nextPrompt = t.prompts.presidentInstructionReceived + presText;
        
        addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
        
        // Graph: President -> Orchestrator
        addGraphEvent({ from: 'president', to: 'orchestrator', type: 'invoke', timestamp: Date.now() });
        
        await runOrchestratorLoop(nextPrompt);

      } catch (error: any) {
          console.error(error);
          addErrorLog(error.message || 'Unknown error occurred');
          const errorMsg = language === 'en' 
             ? 'An error occurred. Please check the error log.'
             : 'エラーが発生しました。エラーログを確認してください。';
          showToast(errorMsg, 'error');
          setSystemStatus('error');
          setCurrentStatus(t.status.error);
      } finally {
          processingRef.current = false;
          setIsLoading(false);
          setThinkingAgents(new Set()); 
      }
  };

  const handleHumanResponse = async (answer: string) => {
      setHumanQuestion(null);
      setIsWaitingForHuman(false);
      
      appendToHistory(`--- User Answer ---\n${answer}`);
      // Graph: User -> Orchestrator (Answer)
      addGraphEvent({ from: 'User', to: 'orchestrator', type: 'invoke', label: 'Answer', timestamp: Date.now() });
      
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);

      try {
          const nextPrompt = t.prompts.userAnswerReceived.replace('{answer}', answer);
          addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
          await runOrchestratorLoop(nextPrompt);
      } catch (error: any) {
          console.error(error);
          addErrorLog(error.message || 'Unknown error occurred');
          const errorMsg = language === 'en' 
             ? 'An error occurred. Please check the error log.'
             : 'エラーが発生しました。エラーログを確認してください。';
          showToast(errorMsg, 'error');
          setSystemStatus('error');
          setCurrentStatus(t.status.error);
      } finally {
          processingRef.current = false;
          setIsLoading(false);
          setThinkingAgents(new Set());
      }
  };

  return {
    messages,
    isLoading,
    thinkingAgents,
    finalReport,
    toast,
    humanQuestion,
    isWaitingForHuman,
    currentStatus,
    errorLogs,
    isErrorLogModalOpen,
    isKnowledgeBaseOpen,
    isSessionManagerOpen,
    isGraphModalOpen, 
    expandedAgentId,
    selectedAgents,
    systemStatus,
    contextChars,
    currentSessionId,
    sharedKnowledgeBaseContent: sharedKnowledgeBaseRef.current,
    selectedModel,
    graphEvents,
    artifacts, // Export artifacts to consumers

    handleSendMessage,
    handleHumanResponse,
    handleResetAll,
    handleClearConversationHistory,
    handleClearKnowledgeBase,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleNewSession,
    clearErrorLogs,
    setExpandedAgentId,
    setIsErrorLogModalOpen,
    setIsKnowledgeBaseOpen,
    setIsSessionManagerOpen,
    setIsGraphModalOpen,
    setSelectedModel,
  };
};
