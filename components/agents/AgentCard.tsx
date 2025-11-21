
import React, { useRef, useEffect, useState } from 'react';
import { Agent, Message, Artifact } from '../../types';
import { AGENT_COLORS, TEAM_COLORS } from '../../constants';
import { htmlToMarkdown } from '../../utils/reportGenerator';
import { extractHtmlFromContent } from '../../utils/contentProcessor';
import { useSmartScroll } from '../../hooks/useSmartScroll';
import { useLanguage } from '../../contexts/LanguageContext';
import MarkdownRenderer from '../visuals/MarkdownRenderer';

interface AgentCardProps {
  id?: string; // Optional, mainly for DOM id
  agent: Agent;
  isCompact?: boolean;
  isExpanded?: boolean;
  forceInitialHeight?: boolean; // New prop for initial state
  // Data Props (Decoupled from Context for Memoization)
  messages: Message[];
  isThinking: boolean;
  finalReport?: string | null;
  artifacts?: Record<string, Artifact>;
  // Actions
  onExpand?: () => void;
  onClose?: () => void;
  onPreview?: (code: string, language: string) => void;
}

const AgentCardComponent: React.FC<AgentCardProps> = ({ 
  id, 
  agent, 
  isCompact, 
  isExpanded, 
  forceInitialHeight,
  messages, 
  isThinking, 
  finalReport, 
  artifacts, 
  onExpand, 
  onClose,
  onPreview
}) => {
  const agentMessages = messages || [];
  const finalReportContent = finalReport;

  const teamColor = AGENT_COLORS[agent.id] ?? TEAM_COLORS[agent.team];
  const [highlight, setHighlight] = useState(false);
  const prevMessagesLength = useRef(agentMessages.length);
  const { t, language } = useLanguage();
  
  // View Mode State: 'report' or 'history'
  // If finalReport exists, default to 'report', otherwise 'history'
  const [viewMode, setViewMode] = useState<'report' | 'history'>('history');

  // Get translated names safely
  const transAgent = t.agents[agent.id] || { name: agent.name, role: agent.role };
  const transTeam = t.teams[agent.team] || agent.team;

  // HTML Detection
  const htmlPreviewCode = extractHtmlFromContent(finalReportContent);
  const isHtmlReport = !!htmlPreviewCode;

  // Update view mode when report is generated
  useEffect(() => {
      if (isHtmlReport) {
          setViewMode('report');
      } else {
          setViewMode('history');
      }
  }, [isHtmlReport]);

  // Smart Scroll Logic (Only active when showing history)
  const { scrollContainerRef, handleScroll, scrollToBottom } = useSmartScroll({
      dependency: agentMessages,
      enabled: !isCompact && viewMode === 'history'
  });

  // Additional scroll trigger for Thinking state
  useEffect(() => {
      if (isThinking && !isCompact && viewMode === 'history') {
          scrollToBottom();
      }
  }, [isThinking, isCompact, viewMode, scrollToBottom]);

  // Highlight animation on new message
  useEffect(() => {
    if (!isCompact && agentMessages.length > prevMessagesLength.current) {
        setHighlight(true);
        const timer = setTimeout(() => setHighlight(false), 1200);
        prevMessagesLength.current = agentMessages.length;
        return () => clearTimeout(timer);
    }
    prevMessagesLength.current = agentMessages.length;
  }, [agentMessages, isCompact]);

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
    const contentToSave = htmlPreviewCode ? htmlToMarkdown(htmlPreviewCode) : finalReportContent;
    const blob = new Blob([contentToSave], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `AGIS-Report-${new Date().toISOString().slice(0, 10)}.md`);
  };

  const handleDownloadHtml = () => {
      if (!htmlPreviewCode) return;
      const blob = new Blob([htmlPreviewCode], { type: 'text/html;charset=utf-8' });
      downloadBlob(blob, `AGIS-Report-${new Date().toISOString().slice(0, 10)}.html`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloadMenuOpen(false);
  };

  // --- Preview Logic ---
  const handlePreviewClick = () => {
      if (onPreview && htmlPreviewCode) {
          onPreview(htmlPreviewCode, 'html');
      }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
    </div>
  );

  // Dynamic height classes logic
  let heightClass = 'h-[280px] md:h-[300px] xl:h-[320px] [min-width:1920px]:h-[360px]'; // Default responsive size
  
  if (isExpanded) {
      heightClass = 'h-full';
  } else if (isCompact) {
      heightClass = 'h-auto justify-center';
  } else if (forceInitialHeight) {
      heightClass = 'h-[200px]'; // Fixed height for initial state
  }
  
  const showExpandButton = agentMessages.length > 0;
  
  // Generate ID if not provided
  const domId = id || `agent-card-${agent.id}`;

  // Determine what to render in the content area
  const shouldShowReport = isHtmlReport && viewMode === 'report';

  return (
    <div id={domId} className={`flex flex-col border ${teamColor.border} rounded-lg ${heightClass} glass-effect ${teamColor.bg} ${isThinking ? 'thinking-border-animation ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : ''} ${!isThinking && highlight && !isCompact ? 'flash-border-animation' : ''} transition-all duration-500 ${!isExpanded ? 'hover:-translate-y-1' : ''}`}>
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
            
            {/* Preview Button (Only when showing report) */}
            {shouldShowReport && (!isCompact || isExpanded) && onPreview && (
                <button
                    onClick={handlePreviewClick}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors flex items-center mr-1 shadow-lg shadow-emerald-900/50"
                    title={t.agentCard.preview}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline whitespace-nowrap">{t.agentCard.preview}</span>
                </button>
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
                          {isHtmlReport && (
                              <button 
                                onClick={handleDownloadHtml}
                                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center whitespace-nowrap font-bold"
                              >
                                  <span className="bg-orange-900 text-orange-200 text-[10px] p-1 rounded mr-3 font-mono w-10 text-center">.html</span>
                                  {t.agentCard.saveHtml}
                              </button>
                          )}
                          <button 
                             onClick={handleDownloadMarkdown}
                             className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center border-t border-gray-700 whitespace-nowrap"
                          >
                              <span className="bg-gray-700 text-[10px] p-1 rounded mr-3 font-mono w-10 text-center">.md</span>
                              {t.agentCard.saveMd}
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
            {shouldShowReport ? (
                <div className="bg-gray-900/50 border border-dashed border-gray-600 rounded p-6 flex flex-col items-center justify-center text-center min-h-[200px] relative">
                    {/* View Toggle for Report */}
                    <button 
                        onClick={() => setViewMode('history')}
                        className="absolute top-2 right-2 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-600 transition-colors flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {language === 'en' ? 'Show History' : '履歴を表示'}
                    </button>

                    <div className="text-4xl mb-2">📄</div>
                    <h4 className="text-lg font-bold text-gray-200 mb-2">Final Report Generated</h4>
                    <p className="text-sm text-gray-400 mb-4">
                        {language === 'en' ? 'The final report is available as a full HTML document.' : '最終レポートがHTMLドキュメントとして生成されました。'}
                    </p>
                    {htmlPreviewCode && onPreview && (
                        <button 
                            onClick={handlePreviewClick}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t.agentCard.preview}
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative">
                    {/* View Toggle for History (only if report exists) */}
                    {isHtmlReport && (
                        <div className="sticky top-0 flex justify-end z-10 mb-2">
                            <button 
                                onClick={() => setViewMode('report')}
                                className="text-[10px] bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 px-2 py-1 rounded border border-emerald-700 transition-colors flex items-center gap-1 shadow-md backdrop-blur-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {language === 'en' ? 'Back to Report' : 'レポートに戻る'}
                            </button>
                        </div>
                    )}
                    {agentMessages.map((msg, index) => (
                        <div key={index} className={`${msg.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
                            <p className="font-mono text-[10px] text-gray-500 mb-0.5 opacity-70">{msg.timestamp} - {msg.sender.toUpperCase()}</p>
                            <div>
                                <MarkdownRenderer content={msg.content} artifacts={artifacts} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isThinking && viewMode === 'history' && <TypingIndicator />}
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
    prevProps.finalReport !== nextProps.finalReport ||
    prevProps.forceInitialHeight !== nextProps.forceInitialHeight // Check new prop
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

  return true;
};

const AgentCard = React.memo(AgentCardComponent, arePropsEqual);

export default AgentCard;
