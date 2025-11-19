
import React, { useState } from 'react';

interface KnowledgeBaseModalProps {
  content: string;
  onClose: () => void;
}

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ content, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 glass-effect animate-fade-in">
      <div className="bg-gray-900/90 border border-purple-500 rounded-lg p-6 max-w-4xl w-full mx-4 shadow-2xl shadow-purple-500/20 flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="text-xl font-bold text-purple-100">組織の脳 (Shared Knowledge Base)</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button 
                onClick={handleCopy}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded border border-gray-600 transition-colors"
            >
                {copied ? 'コピーしました' : 'クリップボードにコピー'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-grow bg-gray-950 p-4 rounded-md overflow-y-auto border border-gray-800 font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap shadow-inner">
            {content ? content : <span className="text-gray-600 italic">まだ知識は蓄積されていません...</span>}
        </div>
        
        <div className="mt-4 text-right text-xs text-gray-500">
            現在蓄積されている文字数: {content.length.toLocaleString()} chars
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;
