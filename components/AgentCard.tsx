
import React, { useRef, useEffect, useState } from 'react';
import { Agent, Message } from '../types';
import { TEAM_COLORS } from '../constants';

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

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="relative group my-2">
            <pre className="bg-gray-800/60 p-3 rounded-md font-mono text-xs text-cyan-200 overflow-x-auto">
                <code>{code}</code>
            </pre>
            <button 
                onClick={handleCopy} 
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-all opacity-0 group-hover:opacity-100"
                title="Copy code"
            >
                {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    );
};

const AgentCard: React.FC<AgentCardProps> = ({ id, agent, messages, isThinking, finalReportContent, isCompact, isExpanded, onExpand, onClose }) => {
  const teamColor = TEAM_COLORS[agent.team];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      // Use scrollTop assignment instead of scrollIntoView to prevent scrolling parent containers
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

  const handleDownload = () => {
    if (!finalReportContent) return;
    const blob = new Blob([finalReportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AGIS-Report-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
      <span className="text-gray-400 text-sm">思考中</span>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
  );
  
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);
    return parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
            const code = part.slice(3, -3).trim();
            return <CodeBlock key={i} code={code} />;
        }

        return part.trim().split(/\n\s*\n/).map((paragraph, j) => {
            const lines = paragraph.split('\n').filter(line => line.trim() !== '');
            const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
            const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

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
            
            return <p key={`${i}-${j}`} className="my-2 whitespace-pre-wrap">{paragraph}</p>;
        });
    });
  };

  // Dynamic height classes
  const heightClass = isExpanded 
    ? 'h-full' 
    : isCompact 
        ? 'h-auto justify-center' 
        : 'h-[240px]';
  
  // Only show expand button if there are messages or if it's the president/orchestrator with content
  const showExpandButton = messages.length > 0;

  return (
    <div id={id} className={`flex flex-col border ${teamColor.border} rounded-lg ${heightClass} glass-effect ${teamColor.bg} ${isThinking && !isCompact ? 'thinking-border-animation' : ''} ${highlight && !isCompact ? 'flash-border-animation' : ''} transition-all duration-300 ${!isExpanded ? 'hover:-translate-y-1' : ''}`}>
      <div className={`p-3 ${!isCompact || isExpanded ? `border-b ${teamColor.border}` : ''} flex justify-between items-center sticky top-0 z-10 ${teamColor.bg.replace('/50', '/90')} backdrop-blur-md rounded-t-lg`}>
        <div>
          {(!isCompact || isExpanded) && <p className={`text-xs ${teamColor.text} font-bold opacity-80`}>{agent.team}</p>}
          <h3 className="font-bold text-sm text-white">{agent.name}</h3>
          <p className={`text-xs ${teamColor.text}`}>{agent.role}</p>
        </div>
        <div className="flex items-center space-x-2">
            {finalReportContent && (!isCompact || isExpanded) && (
              <button
                onClick={handleDownload}
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors"
                title="最終レポートをダウンロード"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isExpanded && onClose && (
                 <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-white transition-colors p-1"
                    title="閉じる"
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
                    title="拡大"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
            )}
        </div>
      </div>
      {(!isCompact || isExpanded) && (
        <div ref={scrollContainerRef} className="flex-grow p-3 overflow-y-auto text-sm space-y-2 relative min-h-0">
            {messages.map((msg, index) => (
            <div key={index} className={`${msg.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
                <p className="font-mono text-xs text-gray-500">{msg.timestamp}</p>
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
