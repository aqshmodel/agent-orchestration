
import React from 'react';
import { AGENTS } from './constants';
import AgentCard from './components/AgentCard';
import UserInput from './components/UserInput';
import Header from './components/Header';
import AgentGrid from './components/AgentGrid';
import ModalManager from './components/ModalManager';
import { useAgis } from './hooks/useAgis';

const App: React.FC = () => {
  const { systemStatus, messages, thinkingAgents, finalReport, artifacts, setExpandedAgentId } = useAgis();

  // Dynamic Background Logic
  const getBackgroundGradient = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-blue-950/80';
      case 'processing':
        return 'bg-gradient-to-br from-gray-900/80 via-indigo-950/80 to-purple-950/80';
      case 'waiting':
        return 'bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-amber-950/80';
      case 'completed':
        return 'bg-gradient-to-br from-gray-900/80 via-teal-950/80 to-emerald-950/80';
      case 'error':
        return 'bg-gradient-to-br from-gray-900/80 via-red-950/80 to-pink-950/80';
      default:
        return 'bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-blue-950/80';
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
  
  return (
    <div className="relative h-screen w-screen overflow-hidden text-gray-100 font-sans">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-gray-900"></div>
      <div className={`fixed inset-0 z-0 transition-colors duration-[2000ms] ease-in-out ${getBackgroundGradient(systemStatus)}`}></div>
      
      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        
        <ModalManager />
        <Header />
        
        <main className="flex-grow p-2 sm:p-4 grid grid-rows-[255px_1fr] gap-4 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presidentAndOrchestrator.map(agent => (
                <AgentCard 
                  key={agent.id}
                  agent={agent}
                  messages={messages[agent.id] || []}
                  isThinking={thinkingAgents.has(agent.id)}
                  finalReport={agent.id === 'president' ? finalReport : null}
                  artifacts={artifacts}
                  onExpand={() => setExpandedAgentId(agent.id)}
                />
            ))}
            </div>
            <AgentGrid />
        </main>

        <UserInput />
      </div>
    </div>
  );
};

export default App;
