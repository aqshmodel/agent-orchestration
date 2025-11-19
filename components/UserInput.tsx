
import React, { useState, useRef, useEffect } from 'react';

interface UserInputProps {
  onSubmit: (prompt: string, files: FileData[]) => void;
  onResetAll: () => void;
  onClearConversationHistory: () => void;
  onClearKnowledgeBase: () => void;
  isLoading: boolean;
  currentStatus: string;
}

export interface FileData {
  name: string;
  type: string;
  data: string; // Base64 or Text content
  isText: boolean;
}

const UserInput: React.FC<UserInputProps> = ({ onSubmit, onResetAll, onClearConversationHistory, onClearKnowledgeBase, isLoading, currentStatus }) => {
  const [prompt, setPrompt] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileData[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        // Determine if we treat this as text for RAG or binary for Multimodal
        const isText = 
            file.type.startsWith('text/') || 
            file.name.endsWith('.md') || 
            file.name.endsWith('.json') || 
            file.name.endsWith('.csv') || 
            file.name.endsWith('.ts') || 
            file.name.endsWith('.tsx') || 
            file.name.endsWith('.js') || 
            file.name.endsWith('.py');
        
        try {
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            if (isText) {
              reader.readAsText(file);
            } else {
              reader.readAsDataURL(file);
            }
          });
          
          newFiles.push({
            name: file.name,
            type: file.type,
            data: data,
            isText: isText
          });
        } catch (error) {
          console.error("File read error:", error);
        }
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((prompt.trim() || selectedFiles.length > 0) && !isLoading) {
      onSubmit(prompt, selectedFiles);
      setPrompt('');
      setSelectedFiles([]);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700 sticky bottom-0">
       {isLoading && currentStatus && (
        <div className="text-center text-xs text-cyan-300 p-1.5 bg-gray-800/50">
          {currentStatus}
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="max-w-4xl mx-auto">
          {selectedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group inline-flex items-center bg-gray-800 border border-gray-600 rounded px-2 py-1">
                  {file.type.startsWith('image/') ? (
                     <img src={file.data} alt={file.name} className="h-8 w-8 object-cover rounded mr-2" />
                  ) : file.type.startsWith('audio/') ? (
                     <div className="mr-2 text-pink-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px]">AUDIO</span>
                     </div>
                  ) : (
                     <div className="mr-2 text-cyan-400">
                         {file.isText ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                         )}
                     </div>
                  )}
                  <span className="text-xs text-gray-300 max-w-[100px] truncate" title={file.name}>{file.name}</span>
                  <span className="ml-1 text-[9px] text-gray-500 border border-gray-600 rounded px-1">{file.isText ? 'TEXT' : file.type.split('/')[1].toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-2 text-gray-500 hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-gray-400 hover:text-cyan-400 transition-colors p-2 relative"
              title="資料を添付 (画像, 音声, PDF, テキスト)"
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
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="プレジデントへの指示を入力（会議音声やホワイトボード写真も添付可）..."
              className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
              rows={1}
              style={{ maxHeight: '150px' }}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && selectedFiles.length === 0)}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg p-3 h-full flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg p-3 h-full flex items-center justify-center transition-colors"
                title="セッション管理"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-20">
                  <ul className="text-sm text-gray-200">
                    <li>
                      <button onClick={() => { onClearConversationHistory(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 rounded-t-md">
                        <strong className="block">対話履歴のみクリア</strong>
                        <span className="text-xs text-gray-400">知識ベースは維持し、対話コンテキストをリセットします。</span>
                      </button>
                    </li>
                    <li>
                      <button onClick={() => { onClearKnowledgeBase(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700">
                        <strong className="block">知識ベースのみクリア</strong>
                        <span className="text-xs text-gray-400">対話履歴は維持し、蓄積されたキーインサイトをリセットします。</span>
                      </button>
                    </li>
                    <li className="border-t border-gray-700">
                      <button onClick={() => { onResetAll(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-800/50 rounded-b-md">
                        <strong className="block">全ての記憶をクリア (新規セッション)</strong>
                        <span className="text-xs text-gray-400">全てをリセットし、最初の状態から開始します。</span>
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
  );
};

export default UserInput;
