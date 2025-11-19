
import React from 'react';
import { AGENTS, TEAM_COLORS } from './constants';
import { Agent, Team } from './types';
import AgentCard from './components/AgentCard';
import UserInput from './components/UserInput';
import Toast from './components/Toast';
import QuestionModal from './components/QuestionModal';
import ErrorLogModal from './components/ErrorLogModal';
import KnowledgeBaseModal from './components/KnowledgeBaseModal';
import SessionManagerModal from './components/SessionManagerModal';
import DependencyGraphModal from './components/DependencyGraphModal';
import { useAgis } from './hooks/useAgis';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const {
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
    isGraphModalOpen,
    expandedAgentId,
    selectedAgents,
    systemStatus,
    contextChars,
    currentSessionId,
    sharedKnowledgeBaseContent,
    selectedModel,
    graphEvents,
    artifacts, // Import artifacts

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
    setIsGraphModalOpen,
    setSelectedModel,
  } = useAgis();
  
  const { t, language, setLanguage } = useLanguage();

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

  // Context Usage Calculation (Approximate)
  const MAX_CONTEXT_CHARS = 1000000;
  const usagePercentage = Math.min((contextChars / MAX_CONTEXT_CHARS) * 100, 100);
  
  let usageColor = "bg-cyan-500";
  if (contextChars > 800000) usageColor = "bg-red-500";
  else if (contextChars > 400000) usageColor = "bg-yellow-500";

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
    Team.STRATEGY_PLANNING,
    Team.INSIGHT_CULTURE,
    Team.PRODUCT_DESIGN,
    Team.ADVANCED_DEV,
    Team.OPS_INFRA,
    Team.SECURITY_GOV,
    Team.GROWTH_MARKETING,
    Team.SALES,
    Team.RELATIONS_ASSETS,
    Team.FINANCE_SCM,
    Team.HR_ADMIN,
  ];

  const allSelectedSpecialists = teamOrder.flatMap(teamName =>
    (specialistAgentsByTeam[teamName] || []).filter(agent => selectedAgents.has(agent.id))
  );
  
  return (
    <div className="relative h-screen w-screen overflow-hidden text-gray-100 font-sans">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-gray-900"></div>
      <div className="fixed inset-0 z-0 bg-stars"></div>
      <div className="fixed inset-0 z-0 bg-aurora"></div>
      <div className={`fixed inset-0 z-0 transition-colors duration-[2000ms] ease-in-out ${getBackgroundGradient(systemStatus)}`}></div>
      
      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        <Toast message={toast?.message} type={toast?.type} />
        {humanQuestion && <QuestionModal question={humanQuestion} onSubmit={handleHumanResponse} isLoading={isLoading} />}
        {isErrorLogModalOpen && <ErrorLogModal logs={errorLogs} onClose={() => setIsErrorLogModalOpen(false)} onClear={clearErrorLogs} />}
        {isKnowledgeBaseOpen && (
            <KnowledgeBaseModal 
                content={sharedKnowledgeBaseContent} 
                messages={messages} // Pass all messages for diagram extraction
                artifacts={artifacts} // Pass artifacts for image gallery
                onClose={() => setIsKnowledgeBaseOpen(false)} 
            />
        )}
        {isGraphModalOpen && <DependencyGraphModal events={graphEvents} selectedAgents={selectedAgents} onClose={() => setIsGraphModalOpen(false)} onAgentClick={(id) => setExpandedAgentId(id)} />}
        {isSessionManagerOpen && (
            <SessionManagerModal 
                currentSessionId={currentSessionId}
                onLoad={handleLoadSession}
                onSave={handleSaveSession}
                onDelete={handleDeleteSession}
                onNew={handleNewSession}
                onClose={() => setIsSessionManagerOpen(false)}
            />
        )}
        
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
                    artifacts={artifacts} // Pass artifacts
                />
            </div>
            </div>
        )}

        <header className="text-center px-4 py-3 border-b border-gray-700/50 bg-gray-900/30 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center transition-colors duration-1000">
            <div className="flex-1 flex flex-col items-start">
            <div className="w-48">
                <div className="flex justify-between text-[10px] text-cyan-100/80 mb-1 font-mono">
                    <span>{t.app.contextUsage}</span>
                    <span>{contextChars.toLocaleString()} {t.app.chars}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden" title={`${Math.round(usagePercentage)}% used`}>
                    <div className={`h-1.5 rounded-full ${usageColor} transition-all duration-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]`} style={{ width: `${usagePercentage}%` }}></div>
                </div>
                {contextChars > 800000 && (
                    <p className="text-[10px] text-red-400 mt-1 animate-pulse">{t.app.contextHigh}</p>
                )}
            </div>
            <div className="mt-2">
                <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-gray-800/60 border border-gray-600 text-xs text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                    <option value="gemini-3-pro-preview-high">{t.app.modelHigh}</option>
                    <option value="gemini-3-pro-preview-low">{t.app.modelLow}</option>
                    <option value="gemini-flash-latest">{t.app.modelFlash}</option>
                </select>
            </div>
            </div>
            
            <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold tracking-wider text-white neon-text neon-text-pulse">{t.app.title}</h1>
                <p className="text-cyan-200 text-[10px] text-center tracking-[0.3em] opacity-80 mt-1 font-mono">{t.app.subtitle}</p>
            </div>
            
            <div className="flex-1 flex justify-end items-center space-x-3">
                {/* Knowledge Base Button */}
                <button 
                    onClick={() => setIsKnowledgeBaseOpen(true)} 
                    className="bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-200 text-xs font-bold py-1.5 px-3 rounded-md transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.4)] flex items-center gap-2 backdrop-blur-sm" 
                    title={t.app.btnBrain}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="hidden sm:inline">{t.app.btnBrain}</span>
                </button>

                {/* Graph Button */}
                <button 
                    onClick={() => setIsGraphModalOpen(true)} 
                    className="bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/50 text-indigo-200 text-xs font-bold py-1.5 px-3 rounded-md transition-all hover:shadow-[0_0_10px_rgba(99,102,241,0.4)] flex items-center gap-2 backdrop-blur-sm" 
                    title={t.app.btnGraph}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <span className="hidden sm:inline">{t.app.btnGraph}</span>
                </button>

                {/* Session Manager Button */}
                <button 
                    onClick={() => setIsSessionManagerOpen(true)} 
                    className="bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/50 text-cyan-200 text-xs font-bold py-1.5 px-3 rounded-md transition-all hover:shadow-[0_0_10px_rgba(34,211,238,0.4)] flex items-center gap-2 backdrop-blur-sm" 
                    title={t.app.btnSession}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">{t.app.btnSession}</span>
                </button>

                {errorLogs.length > 0 && (
                <button onClick={() => setIsErrorLogModalOpen(true)} className="bg-red-800/50 hover:bg-red-700/50 text-white text-xs font-bold py-1.5 px-2 rounded-md transition-colors animate-pulse" title={t.app.btnError}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
                )}
                
                {/* Language Toggle */}
                <button
                onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
                className="ml-2 text-[10px] font-mono bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60 border border-gray-600 rounded px-2 py-1 transition-colors backdrop-blur-sm"
                title="Switch Language"
                >
                {language.toUpperCase()}
                </button>
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
                artifacts={artifacts} // Pass artifacts
                />
            ))}
            </div>
            <div className="min-h-0 overflow-y-auto p-4 pb-40 -m-2 sm:-m-4 custom-scrollbar">
            {isInitialState ? (
                <div className="space-y-4">
                {teamOrder.map(teamName => (
                    <div key={teamName}>
                    <h3 className={`text-sm font-bold p-2 rounded-t-lg ${TEAM_COLORS[teamName].bg} ${TEAM_COLORS[teamName].text} border-b-2 ${TEAM_COLORS[teamName].border}`}>{(t.teams as any)[teamName] || teamName}</h3>
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
                            artifacts={artifacts}
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
                        artifacts={artifacts}
                    />
                    ))}
                </div>
            )}
            </div>
        </main>

        <UserInput 
            onSubmit={handleSendMessage} 
            onResetAll={handleResetAll}
            onClearConversationHistory={handleClearConversationHistory}
            onClearKnowledgeBase={handleClearKnowledgeBase}
            isLoading={isLoading || isWaitingForHuman} 
            currentStatus={currentStatus} 
        />
      </div>
    </div>
  );
};

export default App;
