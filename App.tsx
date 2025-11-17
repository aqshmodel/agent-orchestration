
import React, { useState, useRef, useEffect } from 'react';
import { AGENTS } from './constants';
import { Message } from './types';
import AgentCard from './components/AgentCard';
import UserInput from './components/UserInput';
import Toast from './components/Toast';
import QuestionModal from './components/QuestionModal';
import ErrorLogModal from './components/ErrorLogModal';
import { generateResponse } from './services/geminiService';

type ToastMessage = {
  message: string;
  type: 'success' | 'info' | 'error';
};

type ErrorLog = {
  timestamp: string;
  message: string;
};

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
  
  const conversationHistoryRef = useRef<string>('');
  const isOrchestrationRunning = useRef<boolean>(false);

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
  };
  
  const addMessage = (agentId: string, message: Omit<Message, 'timestamp'>) => {
    const content = message.content;
    const senderName = message.sender === 'user' ? 'User' : AGENTS.find(a => a.id === agentId)?.name || 'System';
    
    // 誰からのメッセージかをより明確にするためのヘッダーを生成
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
  };

  const parsePresidentInitialResponse = (response: string): { directive: string; team: string[] } => {
    const teamMatch = response.match(/AGIS_TEAM::\[([^\]]*)\]/);
    const team = teamMatch ? teamMatch[1].split(',').map(t => t.trim()) : [];
    const directive = response.replace(/AGIS_TEAM::\[[^\]]*\]\n?/, '').trim();
    return { directive, team };
  };
  
  const handleSendMessage = async (prompt: string) => {
    resetState();
    setIsLoading(true);
    isOrchestrationRunning.current = true;
    const initialUserPrompt = `ユーザーからの最初の指示: ${prompt}`;
    conversationHistoryRef.current = initialUserPrompt;

    addMessage('president', { sender: 'user', content: prompt });

    try {
      setCurrentStatus('プレジデントがチームを編成し、戦略を立案しています...');
      setAgentThinking('president', true);
      const president = AGENTS.find(a => a.id === 'president')!;
      const presidentResponse = await generateResponse(president.systemPrompt, prompt, undefined, 'gemini-2.5-flash', true);
      setAgentThinking('president', false);
      addMessage('president', { sender: 'agent', content: presidentResponse });

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
    }
  };
  
  const handleHumanResponse = (answer: string) => {
    setIsWaitingForHuman(false);
    setHumanQuestion(null);
    addMessage('orchestrator', { sender: 'user', content: answer });
    runOrchestrationLoop();
  };

  const runOrchestrationLoop = async () => {
    setIsLoading(true);
    const orchestrator = AGENTS.find(a => a.id === 'orchestrator')!;

    let loopCount = 0;
    while (isOrchestrationRunning.current && loopCount < 10) {
      loopCount++;
      try {
        setCurrentStatus('オーケストレーターが次の行動を計画しています...');
        setAgentThinking('orchestrator', true);
        const orchestratorResponse = await generateResponse(orchestrator.systemPrompt, "対話履歴を元に次のアクションを決定してください。", conversationHistoryRef.current, 'gemini-2.5-flash');
        setAgentThinking('orchestrator', false);

        if (!orchestratorResponse) {
          throw new Error("オーケストレーターからの応答が空です。処理を続行できません。");
        }
        
        const [thought, action] = parseOrchestratorResponse(orchestratorResponse);

        if (thought) addMessage('orchestrator', { sender: 'agent', content: `思考:\n${thought}` });
        if (!action) {
          addMessage('orchestrator', { sender: 'agent', content: '（思考中... 次のアクションを生成できませんでした。リトライします。）' });
          continue; 
        }
        
        const shouldContinue = await handleAction(action);
        if (!shouldContinue) {
          isOrchestrationRunning.current = false;
          break;
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        addMessage('orchestrator', { sender: 'system', content: `オーケストレーションループでエラーが発生しました: ${errorMsg}`});
        addErrorLog(`Orchestration Loop Error: ${errorMsg}`);
        isOrchestrationRunning.current = false;
        break;
      }
    }

    if (isOrchestrationRunning.current === false && !isWaitingForHuman) {
        setIsLoading(false);
        setThinkingAgents(new Set());
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
        if (match) {
            const [, agentAlias, query] = match;
            const agent = AGENTS.find(a => a.alias === agentAlias.trim());
            if (agent) {
                setCurrentStatus(`${agent.name}がタスクを実行中...`);
                setAgentThinking(agent.id, true);
                addMessage(agent.id, { sender: 'system', content: `タスク受信:\n${query}` });
                const response = await generateResponse(agent.systemPrompt, query, undefined, 'gemini-2.5-pro');
                setAgentThinking(agent.id, false);
                addMessage(agent.id, { sender: 'agent', content: response });
            }
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
        
        setCurrentStatus(`${tasks.map(t => t.agent.name).join(', ')}が並列でタスクを実行中...`);
        tasks.forEach(t => {
            setAgentThinking(t.agent.id, true);
            addMessage(t.agent.id, { sender: 'system', content: `タスク受信:\n${t.query}` });
        });
        await Promise.all(tasks.map(async task => {
            const response = await generateResponse(task.agent.systemPrompt, task.query, undefined, 'gemini-2.5-pro');
            setAgentThinking(task.agent.id, false);
            addMessage(task.agent.id, { sender: 'agent', content: response });
        }));
    } else if (action.startsWith('AGIS_CMD::ask_human(')) {
        const match = action.match(/AGIS_CMD::ask_human\("([\s\S]*)"\)/);
        if (match) {
            const question = match[1];
            setCurrentStatus('ユーザーからの応答を待っています...');
            addMessage('orchestrator', { sender: 'agent', content: `ユーザーへの質問:\n${question}` });
            setHumanQuestion(question);
            setIsWaitingForHuman(true);
            return false;
        }
    } else if (action.startsWith('AGIS_CMD::complete(')) {
        const match = action.match(/AGIS_CMD::complete\("([\s\S]*)"\)/);
        if (match) {
            const orchestratorReport = match[1];
            addMessage('orchestrator', { sender: 'agent', content: `最終報告:\n${orchestratorReport}` });
            
            // Hand over to President for review
            await runPresidentReview(orchestratorReport);
        }
        return false;
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

    const presidentReviewResponse = await generateResponse(president.systemPrompt, reviewPrompt, conversationHistoryRef.current, 'gemini-2.5-pro');
    setAgentThinking('president', false);
    addMessage('president', { sender: 'agent', content: presidentReviewResponse });

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
        // This is the final answer
        setCurrentStatus('ミッション完了。最終報告書を生成しました。');
        const fullReport = `# A.G.I.S. 最終報告書\n\n## プレジデントによる最終回答\n\n${presidentReviewResponse}\n\n---\n\n## オーケストレーターによる統合報告書\n\n${orchestratorReport}`;
        setFinalReport(fullReport);
        setToast({ message: "最終報告が完了しました。", type: "success" });
        isOrchestrationRunning.current = false;
    }
  };


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
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <Toast message={toast?.message} type={toast?.type} />
      {humanQuestion && <QuestionModal question={humanQuestion} onSubmit={handleHumanResponse} isLoading={isLoading} />}
      {isErrorLogModalOpen && <ErrorLogModal logs={errorLogs} onClose={() => setIsErrorLogModalOpen(false)} onClear={() => { setErrorLogs([]); localStorage.removeItem('agis-error-logs'); }} />}
      
      <header className="text-center p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
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
      
      <main className="flex-grow p-2 sm:p-4 grid grid-rows-3 gap-4 min-h-0">
        <div className="row-span-1 grid grid-cols-1 md:grid-cols-2 grid-rows-1 gap-4 min-h-0">
          {presidentAndOrchestrator.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              messages={messages[agent.id] || []} 
              isThinking={thinkingAgents.has(agent.id)} 
              finalReportContent={agent.id === 'president' ? finalReport : null}
              isSelected={true}
            />
          ))}
        </div>
        <div className="row-span-2 grid grid-cols-2 grid-rows-8 md:grid-cols-3 md:grid-rows-5 lg:grid-cols-5 lg:grid-rows-3 gap-2 sm:gap-4 min-h-0">
          {specialistAgents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              messages={messages[agent.id] || []} 
              isThinking={thinkingAgents.has(agent.id)}
              isSelected={selectedAgents.size === 0 || selectedAgents.has(agent.id)}
            />
          ))}
        </div>
      </main>

      <UserInput onSubmit={handleSendMessage} onReset={resetState} isLoading={isLoading || isWaitingForHuman} currentStatus={currentStatus} />
    </div>
  );
};

export default App;
