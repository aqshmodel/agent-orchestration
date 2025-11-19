
import React, { useState, useEffect } from 'react';

export interface SessionMetadata {
  id: string;
  name: string;
  lastModified: number;
  preview: string;
}

interface SessionManagerModalProps {
  currentSessionId: string | null;
  onLoad: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

const SessionManagerModal: React.FC<SessionManagerModalProps> = ({ 
  currentSessionId, onLoad, onSave, onDelete, onNew, onClose 
}) => {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [newSessionName, setNewSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const indexStr = localStorage.getItem('agis_sessions_index');
      if (indexStr) {
        const index = JSON.parse(indexStr) as SessionMetadata[];
        // Sort by last modified descending
        setSessions(index.sort((a, b) => b.lastModified - a.lastModified));
      }
    } catch (e) {
      console.error("Failed to load sessions index", e);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    
    onSave(newSessionName);
    setNewSessionName('');
    setIsSaving(false);
    loadSessions(); // Reload list
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('本当にこのセッションを削除しますか？')) {
      onDelete(id);
      loadSessions();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 glass-effect animate-fade-in">
      <div className="bg-gray-900/95 border border-cyan-600 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-cyan-500/20 flex flex-col h-[80vh]">
        
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-100 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            プロジェクト・セッション管理
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
            {/* Left Column: Save Current / New */}
            <div className="flex flex-col space-y-6 border-r border-gray-800 pr-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-300 mb-3">現在の状態を保存</h3>
                    <form onSubmit={handleSave}>
                        <input 
                            type="text" 
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="プロジェクト名を入力..."
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm mb-3 focus:border-cyan-500 focus:outline-none"
                        />
                        <button 
                            type="submit"
                            disabled={!newSessionName.trim()}
                            className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            保存する
                        </button>
                    </form>
                </div>

                <div className="mt-auto">
                    <button 
                        onClick={() => { if(window.confirm('現在の作業内容は保存されていますか？\n保存されていない内容は失われます。新規セッションを開始しますか？')) { onNew(); onClose(); } }}
                        className="w-full border border-dashed border-gray-500 hover:border-cyan-400 hover:text-cyan-400 text-gray-400 py-4 rounded-lg transition-all flex flex-col items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        新規セッションを開始
                    </button>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-gray-300 mb-3">保存済みセッション</h3>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {sessions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-10">保存されたセッションはありません</p>
                    ) : (
                        sessions.map(session => (
                            <div 
                                key={session.id}
                                onClick={() => { onLoad(session.id); onClose(); }}
                                className={`group p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-800 relative ${currentSessionId === session.id ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700 bg-gray-800/30'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${currentSessionId === session.id ? 'text-cyan-300' : 'text-gray-200 group-hover:text-white'}`}>
                                        {session.name}
                                    </h4>
                                    {currentSessionId === session.id && <span className="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700">Active</span>}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{new Date(session.lastModified).toLocaleString()}</p>
                                <p className="text-xs text-gray-400 line-clamp-2">{session.preview || "No preview available"}</p>
                                
                                <button 
                                    onClick={(e) => handleDelete(session.id, e)}
                                    className="absolute top-3 right-3 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="削除"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagerModal;
