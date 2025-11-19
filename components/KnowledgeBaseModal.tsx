
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Artifact, Message } from '../types';
import MermaidBlock from './MermaidBlock';
import { AGENTS } from '../constants';

interface KnowledgeBaseModalProps {
  content: string;
  messages?: Record<string, Message[]>;
  artifacts?: Record<string, Artifact>;
  onClose: () => void;
}

type Tab = 'insights' | 'visuals' | 'diagrams';

const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ content, messages, artifacts, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('insights');
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  // Process Diagrams from Messages
  const diagrams = useMemo(() => {
    if (!messages) return [];
    const results: { id: string, code: string, agentId: string, timestamp: string }[] = [];
    
    Object.entries(messages).forEach(([agentId, agentMsgs]) => {
      agentMsgs.forEach((msg, msgIdx) => {
         if (msg.sender === 'agent') {
             const matches = [...msg.content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
             matches.forEach((match, matchIdx) => {
                 results.push({
                     id: `${agentId}-${msgIdx}-${matchIdx}`,
                     code: match[1],
                     agentId,
                     timestamp: msg.timestamp
                 });
             });
         }
      });
    });
    // Sort by timestamp (approximate)
    return results;
  }, [messages]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const getAgentName = (id: string) => {
      const agent = AGENTS.find(a => a.id === id);
      const trans = (t.agents as any)[id];
      return trans?.name || agent?.name || id;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 glass-effect animate-fade-in">
      <div className="bg-gray-900/95 border border-purple-500 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl shadow-purple-500/20 overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-900/30 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-purple-100">{t.modal.kbTitle}</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            {/* Tabs */}
            <div className="flex px-4 gap-2 pb-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('insights')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'insights' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    {t.modal.kbTabInsights}
                </button>
                <button 
                    onClick={() => setActiveTab('visuals')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'visuals' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    {t.modal.kbTabImages}
                    <span className="bg-black/20 px-1.5 rounded text-[10px]">{artifacts ? Object.keys(artifacts).length : 0}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('diagrams')}
                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'diagrams' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                     {t.modal.kbTabDiagrams}
                     <span className="bg-black/20 px-1.5 rounded text-[10px]">{diagrams.length}</span>
                </button>
            </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow overflow-y-auto bg-[#0f172a] p-6 custom-scrollbar">
            
            {/* 1. Insights Tab */}
            {activeTab === 'insights' && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-end mb-2">
                        <button 
                            onClick={handleCopy}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 px-3 rounded border border-gray-600 transition-colors flex items-center gap-1"
                        >
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                            {copied ? t.modal.kbCopied : t.modal.kbCopy}
                        </button>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap shadow-inner min-h-[50vh]">
                        {content ? content : <span className="text-gray-600 italic">{t.modal.kbEmpty}</span>}
                    </div>
                    <div className="mt-4 text-right text-xs text-gray-500 font-mono">
                        {t.modal.kbChars}: {content.length.toLocaleString()} chars
                    </div>
                </div>
            )}

            {/* 2. Visuals Tab */}
            {activeTab === 'visuals' && (
                <div>
                    {!artifacts || Object.keys(artifacts).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>{t.modal.kbNoImages}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.values(artifacts).filter(a => a.type === 'image').reverse().map((art) => (
                                <div key={art.id} className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-500 transition-all hover:shadow-xl hover:shadow-cyan-900/20">
                                    <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                                        <img src={`data:${art.mimeType};base64,${art.data}`} alt={art.description} className="object-contain w-full h-full" />
                                    </div>
                                    <div className="p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{art.agentId}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{new Date(art.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 line-clamp-2 mb-3" title={art.description}>{art.description}</p>
                                        <a 
                                            href={`data:${art.mimeType};base64,${art.data}`} 
                                            download={`asset-${art.id}.png`}
                                            className="block w-full text-center bg-gray-700 hover:bg-cyan-700 text-white text-xs font-bold py-2 rounded transition-colors"
                                        >
                                            {t.modal.kbDownload}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Diagrams Tab */}
            {activeTab === 'diagrams' && (
                 <div>
                    {diagrams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <p>{t.modal.kbNoDiagrams}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {diagrams.map((diag) => (
                                <div key={diag.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                                    <div className="bg-gray-900 p-3 border-b border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-400">{t.modal.kbDiagramSource.replace('{agent}', getAgentName(diag.agentId))}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">{new Date(diag.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="p-2 flex-grow bg-slate-900">
                                        <MermaidBlock code={diag.code} className="my-0 bg-transparent border-none" />
                                    </div>
                                    <div className="p-2 bg-gray-900 border-t border-gray-700">
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-gray-400 hover:text-white">Source Code</summary>
                                            <pre className="mt-2 p-2 bg-black rounded text-emerald-200 overflow-x-auto font-mono text-[10px]">
                                                {diag.code}
                                            </pre>
                                        </details>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseModal;
