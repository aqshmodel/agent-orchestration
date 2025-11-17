
import React, { useState, useRef, useEffect } from 'react';
import { AGENTS } from './constants';
import { Agent, Message, Team } from './types';
import AgentCard from './components/AgentCard';
import UserInput from './components/UserInput';
import Toast from './components/Toast';
import QuestionModal from './components/QuestionModal';
import ErrorLogModal from './components/ErrorLogModal';
import { generateResponse, generateResponseStream } from './services/geminiService';
import { TEAM_COLORS } from './constants';
import { playStartSound, playNotificationSound, playCompletionSound } from './services/soundService';


type ToastMessage = {
  message: string;
  type: 'success' | 'info' | 'error';
};

type ErrorLog = {
  timestamp: string;
  message: string;
};

type SystemStatus = 'idle' | 'processing' | 'waiting' | 'completed' | 'error';

const App: React.FC = () => {
  const getJSTTimestamp = () => new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false });

  const getInitialMessages = (): Record<string, Message[]> => ({
    president: [{
      sender: 'agent',
      content: 'ようこそ、A.G.I.S.へ。私がプレジデントです。どのようなプロジェクトについて考察しましょうか？指示をお待ちしています。',
      timestamp: getJSTTimestamp(),
    }]
  });

  const [messages, setMessages] = useState<Record<string, Message[]>>(getInitialMessages());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(new Set());
  const [finalReport, setFinalReport] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [humanQuestion, setHumanQuestion] = useState<string | null>(null);
  const [isWaitingForHuman, setIsWaitingForHuman] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isErrorLogModalOpen, setIsErrorLogModalOpen] = useState<boolean>(false);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('idle');
  
  const conversationHistoryRef = useRef<string>('');
  const isOrchestrationRunning = useRef<boolean>(false);

  // Dynamic Background Logic
  const getBackgroundGradient = (status: SystemStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-gradient-to-br from-gray-900 via-slate-900 to-blue-950';
      case 'processing':
        return 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950';
      case 'waiting':
        return 'bg-gradient-to-br from-gray-900 via-gray-800 to-amber-950';
      case 'completed':
        return 'bg-gradient-to-br from-gray-900 via-teal-950 to-emerald-950';
      case 'error':
        return 'bg-gradient-to-br from-gray-900 via-red-950 to-pink-950';
      default:
        return 'bg-gradient-to-br from-gray-900 via-slate-900 to-blue-950';
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('agis-error-logs');
      if (savedLogs) {
        setErrorLogs(JSON.parse(savedLogs));
      }
    } catch (e) {
      console.error("Failed to parse error logs from localStorage", e);
    }
    setToast({ message: "A.G.I.S.へようこそ。指示を開始してください。", type: "info" });
  }, []);

  // Scroll to thinking agent
  useEffect(() => {
    const thinkingAgentIds = Array.from(thinkingAgents);
    if (thinkingAgentIds.length > 0) {
      const latestAgentId = thinkingAgentIds[thinkingAgentIds.length - 1];
      if (latestAgentId !== 'president' && latestAgentId !== 'orchestrator') {
        const element = document.getElementById(`agent-card-${latestAgentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [thinkingAgents]);

  const addErrorLog = (errorMessage: string) => {
    const newLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: errorMessage,
    };
    setErrorLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog];
      try {
        localStorage.setItem('agis-error-logs', JSON.stringify(updatedLogs));
      } catch (e) {
        console.error("Failed to save error logs to localStorage", e);
      }
      return updatedLogs;
    });
    setToast({ message: "エラーが発生しました。ログを確認してください。", type: "error" });
    setSystemStatus('error');
  };
  
  const addMessage = (agentId: string, message: Omit<Message, 'timestamp'>) => {
    const content = message.content;
    const senderName = message.sender === 'user' ? 'User' : AGENTS.find(a => a.id === agentId)?.name || 'System';
    
    let historyHeader;
    if (message.sender === 'user' && agentId === 'orchestrator') {
      historyHeader = `--- ユーザーからの回答 ---`;
    } else if (message.sender === 'agent' && agentId !== 'orchestrator' && agentId !== 'president') {
      historyHeader = `--- ${senderName}からの報告書 ---`;
    } else {
      historyHeader = `--- ${senderName} ---`;
    }
    
    conversationHistoryRef.current += `\n\n${historyHeader}\n${content}`;
    setMessages(prev => ({ ...prev, [agentId]: [...(prev[agentId] || []), { ...message, timestamp: getJSTTimestamp() }] }));
  };

  const updateAgentLastMessage = (agentId: string, content: string) => {
    setMessages(prev => {
      const agentMessages = prev[agentId] || [];
      if (agentMessages.length === 0) return prev;

      const lastMessage = agentMessages[agentMessages.length - 1];
      const updatedMessage = { ...lastMessage, content };
      
      return {
        ...prev,
        [agentId]: [...agentMessages.slice(0, -1), updatedMessage]
      };
    });
  };

  const setAgentThinking = (agentId: string, isThinking: boolean) => {
    setThinkingAgents(prev => {
      const newSet = new Set(prev);
      if (isThinking) newSet.add(agentId); else newSet.delete(agentId);
      return newSet;
    });
  };

  const resetState = () => {
    setMessages(getInitialMessages());
    setIsLoading(false);
    setThinkingAgents(new Set());
    setFinalReport(null);
    setToast({ message: "新規セッションを開始しました。", type: "info" });
    setHumanQuestion(null);
    setIsWaitingForHuman(false);
    setCurrentStatus('');
    conversationHistoryRef.current = '';
    isOrchestrationRunning.current = false;
    setSelectedAgents(new Set());
    setExpandedAgentId(null);
    setSystemStatus('idle');
  };

  const parsePresidentInitialResponse = (response: string): { directive: string; team: string[] } => {
    const teamMatch = response.match(/AGIS_TEAM::\[([^\]]*)\]/);
    const team = teamMatch ? teamMatch[1].split(',').map(t => t.trim()) : [];
    const directive = response.replace(/AGIS_TEAM::\[[^\]]*\]\n?/, '').trim();
    return { directive, team };
  };
  
  const handleSendMessage = async (prompt: string, imageBase64?: string) => {
    resetState();
    setIsLoading(true);
    isOrchestrationRunning.current = true;
    setSystemStatus('processing');
    playStartSound(); // Sonic Interface: Start

    const initialUserPrompt = imageBase64 
        ? `ユーザーからの最初の指示: ${prompt} (画像が添付されています)`
        : `ユーザーからの最初の指示: ${prompt}`;
    conversationHistoryRef.current = initialUserPrompt;

    addMessage('president', { sender: 'user', content: prompt });
    if (imageBase64) {
        setToast({ message: "画像付きの指示を送信しました。", type: "info" });
    }

    try {
      setCurrentStatus('プレジデントがチームを編成し、戦略を立案しています...');
      setAgentThinking('president', true);
      
      addMessage('president', { sender: 'agent', content: '' });
      
      const president = AGENTS.find(a => a.id === 'president')!;
      const presidentResponse = await generateResponseStream(
          president.systemPrompt, 
          prompt, 
          (chunk) => updateAgentLastMessage('president', chunk),
          undefined, 
          'gemini-2.5-flash', 
          true,
          imageBase64
      );
      
      conversationHistoryRef.current += `\n\n--- President ---\n${presidentResponse}`;

      setAgentThinking('president', false);

      const { directive, team } = parsePresidentInitialResponse(presidentResponse);
      const teamAgentIds = team
        .map(alias => AGENTS.find(a => a.alias === alias)?.id)
        .filter((id): id is string => !!id);
      setSelectedAgents(new Set(teamAgentIds));
      
      if (!directive || team.length === 0) {
        throw new Error("プレジデントからの指示またはチーム編成が無効です。");
      }
      
      const initialOrchestratorPrompt = `大統領からの指示:\n${directive}\n\n許可されたエージェント: [${team.join(', ')}]`;
      addMessage('orchestrator', { sender: 'system', content: initialOrchestratorPrompt });
      runOrchestrationLoop();

    } catch (error) {
      console.error("An error occurred during the initial phase:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage('president', { sender: 'system', content: `初期化中にエラーが発生しました: ${errorMessage}` });
      addErrorLog(`Initial Phase Error: ${errorMessage}`);
      setIsLoading(false);
      isOrchestrationRunning.current = false;
      setSystemStatus('error');
    }
  };
  
  const handleHumanResponse = (answer: string) => {
    setIsWaitingForHuman(false);
    setHumanQuestion(null);
    addMessage('orchestrator', { sender: 'user', content: answer });
    setSystemStatus('processing'); // Back to processing

    const triggerPrompt = `
COMMAND::RECEIVE_HUMAN_INPUT
ユーザーから回答がありました。直前の停止状態を解除し、この回答を評価して次のアクションへ進んでください。
ユーザー回答: "${answer}"
`.trim();
    
    isOrchestrationRunning.current = true;
    runOrchestrationLoop(triggerPrompt);
  };

  const runOrchestrationLoop = async (overridePrompt?: string) => {
    setIsLoading(true);
    setSystemStatus('processing');
    const orchestrator = AGENTS.find(a => a.id === 'orchestrator')!;

    let loopCount = 0;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (isOrchestrationRunning.current && loopCount < 15) {
      loopCount++;
      try {
        setCurrentStatus('オーケストレーターが次の行動を計画しています...');
        setAgentThinking('orchestrator', true);
        
        let currentPrompt = (loopCount === 1 && overridePrompt) 
            ? overridePrompt 
            : "対話履歴を元に次のアクションを決定してください。";
            
        if (retryCount > 0 && retryCount <= MAX_RETRIES) {
             currentPrompt += "\n\n前回のアクション生成で構文エラーが発生しました。正しいフォーマットで再生成してください。";
        }

        addMessage('orchestrator', { sender: 'agent', content: '' });
        
        const orchestratorResponse = await generateResponseStream(
            orchestrator.systemPrompt, 
            currentPrompt, 
            (chunk) => updateAgentLastMessage('orchestrator', chunk),
            conversationHistoryRef.current, 
            'gemini-2.5-pro'
        );
        
        conversationHistoryRef.current += `\n\n--- Project Orchestrator ---\n${orchestratorResponse}`;
        
        setAgentThinking('orchestrator', false);

        if (!orchestratorResponse) {
          throw new Error("オーケストレーターからの応答が空です。処理を続行できません。");
        }
        
        const [thought, action] = parseOrchestratorResponse(orchestratorResponse);

        if (orchestratorResponse.includes('AGIS_CMD::') && !action) {
             throw new Error("コマンドの構文解析に失敗しました。AGIS_CMDのフォーマットを確認してください。");
        }

        if (!action) {
          if(retryCount < MAX_RETRIES) {
             addMessage('orchestrator', { sender: 'system', content: '（アクションが検出されませんでした。再試行します。）' });
             retryCount++;
             continue;
          } else {
             throw new Error("有効なアクションを生成できませんでした。");
          }
        }
        
        const shouldContinue = await handleAction(action);
        
        retryCount = 0;

        if (!shouldContinue) {
          isOrchestrationRunning.current = false;
          break;
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.warn(`Orchestration Loop Error (Retry ${retryCount}/${MAX_RETRIES}):`, errorMsg);
        
        if (retryCount < MAX_RETRIES) {
            addErrorLog(`Auto-Healing Triggered: ${errorMsg}`);
            addMessage('orchestrator', { sender: 'system', content: `システムエラー（自己修復中）: ${errorMsg}` });
            retryCount++;
            continue;
        } else {
            addMessage('orchestrator', { sender: 'system', content: `オーケストレーションループで致命的なエラーが発生しました: ${errorMsg}`});
            addErrorLog(`Orchestration Fatal Error: ${errorMsg}`);
            isOrchestrationRunning.current = false;
            setSystemStatus('error');
            break;
        }
      }
    }

    if (isOrchestrationRunning.current === false && !isWaitingForHuman && systemStatus !== 'completed' && systemStatus !== 'error') {
        setIsLoading(false);
        setThinkingAgents(new Set());
        setSystemStatus('idle'); // Fallback if not completed explicitly
    }
  };

  const parseOrchestratorResponse = (response: string): [string | null, string | null] => {
    if (!response || !response.trim()) return [null, null];
    const actionMatch = response.match(/AGIS_CMD::\w+\([\s\S]*\)/s);
    const action = actionMatch?.[0]?.trim() ?? null;
    let thought = response;
    if(action) {
        thought = response.split(action)[0];
    }
    thought = thought.replace(/思考:|Thought:|行動:|Action:/gi, '').trim();
    return [thought || null, action];
  };

  const handleAction = async (action: string): Promise<boolean> => {
    if (action.startsWith('AGIS_CMD::invoke(')) {
        const match = action.match(/AGIS_CMD::invoke\(([^,]+),\s*"([\s\S]*)"\)/);
        if (!match) throw new Error("invokeコマンドの引数フォーマットが不正です。");

        const [, agentAlias, query] = match;
        const agent = AGENTS.find(a => a.alias === agentAlias.trim());
        if (agent) {
            setCurrentStatus(`${agent.name}がタスクを実行中...`);
            setAgentThinking(agent.id, true);
            addMessage(agent.id, { sender: 'system', content: `タスク受信:\n${query}` });
            
            addMessage(agent.id, { sender: 'agent', content: '' });
            const response = await generateResponseStream(
                agent.systemPrompt, 
                query,
                (chunk) => updateAgentLastMessage(agent.id, chunk),
                undefined, 
                'gemini-2.5-pro'
            );
            
            conversationHistoryRef.current += `\n\n--- ${agent.name}からの報告書 ---\n${response}`;
            setAgentThinking(agent.id, false);
        } else {
             throw new Error(`指定されたエージェント(${agentAlias})が見つかりません。`);
        }
    } else if (action.startsWith('AGIS_CMD::invoke_parallel(')) {
        const tasks: { agent: any; query: string }[] = [];
        const taskRegex = /invoke\(([^,]+),\s*"([\s\S]*?)"\)/g;
        let match;
        while ((match = taskRegex.exec(action)) !== null) {
            const [, agentAlias, query] = match;
            const agent = AGENTS.find(a => a.alias === agentAlias.trim());
            if(agent) tasks.push({ agent, query });
        }
        
        if (tasks.length === 0) throw new Error("invoke_parallelコマンド内のタスク解析に失敗しました。");

        setCurrentStatus(`${tasks.map(t => t.agent.name).join(', ')}が並列でタスクを実行中...`);
        tasks.forEach(t => {
            setAgentThinking(t.agent.id, true);
            addMessage(t.agent.id, { sender: 'system', content: `タスク受信:\n${t.query}` });
            addMessage(t.agent.id, { sender: 'agent', content: '' });
        });

        await Promise.all(tasks.map(async task => {
            const response = await generateResponseStream(
                task.agent.systemPrompt, 
                task.query, 
                (chunk) => updateAgentLastMessage(task.agent.id, chunk),
                undefined, 
                'gemini-2.5-pro'
            );
            conversationHistoryRef.current += `\n\n--- ${task.agent.name}からの報告書 ---\n${response}`;
            setAgentThinking(task.agent.id, false);
        }));
    } else if (action.startsWith('AGIS_CMD::ask_human(')) {
        const match = action.match(/AGIS_CMD::ask_human\("([\s\S]*)"\)/);
        if (!match) throw new Error("ask_humanコマンドの引数フォーマットが不正です。");

        const question = match[1];
        setCurrentStatus('ユーザーからの応答を待っています...');
        addMessage('orchestrator', { sender: 'agent', content: `ユーザーへの質問:\n${question}` });
        setHumanQuestion(question);
        setIsWaitingForHuman(true);
        setSystemStatus('waiting');
        playNotificationSound(); // Sonic Interface: Notification
        return false;
    } else if (action.startsWith('AGIS_CMD::complete(')) {
        const match = action.match(/AGIS_CMD::complete\("([\s\S]*)"\)/);
        if (!match) throw new Error("completeコマンドの引数フォーマットが不正です。");

        const orchestratorReport = match[1];
        addMessage('orchestrator', { sender: 'agent', content: `最終報告:\n${orchestratorReport}` });
        
        await runPresidentReview(orchestratorReport);
    } else {
        throw new Error("不明なコマンドです: " + action.substring(0, 50) + "...");
    }
    return true;
  };
  
  const runPresidentReview = async (orchestratorReport: string) => {
    setCurrentStatus('プレジデントが報告書をレビューしています...');
    setAgentThinking('president', true);
    const president = AGENTS.find(a => a.id === 'president')!;
    const reviewPrompt = `オーケストレーターからの統合報告書です。これをレビューし、ユーザーの当初の要求を完全に満たしているか確認してください。
    - もし完璧であれば、ユーザーへの最終的な回答を作成してください。
    - もし不十分な点があれば、\`REINSTRUCT::\`から始まる新しい指示をオーケストレーターに出してください。
    \n\n--- 統合報告書 ---\n${orchestratorReport}`;

    addMessage('president', { sender: 'agent', content: '' });

    const presidentReviewResponse = await generateResponseStream(
        president.systemPrompt, 
        reviewPrompt, 
        (chunk) => updateAgentLastMessage('president', chunk),
        conversationHistoryRef.current, 
        'gemini-2.5-pro'
    );
    
    conversationHistoryRef.current += `\n\n--- President Review ---\n${presidentReviewResponse}`;

    setAgentThinking('president', false);

    if (presidentReviewResponse.startsWith('REINSTRUCT::')) {
        setCurrentStatus('プレジデントからの追加指示。タスクを続行します...');
        const newDirectiveFull = presidentReviewResponse.substring('REINSTRUCT::'.length).trim();
        const { directive, team } = parsePresidentInitialResponse(newDirectiveFull);

        if (team.length > 0) {
            const newAgentIds = team
              .map(alias => AGENTS.find(a => a.alias === alias)?.id)
              .filter((id): id is string => !!id);
            setSelectedAgents(prev => new Set([...prev, ...newAgentIds]));
        }

        const newOrchestratorPrompt = `プレジデントからの追加指示:\n${directive}\n\n現在の許可エージェント: [${Array.from(selectedAgents).map(id => AGENTS.find(a=>a.id === id)?.alias).join(', ')}]`;
        addMessage('orchestrator', { sender: 'system', content: newOrchestratorPrompt });
        isOrchestrationRunning.current = true;
        runOrchestrationLoop();
    } else {
        setCurrentStatus('ミッション完了。最終報告書を生成しました。');
        const fullReport = `# A.G.I.S. 最終報告書\n\n## プレジデントによる最終回答\n\n${presidentReviewResponse}\n\n---\n\n## オーケストレーターによる統合報告書\n\n${orchestratorReport}`;
        setFinalReport(fullReport);
        setToast({ message: "最終報告が完了しました。", type: "success" });
        isOrchestrationRunning.current = false;
        setSystemStatus('completed');
        playCompletionSound(); // Sonic Interface: Complete
    }
  };

  // Expanded Agent Logic
  const expandedAgent = expandedAgentId ? AGENTS.find(a => a.id === expandedAgentId) : null;

  if (!process.env.API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-500 mb-4">設定エラー</h1>
          <p>APIキーが設定されていません。</p>
          <p className="mt-2 text-sm text-gray-400">アプリケーションを利用するには、環境変数にAPI_KEYを設定してください。</p>
        </div>
      </div>
    );
  }

  const presidentAndOrchestrator = AGENTS.slice(0, 2);
  const specialistAgents = AGENTS.slice(2);
  const isInitialState = selectedAgents.size === 0;
  
  const specialistAgentsByTeam = specialistAgents.reduce((acc, agent) => {
    const team = agent.team;
    if (!acc[team]) {
      acc[team] = [];
    }
    acc[team].push(agent);
    return acc;
  }, {} as Record<Team, Agent[]>);

  const teamOrder = [
    Team.STRATEGIC_INSIGHT,
    Team.PRODUCT_DESIGN,
    Team.TECH_DEVELOPMENT,
    Team.INFRA_SECURITY,
    Team.MARKETING_BRAND,
    Team.SALES_PARTNERSHIPS,
    Team.COMMUNICATIONS_CUSTOMER_RELATIONS,
    Team.FINANCE_BUSINESS_STRATEGY,
    Team.PEOPLE_OPERATIONS,
    Team.LEGAL_COMPLIANCE,
  ];

  const allSelectedSpecialists = teamOrder.flatMap(teamName =>
    (specialistAgentsByTeam[teamName] || []).filter(agent => selectedAgents.has(agent.id))
  );
  
  return (
    <div className={`flex flex-col h-screen text-gray-100 relative transition-colors duration-[2000ms] ease-in-out ${getBackgroundGradient(systemStatus)}`}>
      <Toast message={toast?.message} type={toast?.type} />
      {humanQuestion && <QuestionModal question={humanQuestion} onSubmit={handleHumanResponse} isLoading={isLoading} />}
      {isErrorLogModalOpen && <ErrorLogModal logs={errorLogs} onClose={() => setIsErrorLogModalOpen(false)} onClear={() => { setErrorLogs([]); localStorage.removeItem('agis-error-logs'); }} />}
      
      {/* Expanded Agent Modal */}
      {expandedAgentId && expandedAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setExpandedAgentId(null)}></div>
          <div className="relative w-full max-w-5xl h-[90vh] z-10 shadow-2xl shadow-cyan-500/20 rounded-lg overflow-hidden">
             <AgentCard 
                key={`expanded-${expandedAgent.id}`}
                id={`agent-card-expanded-${expandedAgent.id}`}
                agent={expandedAgent} 
                messages={messages[expandedAgent.id] || []} 
                isThinking={thinkingAgents.has(expandedAgent.id)} 
                finalReportContent={expandedAgent.id === 'president' ? finalReport : null}
                isExpanded={true}
                onClose={() => setExpandedAgentId(null)}
              />
          </div>
        </div>
      )}

      <header className="text-center p-4 border-b border-gray-700 bg-gray-900/30 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center transition-colors duration-1000">
        <div className="flex-1"></div>
        <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold">A.G.I.S.</h1>
            <p className="text-gray-400 text-sm">AI Generative Intelligence System</p>
        </div>
        <div className="flex-1 flex justify-end">
            {errorLogs.length > 0 && (
              <button onClick={() => setIsErrorLogModalOpen(true)} className="bg-red-800/50 hover:bg-red-700/50 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors" title="エラーログ">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
              </button>
            )}
        </div>
      </header>
      
      <main className="flex-grow p-2 sm:p-4 grid grid-rows-[255px_1fr] gap-4 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presidentAndOrchestrator.map(agent => (
            <AgentCard 
              key={agent.id} 
              id={`agent-card-${agent.id}`}
              agent={agent} 
              messages={messages[agent.id] || []} 
              isThinking={thinkingAgents.has(agent.id)} 
              finalReportContent={agent.id === 'president' ? finalReport : null}
              onExpand={() => setExpandedAgentId(agent.id)}
            />
          ))}
        </div>
        <div className="min-h-0 overflow-y-auto p-4 pb-4 -m-2 sm:-m-4">
          {isInitialState ? (
            <div className="space-y-4">
              {teamOrder.map(teamName => (
                <div key={teamName}>
                  <h3 className={`text-sm font-bold p-2 rounded-t-lg ${TEAM_COLORS[teamName].bg} ${TEAM_COLORS[teamName].text} border-b-2 ${TEAM_COLORS[teamName].border}`}>{teamName}</h3>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2 rounded-b-lg ${TEAM_COLORS[teamName].bg}`}>
                    {(specialistAgentsByTeam[teamName] || []).map(agent => (
                       <AgentCard 
                        key={agent.id}
                        id={`agent-card-${agent.id}`}
                        agent={agent} 
                        messages={[]}
                        isThinking={false}
                        isCompact={true}
                        onExpand={() => setExpandedAgentId(agent.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allSelectedSpecialists.map(agent => (
                  <AgentCard
                    key={agent.id}
                    id={`agent-card-${agent.id}`}
                    agent={agent}
                    messages={messages[agent.id] || []}
                    isThinking={thinkingAgents.has(agent.id)}
                    isCompact={false}
                    onExpand={() => setExpandedAgentId(agent.id)}
                  />
                ))}
            </div>
          )}
        </div>
      </main>

      <UserInput onSubmit={handleSendMessage} onReset={resetState} isLoading={isLoading || isWaitingForHuman} currentStatus={currentStatus} />
    </div>
  );
};

export default App;
