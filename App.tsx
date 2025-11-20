
import React from 'react';
import { AGENTS } from './constants';
import AgentCard from './components/agents/AgentCard';
import UserInput from './components/layout/UserInput';
import Header from './components/layout/Header';
import AgentGrid from './components/agents/AgentGrid';
import ModalManager from './components/modals/ModalManager';
import { useAgis } from './hooks/useAgis';

const App: React.FC = () => {
  const { 
    systemStatus, 
    messages, 
    thinkingAgents, 
    finalReport, 
    artifacts, 
    setExpandedAgentId, 
    handleOpenPreview,
    currentPhase 
  } = useAgis();

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

  // Extract Leadership Team (First 4 agents: President, COO, CoS, Orchestrator)
  const allLeadershipAgents = AGENTS.slice(0, 4);
  
  // Determine visible leadership agents based on phase
  const getVisibleLeadershipAgents = () => {
      switch (currentPhase) {
          case 'strategy':
              // Strategy: President decides, COO assembles. CoS/Orchestrator not active yet.
              return allLeadershipAgents.filter(a => a.id === 'president' || a.id === 'coo');
          
          case 'execution':
              // Execution: Orchestrator is working. President is monitoring.
              // COO has finished assembly, CoS is waiting for results. Hide them to reduce noise.
              return allLeadershipAgents.filter(a => a.id === 'president' || a.id === 'orchestrator');
          
          case 'reporting':
              // Reporting: Orchestrator reports to COO, then COO reports to President.
              // CoS is not yet writing.
              return allLeadershipAgents.filter(a => a.id !== 'chief_of_staff');

          case 'refinement':
          case 'completed':
              // Refinement/Completed: All members are relevant.
              return allLeadershipAgents;
              
          default:
              return allLeadershipAgents;
      }
  };

  const visibleLeadershipTeam = getVisibleLeadershipAgents();
  
  // Determine active agents based on phase for highlighting
  const getActiveRingClass = (agentId: string) => {
      const base = "ring-offset-2 ring-offset-gray-900 transition-all duration-500 h-full";
      
      // Always highlight thinking agents
      if (thinkingAgents.has(agentId)) return `${base} ring-2 ring-cyan-400`;

      // Phase-based subtle highlighting
      let isActive = false;
      switch (currentPhase) {
          case 'strategy':
              if (agentId === 'president' || agentId === 'coo') isActive = true;
              break;
          case 'execution':
              if (agentId === 'orchestrator') isActive = true;
              break;
          case 'reporting':
              if (agentId === 'orchestrator' || agentId === 'coo') isActive = true;
              break;
          case 'refinement':
              if (agentId === 'president' || agentId === 'chief_of_staff') isActive = true;
              break;
          case 'completed':
              if (agentId === 'president') isActive = true;
              break;
      }
      
      return isActive ? `${base} ring-1 ring-white/30` : base;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden text-gray-100 font-sans">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-gray-900"></div>
      <div className={`fixed inset-0 z-0 transition-colors duration-[2000ms] ease-in-out ${getBackgroundGradient(systemStatus)}`}></div>
      
      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col h-full">
        
        <ModalManager />
        <Header />
        
        <main className="flex-grow p-2 sm:p-4 grid grid-rows-[auto_1fr] gap-4 min-h-0">
            {/* Leadership Section */}
            {/* Grid Size: md:grid-cols-2 makes them span 2 standard units (50% width) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500">
                {visibleLeadershipTeam.map(agent => {
                    // Final Report Logic:
                    // - CoS: Never shows final report preview (drafting focus).
                    // - President: Shows final report preview ONLY when completed (approved).
                    // - Others: Null.
                    let agentReport = null;
                    let previewHandler = undefined;

                    if (agent.id === 'president') {
                        // President holds the "Official" report.
                        agentReport = finalReport;
                        // Only enable preview button when the project is fully completed (Approved).
                        if (systemStatus === 'completed') {
                            previewHandler = handleOpenPreview;
                        }
                    } 
                    // CoS sends drafts via messages, but we don't attach the "Final Report" artifact 
                    // to the card header to prevent premature "Final Report" labels/buttons.

                    return (
                        <div key={agent.id} className={getActiveRingClass(agent.id) + " rounded-lg"}>
                            <AgentCard 
                              agent={agent}
                              messages={messages[agent.id] || []}
                              isThinking={thinkingAgents.has(agent.id)}
                              finalReport={agentReport}
                              artifacts={artifacts}
                              onExpand={() => setExpandedAgentId(agent.id)}
                              onPreview={previewHandler}
                              // Leadership cards are always expanded/prominent
                              isCompact={false} 
                            />
                        </div>
                    );
                })}
            </div>
            
            {/* Specialist Grid */}
            <AgentGrid />
        </main>

        <UserInput />
      </div>
    </div>
  );
};

export default App;
