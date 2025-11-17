
import React, { useRef, useEffect, useState } from 'react';
import { Agent, Message } from '../types';
import { TEAM_COLORS } from '../constants';

interface AgentCardProps {
  agent: Agent;
  messages: Message[];
  isThinking: boolean;
  finalReportContent?: string | null;
  isSelected: boolean;
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

const AgentCard: React.FC<AgentCardProps> = ({ agent, messages, isThinking, finalReportContent, isSelected }) => {
  const teamColor = TEAM_COLORS[agent.team];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (messages.length > prevMessagesLength.current) {
        setHighlight(true);
        const timer = setTimeout(() => setHighlight(false), 1200);
        return () => clearTimeout(timer);
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

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

  const selectionClass = isSelected ? 'hover:-translate-y-1' : 'filter grayscale opacity-60';

  return (
    <div className={`flex flex-col border ${teamColor.border} rounded-lg h-full glass-effect ${teamColor.bg} ${isThinking ? 'thinking-border-animation' : ''} ${highlight ? 'flash-border-animation' : ''} transition-all duration-300 ${selectionClass}`}>
      <div className={`p-3 border-b ${teamColor.border} flex justify-between items-center`}>
        <div>
          <h3 className="font-bold text-sm text-white">{agent.name}</h3>
          <p className={`text-xs ${teamColor.text}`}>{agent.role}</p>
        </div>
        {finalReportContent && (
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
      </div>
      <div className="flex-grow p-3 overflow-y-auto text-sm space-y-2 relative min-h-0">
        {messages.map((msg, index) => (
          <div key={index} className={`${msg.sender === 'user' ? 'text-cyan-300' : 'text-gray-200'}`}>
            <p className="font-mono text-xs text-gray-500">{msg.timestamp}</p>
            <div>{renderContent(msg.content)}</div>
          </div>
        ))}
        {isThinking && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AgentCard;