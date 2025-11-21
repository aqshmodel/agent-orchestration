
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAgis } from '../../hooks/useAgis';
import { useFileHandler } from '../../hooks/useFileHandler';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

const UserInput: React.FC = () => {
  const {
      handleSendMessage: onSubmit,
      handleResetAll: onResetAll,
      handleClearConversationHistory: onClearConversationHistory,
      handleClearKnowledgeBase: onClearKnowledgeBase,
      isLoading,
      isWaitingForHuman,
      currentStatus,
      showToast
  } = useAgis();
  
  const [prompt, setPrompt] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  // Custom Hooks
  const { selectedFiles, setSelectedFiles, fileInputRef, handleFileSelect, handleRemoveFile } = useFileHandler();
  
  const onSpeechResult = (text: string) => {
      setPrompt(prev => prev + (prev ? ' ' : '') + text);
  };
  
  const onSpeechError = (msg: string) => {
      showToast(msg, 'error');
  };
  
  const { isListening, toggleListening, recognitionSupported } = useSpeechRecognition(onSpeechResult, onSpeechError);

  const isInputLoading = isLoading || isWaitingForHuman;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((prompt.trim() || selectedFiles.length > 0) && !isInputLoading) {
      onSubmit(prompt, selectedFiles);
      setPrompt('');
      setSelectedFiles([]);
    }
  };

  return (
    <div className="fixed bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-5xl z-40 flex flex-col items-center pointer-events-none">
       {isInputLoading && currentStatus && (
        <div className="pointer-events-auto mb-4 text-xs font-mono text-cyan-300 bg-gray-900/90 border border-cyan-500/50 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.3)] backdrop-blur-md animate-fade-in flex items-center gap-2">
           <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
           {currentStatus}
        </div>
      )}
      
      <div className="pointer-events-auto w-full bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl input-glow transition-all duration-300">
        <form onSubmit={handleSubmit} className="p-3 pb-0 relative flex flex-col justify-center min-h-[64px]">
          {selectedFiles.length > 0 && (
            <div className="px-2 pt-2 pb-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar border-b border-gray-800 mb-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group inline-flex items-center bg-gray-800/80 border border-gray-600 rounded-lg px-2 py-1.5">
                  {file.type.startsWith('image/') ? (
                     <img src={file.data} alt={file.name} className="h-8 w-8 object-cover rounded mr-2" />
                  ) : file.type.startsWith('audio/') ? (
                     <div className="mr-2 text-pink-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                     </div>
                  ) : (
                     <div className="mr-2 text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                     </div>
                  )}
                  <span className="text-xs text-gray-300 max-w-[100px] truncate" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-2 text-gray-500 hover:text-red-400 p-0.5 rounded hover:bg-red-900/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isInputLoading}
              className="text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-xl hover:bg-gray-800/50 flex-shrink-0"
              title={t.input.attach}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,audio/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py"
              className="hidden"
            />
            
            {/* Mic Button */}
            <button
                type="button"
                onClick={toggleListening}
                disabled={isInputLoading || !recognitionSupported}
                className={`p-2 rounded-xl flex-shrink-0 transition-colors ${isListening ? 'text-red-500 animate-pulse bg-red-900/20' : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'}`}
                title={isListening ? t.input.listening : t.input.mic}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={isListening ? t.input.listening : t.input.placeholder}
              className="flex-grow bg-transparent border-none text-gray-100 placeholder-gray-400 focus:ring-0 resize-none p-3 max-h-[200px] custom-scrollbar leading-relaxed caret-cyan-400 self-center"
              rows={1}
              disabled={isInputLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Action Buttons Group */}
            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <button
                  type="submit"
                  disabled={isInputLoading || (!prompt.trim() && selectedFiles.length === 0)}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl p-3 transition-all flex-shrink-0 shadow-[0_0_10px_rgba(8,145,178,0.5)] hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] flex items-center justify-center w-12 h-12"
                >
                  {isInputLoading ? (
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    disabled={isInputLoading}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl p-3 transition-colors flex-shrink-0 shadow-lg flex items-center justify-center w-12 h-12"
                    title={t.input.sessionMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-3 w-80 bg-gray-800/95 border border-gray-600 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden animate-fade-in">
                      <ul className="text-sm text-gray-200">
                        <li>
                          <button onClick={() => { onClearConversationHistory(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors">
                            <strong className="block">{t.input.clearHistory}</strong>
                            <span className="text-xs text-gray-400">{t.input.clearHistoryDesc}</span>
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { onClearKnowledgeBase(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors">
                            <strong className="block">{t.input.clearBrain}</strong>
                            <span className="text-xs text-gray-400">{t.input.clearBrainDesc}</span>
                          </button>
                        </li>
                        <li className="border-t border-gray-700">
                          <button onClick={() => { onResetAll(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-900/30 transition-colors">
                            <strong className="block">{t.input.resetAll}</strong>
                            <span className="text-xs text-gray-400">{t.input.resetAllDesc}</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInput;
