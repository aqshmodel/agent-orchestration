
import { useState, useRef, useEffect } from 'react';
import { Agent, Message } from '../types';
import { AGENTS } from '../constants';
import { generateResponseStream, UploadedFile } from '../services/geminiService';
import { playStartSound, playNotificationSound, playCompletionSound } from '../services/soundService';
import { Type, FunctionDeclaration } from '@google/genai';
import { SessionMetadata } from '../components/SessionManagerModal';

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

const INITIAL_MESSAGE: Message = {
    sender: 'agent',
    content: "A.G.I.S.へようこそ。私はプレジデントです。\nプロジェクトの目標や解決したい課題を教えてください。最適なチームを編成し、解決策を提示します。",
    timestamp: new Date().toLocaleTimeString()
};

// Helper to get model configuration based on UI selection
const getModelConfig = (selection: string) => {
    if (selection === 'gemini-3-pro-preview-high') {
        // High reasoning capability with larger budget
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 32768 } };
    }
    if (selection === 'gemini-3-pro-preview-low') {
        // Lower budget for faster response
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 2048 } };
    }
    if (selection === 'gemini-flash-latest') {
         // Flash doesn't support thinking config in the same way
         return { model: 'gemini-flash-latest', thinkingConfig: undefined };
    }
    
    return { model: selection, thinkingConfig: undefined };
};

export const useAgis = () => {
  // State definitions
  const [messages, setMessages] = useState<Record<string, Message[]>>({
      'president': [INITIAL_MESSAGE]
  });
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
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'waiting' | 'completed' | 'error'>('idle');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview-high');

  // Refs
  const conversationHistoryRef = useRef('');
  const sharedKnowledgeBaseRef = useRef('');
  const processingRef = useRef(false); // To prevent double submission

  // Computed
  const contextChars = conversationHistoryRef.current.length + sharedKnowledgeBaseRef.current.length;

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

  const updateAgentLastMessage = (agentId: string, content: string) => {
    setMessages(prev => {
      const agentMessages = prev[agentId] || [];
      const lastMsg = agentMessages[agentMessages.length - 1];
      
      if (lastMsg && lastMsg.sender === 'agent' && lastMsg.content !== content) {
         // Update existing message (streaming)
         const newMessages = [...agentMessages];
         newMessages[newMessages.length - 1] = { ...lastMsg, content };
         return { ...prev, [agentId]: newMessages };
      } else if (!lastMsg || lastMsg.sender !== 'agent') {
          // New message
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

  const clearErrorLogs = () => setErrorLogs([]);

  const handleResetAll = () => {
      setMessages({ 'president': [INITIAL_MESSAGE] }); // Reset with initial message
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
      conversationHistoryRef.current = '';
      sharedKnowledgeBaseRef.current = '';
      showToast('セッションをリセットしました', 'info');
  };

  const handleClearConversationHistory = () => {
      setMessages({});
      conversationHistoryRef.current = '';
      showToast('対話履歴をクリアしました（知識ベースは維持されます）', 'info');
  };

  const handleClearKnowledgeBase = () => {
      sharedKnowledgeBaseRef.current = '';
      showToast('知識ベースをクリアしました', 'info');
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
            showToast('セッションを保存しました');
        } catch (e) {
            console.error(e);
            showToast('セッションの保存に失敗しました', 'error');
        }
    };

    const handleLoadSession = (id: string) => {
         try {
            const sessionStr = localStorage.getItem(`agis_session_${id}`);
            if (!sessionStr) throw new Error("Session not found");
            
            const sessionData = JSON.parse(sessionStr);
            
            // Restore State
            setMessages(sessionData.state.messages);
            setFinalReport(sessionData.state.finalReport);
            setErrorLogs(sessionData.state.errorLogs);
            setSelectedAgents(new Set(sessionData.state.selectedAgents));
            conversationHistoryRef.current = sessionData.state.conversationHistory;
            sharedKnowledgeBaseRef.current = sessionData.state.sharedKnowledgeBase;
            
            setCurrentSessionId(id);
            showToast('セッションを読み込みました');
         } catch (e) {
             console.error(e);
             showToast('セッションの読み込みに失敗しました', 'error');
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
            showToast('セッションを削除しました');
        } catch (e) {
            console.error(e);
            showToast('削除に失敗しました', 'error');
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

    // Determine model configuration AT THE START of the loop and freeze it for this session
    const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(selectedModel);

    while (loopCount < MAX_LOOPS && !missionComplete) {
        loopCount++;
        setCurrentStatus(`オーケストレーターが思考中... (Cycle ${loopCount})`);
        setAgentThinking('orchestrator', true);

        // Force the model to output thought text BEFORE using tools
        const enforcedSystemPrompt = orchestrator.systemPrompt + `

【重要: 行動規範】
1. **思考の開示 (Mandatory):** ユーザーに対して、現在の状況分析、次の手、その理由を説明する「思考プロセス (Thought)」を**必ず**日本語のテキストで出力してください。
   - 「○○について考える必要がある」「次は××を呼び出す」といった思考の流れを明示してください。
2. **ツールの使用:** 行動（エージェントの呼び出し、完了報告など）は、**必ず**提供されたツール (Function Calling) を使用して実行してください。
3. **フォーマット:** 
   - (1) テキストで思考を記述する。
   - (2) ツールを呼び出す。
   - **禁止:** テキストとして 'Action: AGIS_CMD::...' のようなコマンド文字列をそのまま出力することは厳禁です。必ずToolを使用してください。

例:
"市場分析が必要だと判断しました。アナリストを呼び出します。" -> [Tool: invoke(analyst, ...)]
`;

        const orchestratorResponse = await generateResponseStream(
            enforcedSystemPrompt, 
            currentPrompt, 
            (chunk) => updateAgentLastMessage('orchestrator', chunk),
            conversationHistoryRef.current,
            sharedKnowledgeBaseRef.current,
            activeModel, // Use active config
            false, 
            undefined, 
            ORCHESTRATOR_TOOLS,
            activeThinkingConfig // Use active config
        );
        
        let responseText = orchestratorResponse.text || '';
        
        // Cleanup command text from UI and History if any slipped through (hallucination safeguard)
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
        
        // Collect all agent tasks for parallel execution
        const agentTasks: { agent: Agent, query: string }[] = [];
        let isMissionComplete = false;
        let isWaitingForUser = false;
        let memberAdded = false;

        for (const call of functionCalls) {
            const fnName = call.name;
            const args = call.args as any;
            
            if (fnName === 'complete') {
                isMissionComplete = true;
                missionComplete = true;
                const finalReportText = args.final_report;
                
                setCurrentStatus('プレジデントが最終レポートをレビュー中...');
                
                // Show review request to President
                const reviewPrompt = `オーケストレーターから最終報告書が提出されました。\n\n${finalReportText}\n\nこの報告書を評価基準に基づいてレビューし、承認するか、修正を指示（REINSTRUCT）してください。`;
                addMessage('president', { sender: 'user', content: reviewPrompt, timestamp: new Date().toLocaleTimeString() });

                setAgentThinking('president', true);
                
                const reviewResponse = await generateResponseStream(
                    president.systemPrompt,
                    reviewPrompt,
                    (chunk) => updateAgentLastMessage('president', chunk),
                    conversationHistoryRef.current,
                    sharedKnowledgeBaseRef.current,
                    activeModel, // Use active config
                    false,
                    undefined,
                    undefined,
                    activeThinkingConfig // Use active config
                );
                
                setAgentThinking('president', false);
                const reviewText = reviewResponse.text;
                appendToHistory(`--- President (Phase 2) ---\n${reviewText}`);

                if (reviewText.includes('REINSTRUCT::')) {
                        missionComplete = false;
                        currentPrompt = `プレジデントから修正指示（REINSTRUCT）がありました。\n\n${reviewText}\n\n指示に従い、タスクを再開してください。`;
                        // Show reinstruct order to Orchestrator
                        addMessage('orchestrator', { sender: 'user', content: currentPrompt, timestamp: new Date().toLocaleTimeString() });
                        setCurrentStatus('プレジデントの指示により、プロジェクトを継続します。');
                } else {
                    setFinalReport(reviewText); 
                    setSystemStatus('completed');
                    playCompletionSound();
                    showToast('プロジェクトが完了しました！');
                }
                
            } else if (fnName === 'ask_human') {
                setHumanQuestion(args.question);
                setIsWaitingForHuman(true);
                setSystemStatus('waiting');
                playNotificationSound();
                isWaitingForUser = true;
                // Exit loop to wait for human interaction
                return; 
            } else if (['invoke', 'consult', 'review'].includes(fnName)) {
                let targetAlias = '';
                let query = '';
                
                if (fnName === 'invoke') {
                    targetAlias = args.agent_alias;
                    query = `【タスク指示】\n${args.query}`;
                } else if (fnName === 'consult') {
                    targetAlias = args.to_alias;
                    query = `【相談 from ${args.from_alias}】\n${args.query}`;
                } else if (fnName === 'review') {
                    targetAlias = args.reviewer_alias;
                    query = `【レビュー依頼 (対象: ${args.target_alias}の報告書)】\n${args.query}`;
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
                             agentTasks.push({ agent: targetAgent, query: `【タスク指示】\n${inv.query}` });
                         }
                    });
            } else if (fnName === 'add_member') {
                const targetAgent = AGENTS.find(a => a.alias === args.agent_alias);
                if (targetAgent) {
                    setSelectedAgents(prev => new Set(prev).add(targetAgent.id));
                    appendToHistory(`[System] ${targetAgent.name} (${args.agent_alias}) added to team. Reason: ${args.reason}`);
                    showToast(`${targetAgent.name} がチームに参加しました`, 'info');
                    memberAdded = true;
                }
            }
        }

        // Execute Agent Tasks in Parallel
        if (agentTasks.length > 0 && !isMissionComplete && !isWaitingForUser) {
            const agentNames = agentTasks.map(t => t.agent.name).join(', ');
            setCurrentStatus(`${agentNames} が作業中...`);

            // Show tasks in agent UI
            agentTasks.forEach(t => {
                 addMessage(t.agent.id, { sender: 'user', content: t.query, timestamp: new Date().toLocaleTimeString() });
            });

            // Set thinking state
            setThinkingAgents(prev => {
                const next = new Set(prev);
                agentTasks.forEach(t => next.add(t.agent.id));
                return next;
            });

            const results = await Promise.all(agentTasks.map(async (task) => {
                try {
                    // CodeExecution is automatically enabled in geminiService
                    const agentResponse = await generateResponseStream(
                        task.agent.systemPrompt,
                        task.query,
                        (chunk) => updateAgentLastMessage(task.agent.id, chunk),
                        conversationHistoryRef.current, // Snapshot
                        sharedKnowledgeBaseRef.current,
                        activeModel, // Use active config
                        true, // Use Search if needed (controlled by prop internally but enabled here)
                        undefined,
                        undefined,
                        activeThinkingConfig // Use active config
                    );
                    return { agent: task.agent, text: agentResponse.text };
                } catch (e) {
                     console.error(`Error executing agent ${task.agent.alias}`, e);
                     return { agent: task.agent, text: "エラーが発生しました。" };
                } finally {
                    // Stop thinking individually
                    setThinkingAgents(prev => {
                        const next = new Set(prev);
                        next.delete(task.agent.id);
                        return next;
                    });
                }
            }));

            let combinedResults = "";
            for (const res of results) {
                const { agent, text } = res;
                appendToHistory(`--- ${agent.name} (${agent.alias}) ---\n${text}`);
                combinedResults += `--- ${agent.alias} Report ---\n${text}\n\n`;
                
                const keyInsightsMatch = text.match(/【キーインサイト】([\s\S]*?)(?:【|$)/);
                if (keyInsightsMatch) {
                    sharedKnowledgeBaseRef.current += `\n[${agent.alias}]: ${keyInsightsMatch[1].trim()}\n`;
                }
            }

            // Add a system message to Orchestrator to indicate progress
            addMessage('orchestrator', { 
                sender: 'system', 
                content: "各専門家エージェントからの報告を受領しました。情報を統合し、次のステップを検討します。", 
                timestamp: new Date().toLocaleTimeString() 
            });

            currentPrompt = `エージェントからの報告を受け取りました。\n\n${combinedResults}\n\nこれらを評価し、次の行動を決定してください。`;

        } else if (memberAdded && !isMissionComplete && !isWaitingForUser) {
            addMessage('orchestrator', { 
                sender: 'system', 
                content: "メンバーの追加が完了しました。次のタスクを実行してください。", 
                timestamp: new Date().toLocaleTimeString() 
            });
            currentPrompt = "メンバーを追加しました。現在のチーム構成と状況を踏まえ、次の行動（タスク指示など）を決定してください。";

        } else if (functionCalls.length === 0 && !isMissionComplete && !isWaitingForUser) {
             if (responseText.includes('AGIS_CMD::complete')) {
                 currentPrompt = "タスクが完了した場合は 'complete' ツールを使用してください。まだの場合は次の行動を指示してください。";
             } else {
                 currentPrompt = "状況を評価し、次の行動（ツール呼び出し）を決定してください。";
             }
        }
    }

    // Loop Limit Check
    if (!missionComplete && !isWaitingForHuman && !isLoading && !processingRef.current) {
        setHumanQuestion("自律思考ループの安全上限（30回）に到達しました。\n\n現在のタスクはまだ完了していません。処理を継続しますか？\n継続する場合は「はい」と入力、または具体的な指示を入力して送信してください。");
        setIsWaitingForHuman(true);
        setSystemStatus('waiting');
        playNotificationSound();
    }
  };

  // Main Logic: Orchestrator Loop
  const handleSendMessage = async (prompt: string, files?: UploadedFile[]) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);
      setSystemStatus('processing');
      playStartSound();
      
      // Get config based on selected model (High/Low)
      const { model: activeModel, thinkingConfig: activeThinkingConfig } = getModelConfig(selectedModel);

      try {
        const president = AGENTS.find(a => a.id === 'president');
        if (!president) throw new Error("President agent not found");

        addMessage('president', { sender: 'user', content: prompt, timestamp: new Date().toLocaleTimeString() });
        
        if (files && files.length > 0) {
             appendToHistory(`[User uploaded ${files.length} files]`);
        }
        appendToHistory(`--- User Request ---\n${prompt}`);

        // 2. President Phase 1: Team selection & Initial Instruction
        setCurrentStatus('プレジデントがチームを編成中...');
        setAgentThinking('president', true);
        
        const presResponse = await generateResponseStream(
            president.systemPrompt,
            `ユーザーからの要求: ${prompt}`,
            (chunk) => updateAgentLastMessage('president', chunk),
            conversationHistoryRef.current,
            sharedKnowledgeBaseRef.current,
            activeModel, // Use active config
            true, 
            files, // Pass all files (text, pdf, etc.)
            undefined,
            activeThinkingConfig // Use active config
        );
        
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

        const nextPrompt = `プレジデントからの指示を受け取りました。これよりプロジェクトを開始します。\n\nプレジデントの指示:\n${presText}`;
        
        // Show initial instruction to Orchestrator
        addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
        
        await runOrchestratorLoop(nextPrompt);

      } catch (error: any) {
          console.error(error);
          addErrorLog(error.message || 'Unknown error occurred');
          showToast('エラーが発生しました。エラーログを確認してください。', 'error');
          setSystemStatus('error');
          setCurrentStatus('エラーが発生しました');
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
      
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);

      try {
          const nextPrompt = `ユーザーからの回答: ${answer}\n\nこれを受けて、プロジェクトを再開・継続してください。`;
          // Show user answer to Orchestrator
          addMessage('orchestrator', { sender: 'user', content: nextPrompt, timestamp: new Date().toLocaleTimeString() });
          await runOrchestratorLoop(nextPrompt);
      } catch (error: any) {
          console.error(error);
          addErrorLog(error.message || 'Unknown error occurred');
          showToast('エラーが発生しました。エラーログを確認してください。', 'error');
          setSystemStatus('error');
          setCurrentStatus('エラーが発生しました');
      } finally {
          processingRef.current = false;
          setIsLoading(false);
          setThinkingAgents(new Set());
      }
  };

  return {
    // State
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
    expandedAgentId,
    selectedAgents,
    systemStatus,
    contextChars,
    currentSessionId,
    sharedKnowledgeBaseContent: sharedKnowledgeBaseRef.current,
    selectedModel,

    // Actions
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
    setSelectedModel,
  };
};
