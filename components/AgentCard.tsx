

import React, { useRef, useEffect, useState } from 'react';
import { Agent, Message, Artifact } from '../types';
import { AGENT_COLORS, TEAM_COLORS } from '../constants';
import { generateWordDoc } from '../utils/reportGenerator';
import { useLanguage } from '../contexts/LanguageContext';
import MarkdownRenderer from './MarkdownRenderer';

interface AgentCardProps {
  id?: string; // Optional, mainly for DOM id
  agent: Agent;
  isCompact?: boolean;
  isExpanded?: boolean;
  // Data Props (Decoupled from Context for Memoization)
  messages: Message[];
  isThinking: boolean;
  finalReport?: string | null;
  artifacts?: Record<string, Artifact>;
  // Actions
  onExpand?: () => void;
  onClose?: () => void;
}

const AgentCardComponent: React.FC<AgentCardProps> = ({ 
  id, 
  agent, 
  isCompact, 
  isExpanded, 
  messages, 
  isThinking, 
  finalReport, 
  artifacts, 
  onExpand, 
  onClose 
}) => {
  // No useAgis() here to prevent re-renders on global state change
  
  // Use messages passed from props
  const agentMessages = messages || [];
  // Use finalReport from props (Parent decides logic)
  const finalReportContent = finalReport;

  const teamColor = AGENT_COLORS[agent.id] ?? TEAM_COLORS[agent.team];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const prevMessagesLength = useRef(agentMessages.length);
  const { t, language } = useLanguage();
  
  // Get translated names safely
  const transAgent = t.agents[agent.id] || { name: agent.name, role: agent.role };
  const transTeam = t.teams[agent.team] || agent.team;

  // Smart Scroll Logic
  const isUserScrolling = useRef(false);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        isUserScrolling.current = !atBottom;
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current && !isUserScrolling.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!isCompact) {
      scrollToBottom();
      if (agentMessages.length > prevMessagesLength.current) {
          setHighlight(true);
          const timer = setTimeout(() => setHighlight(false), 1200);
          return () => clearTimeout(timer);
      }
      prevMessagesLength.current = agentMessages.length;
    }
  }, [agentMessages, isCompact]);

  useEffect(() => {
      if (isThinking && !isCompact) {
          scrollToBottom();
      }
  }, [isThinking, isCompact]);

  // --- Download Logic ---
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
            setIsDownloadMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadMarkdown = () => {
    if (!finalReportContent) return;
    const blob = new Blob([finalReportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AGIS-Report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadWord = () => {
      if (!finalReportContent) return;
      const wordContent = generateWordDoc(finalReportContent, 'A.G.I.S. Report', language);
      const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AGIS-Report-${new Date().toISOString().slice(0, 10)}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloadMenuOpen(false);
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
    </div>
  );

  // Dynamic height classes
  const heightClass = isExpanded 
    ? 'h-full' 
    : isCompact 
        ? 'h-auto justify-center' 
        : 'h-[240px]';
  
  const showExpandButton = agentMessages.length > 0;
  
  // Generate ID if not provided
  const domId = id || `agent-card-${agent.id}`;

  return (
    <div id={domId} className={`flex flex-col border ${teamColor.border} rounded-lg ${heightClass} glass-effect ${teamColor.bg} ${isThinking ? 'thinking-border-animation ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : ''} ${!isThinking && highlight && !isCompact ? 'flash-border-animation' : ''} transition-all duration-300 ${!isExpanded ? 'hover:-translate-y-1' : ''}`}>
      <div className={`p-3 ${!isCompact || isExpanded ? `border-b ${teamColor.border}` : ''} flex justify-between items-center sticky top-0 z-10 ${teamColor.bg.replace('/60', '/95')} backdrop-blur-md rounded-t-lg`}>
        <div className="flex items-center gap-2 w-full overflow-hidden">
           {isThinking && (
               <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                  <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
               </div>
           )}
           <div className="overflow-hidden w-full">
              {(!isCompact || isExpanded) && <p className={`text-xs ${teamColor.text} font-bold opacity-80 truncate`}>{transTeam}</p>}
              <h3 className="font-bold text-sm text-white break-words leading-tight mb-0.5">{transAgent.name}</h3>
              <p className={`text-[10px] ${teamColor.text} opacity-90 truncate`}>{transAgent.role}</p>
           </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
            {isThinking && (
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-900/80 px-1.5 py-0.5 rounded border border-cyan-700 animate-pulse">{t.agentCard.thinking}</span>
            )}
            
            {/* Download Button with Dropdown */}
            {finalReportContent && (!isCompact || isExpanded) && (
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                    className={`bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors flex items-center ${isDownloadMenuOpen ? 'bg-cyan-700 ring-2 ring-cyan-400' : ''}`}
                    title={t.agentCard.download}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">{t.agentCard.download}</span>
                  </button>
                  {isDownloadMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-xl z-50 overflow-hidden">
                          <button 
                             onClick={handleDownloadMarkdown}
                             className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center whitespace-nowrap"
                          >
                              <span className="bg-gray-700 text-[10px] p-1 rounded mr-3 font-mono w-10 text-center">.md</span>
                              {t.agentCard.saveMd}
                          </button>
                          <button 
                             onClick={handleDownloadWord}
                             className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center border-t border-gray-700 whitespace-nowrap"
                          >
                              <span className="bg-blue-900 text-blue-200 text-[10px] p-1 rounded mr-3 font-mono w-10 text-center">.doc</span>
                              {t.agentCard.saveWord}
                          </button>
                      </div>
                  )}
                </div>
            )}
            
            {isExpanded && onClose && (
                 <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                    title={t.agentCard.close}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
            )}
            {!isExpanded && onExpand && showExpandButton && (
                <button
                    onClick={onExpand}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    title={t.agentCard.expand}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
            )}
        </div>
      </div>
      {(!isCompact || isExpanded) && (
        <div 
            ref={scrollContainerRef} 
            onScroll={handleScroll} 
            className="flex-grow p-3 overflow-y-auto text-sm space-y-2 relative min-h-0"
        >
            {agentMessages.map((msg, index) => (
            <div key={index} className={`${msg.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
                <p className="font-mono text-[10px] text-gray-500 mb-0.5 opacity-70">{msg.timestamp} - {msg.sender.toUpperCase()}</p>
                <div>
                    <MarkdownRenderer content={msg.content} artifacts={artifacts} />
                </div>
            </div>
            ))}
            {isThinking && <TypingIndicator />}
        </div>
      )}
    </div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: AgentCardProps, nextProps: AgentCardProps) => {
  // 1. Compare strict primitives
  if (
    prevProps.id !== nextProps.id ||
    prevProps.isCompact !== nextProps.isCompact ||
    prevProps.isExpanded !== nextProps.isExpanded ||
    prevProps.isThinking !== nextProps.isThinking ||
    prevProps.finalReport !== nextProps.finalReport
  ) {
    return false;
  }

  // 2. Compare Messages
  // Since we are using immutable state updates in the parent, reference check is fast.
  if (prevProps.messages !== nextProps.messages) {
    return false;
  }
  
  // 3. Compare Agent static data (usually static but checking reference)
  if (prevProps.agent !== nextProps.agent) {
    return false;
  }

  // 4. Compare Artifacts reference (Artifacts object is updated on new generation)
  if (prevProps.artifacts !== nextProps.artifacts) {
    return false;
  }

  // Ignore function props (onExpand, onClose) as they might be re-created on parent render
  // but typically don't change behavior. We prioritize data stability.

  return true;
};

const AgentCard = React.memo(AgentCardComponent, arePropsEqual);

export default AgentCard;