
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAgis } from '../../hooks/useAgis';

const Header: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const {
        contextChars,
        totalInputChars,
        totalOutputChars,
        totalApiCalls,
        selectedModel,
        setSelectedModel,
        errorLogs,
        setIsKnowledgeBaseOpen,
        setIsGraphModalOpen,
        setIsSessionManagerOpen,
        setIsErrorLogModalOpen
    } = useAgis();

    const errorLogsCount = errorLogs.length;

    // Context Usage Calculation (Approximate)
    const MAX_CONTEXT_CHARS = 1000000;
    const usagePercentage = Math.min((contextChars / MAX_CONTEXT_CHARS) * 100, 100);
    
    let usageColor = "bg-cyan-500";
    if (contextChars > 800000) usageColor = "bg-red-500";
    else if (contextChars > 400000) usageColor = "bg-yellow-500";

    return (
        <header className="text-center px-4 py-3 border-b border-gray-700/50 bg-gray-900/30 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center transition-colors duration-1000">
            <div className="flex-1 flex flex-col items-start">
            <div className="w-64"> {/* Increased width for stats */}
                <div className="flex justify-between text-[10px] text-cyan-100/80 mb-1 font-mono">
                    <span>{t.app.contextUsage}</span>
                    <span>{contextChars.toLocaleString()} {t.app.chars}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden" title={`${Math.round(usagePercentage)}% used`}>
                    <div className={`h-1.5 rounded-full ${usageColor} transition-all duration-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]`} style={{ width: `${usagePercentage}%` }}></div>
                </div>
                
                {/* Token Usage Stats - Horizontal Layout */}
                <div className="mt-1 text-[9px] text-gray-400 font-mono flex flex-wrap items-center gap-x-2 leading-tight">
                    <span className="text-purple-300 whitespace-nowrap" title="Total API Calls">Calls: {totalApiCalls}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-blue-300 whitespace-nowrap" title="Total Input">In: {totalInputChars.toLocaleString()}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-green-300 whitespace-nowrap" title="Total Output">Out: {totalOutputChars.toLocaleString()}</span>
                    <span className="text-gray-600">|</span>
                    <span className="opacity-70 whitespace-nowrap" title="Total Characters">Total: {(totalInputChars + totalOutputChars).toLocaleString()}</span>
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
                    <option value="gemini-2.5-pro">{t.app.model25Pro}</option>
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

                {errorLogsCount > 0 && (
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
    );
};

export default Header;
