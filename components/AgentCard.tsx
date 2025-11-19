
import React, { useRef, useEffect, useState } from 'react';
import { Agent, Message } from '../types';
import { AGENT_COLORS, TEAM_COLORS } from '../constants';
import { generateHtmlReport, generateWordDoc } from '../utils/reportGenerator';
import { useLanguage } from '../contexts/LanguageContext';

// Declare Mermaid global
declare const mermaid: any;

interface AgentCardProps {
  id?: string;
  agent: Agent;
  messages: Message[];
  isThinking: boolean;
  finalReportContent?: string | null;
  isCompact?: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
}

const CodeBlock: React.FC<{ code: string, language?: string }> = ({ code, language = 'text' }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
    
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Special handling for execution results
    const isExecutionResult = code.includes('[Execution Result:');

    return (
        <div className={`relative group my-2 ${isExecutionResult ? 'border-l-4 border-green-500' : ''}`}>
            {language && !isExecutionResult && <div className="absolute top-0 right-0 bg-gray-700 text-gray-400 text-[10px] px-2 py-0.5 rounded-bl rounded-tr">{language}</div>}
            {isExecutionResult && <div className="absolute top-0 right-0 bg-green-900/80 text-green-300 text-[10px] px-2 py-0.5 rounded-bl rounded-tr">Output</div>}
            
            <pre className={`bg-gray-800/60 p-3 rounded-md font-mono text-xs overflow-x-auto ${isExecutionResult ? 'text-green-100' : 'text-cyan-200'}`}>
                <code>{code}</code>
            </pre>
            <button 
                onClick={handleCopy} 
                className="absolute top-2 right-12 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-all opacity-0 group-hover:opacity-100"
                title="Copy code"
            >
                {copied ? t.agentCard.copied : t.agentCard.copy}
            </button>
        </div>
    );
};

const MermaidBlock: React.FC<{ code: string }> = ({ code }) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;
    const { t } = useLanguage();

    useEffect(() => {
        const renderChart = async () => {
            try {
                if (typeof mermaid !== 'undefined') {
                    // Clean up code (remove markdown wrapper if present)
                    const cleanCode = code.replace(/^```mermaid\n?/, '').replace(/```$/, '').trim();
                    // Need to ensure element exists before rendering
                    if(containerRef.current) {
                         // Reset for re-render
                         containerRef.current.innerHTML = ''; 
                         const { svg } = await mermaid.render(id, cleanCode);
                         setSvg(svg);
                         setError(null);
                    }
                } else {
                    setError(t.errors.mermaidLib);
                }
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                setError(t.errors.mermaidRender + err.message);
            }
        };
        // Simple debounce/delay to ensure DOM readiness
        const timer = setTimeout(renderChart, 100);
        return () => clearTimeout(timer);
    }, [code, id, t]);

    if (error) return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-2 text-xs rounded my-2">
            <p className="font-bold">Mermaid Error:</p>
            <p>{error}</p>
            <pre className="mt-1 opacity-50 text-[10px] overflow-x-auto">{code}</pre>
        </div>
    );
    
    // Render SVG
    return (
        <div ref={containerRef} className="my-4 bg-gray-800/50 p-4 rounded-lg overflow-x-auto flex justify-center border border-gray-700" dangerouslySetInnerHTML={{ __html: svg }} />
    );
};

const AgentCard: React.FC<AgentCardProps> = ({ id, agent, messages, isThinking, finalReportContent, isCompact, isExpanded, onExpand, onClose }) => {
  const teamColor = AGENT_COLORS[agent.id] ?? TEAM_COLORS[agent.team];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const { t } = useLanguage();
  
  // Get translated names
  // Use type assertion to allow string indexing if types are strict
  const transAgent = (t.agents as any)[agent.id] || { name: agent.name, role: agent.role };
  const transTeam = (t.teams as any)[agent.team] || agent.team;

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
      if (messages.length > prevMessagesLength.current) {
          setHighlight(true);
          const timer = setTimeout(() => setHighlight(false), 1200);
          return () => clearTimeout(timer);
      }
      prevMessagesLength.current = messages.length;
    }
  }, [messages, isCompact]);

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

  const handleDownloadHtml = () => {
      if (!finalReportContent) return;
      const htmlContent = generateHtmlReport(finalReportContent);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AGIS-WebReport-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsDownloadMenuOpen(false);
  };

  const handleDownloadWord = () => {
      if (!finalReportContent) return;
      const wordContent = generateWordDoc(finalReportContent);
      // Using application/msword to trigger Word opening
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
  
  const renderContent = (content: string) => {
    // Split by code blocks (```...```)
    const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);
    
    return parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
            // Extract code content and potential language
            const firstLine = part.split('\n')[0];
            const language = firstLine.replace(/^```/, '').trim();
            const code = part.slice(firstLine.length, -3).trim();
            
            if (language === 'mermaid') {
                return <MermaidBlock key={i} code={code} />;
            }
            return <CodeBlock key={i} code={code} language={language} />;
        }

        // Normal text processing with Markdown-like image handling
        return part.trim().split(/\n\s*\n/).map((paragraph, j) => {
            const lines = paragraph.split('\n').filter(line => line.trim() !== '');
            const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
            const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

            // Check for inline image (e.g., from code execution or file upload context simulation)
            const imgMatch = paragraph.match(/!\[(.*?)\]\((data:image\/.*?;base64,.*?)\)/);
            if (imgMatch) {
                return (
                    <div key={`${i}-${j}`} className="my-3">
                        <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full h-auto rounded border border-gray-600 shadow-lg mx-auto" />
                        <p className="text-center text-xs text-gray-500 mt-1">{imgMatch[1]}</p>
                    </div>
                );
            }

            if (isUnorderedList) {
                return (
                    <ul key={`${i}-${j}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                        {lines.map((item, k) => <li key={k}>{item.trim().substring(2)}</li>)}
                    </ul>
                );
            }
            if (isOrderedList) {
                 return (
                    <ol key={`${i}-${j}`} className="list-decimal list-inside space-y-1 my-2 pl-4">
                        {lines.map((item, k) => <li key={k}>{item.trim().replace(/^\d+\.\s/, '')}</li>)}
                    </ol>
                );
            }
            
            return <p key={`${i}-${j}`} className="my-2 whitespace-pre-wrap break-words leading-relaxed">{paragraph}</p>;
        });
    });
  };

  // Dynamic height classes
  const heightClass = isExpanded 
    ? 'h-full' 
    : isCompact 
        ? 'h-auto justify-center' 
        : 'h-[240px]';
  
  const showExpandButton = messages.length > 0;

  return (
    <div id={id} className={`flex flex-col border ${teamColor.border} rounded-lg ${heightClass} glass-effect ${teamColor.bg} ${isThinking ? 'thinking-border-animation ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : ''} ${!isThinking && highlight && !isCompact ? 'flash-border-animation' : ''} transition-all duration-300 ${!isExpanded ? 'hover:-translate-y-1' : ''}`}>
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
                             onClick={handleDownloadHtml}
                             className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center border-t border-gray-700 whitespace-nowrap"
                          >
                              <span className="bg-cyan-900 text-cyan-300 text-[10px] p-1 rounded mr-3 font-mono w-10 text-center">.html</span>
                              {t.agentCard.saveHtml}
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
            {messages.map((msg, index) => (
            <div key={index} className={`${msg.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
                <p className="font-mono text-[10px] text-gray-500 mb-0.5 opacity-70">{msg.timestamp} - {msg.sender.toUpperCase()}</p>
                <div>{renderContent(msg.content)}</div>
            </div>
            ))}
            {isThinking && <TypingIndicator />}
        </div>
      )}
    </div>
  );
};

export default AgentCard;
