
import React from 'react';

interface ErrorLog {
  timestamp: string;
  message: string;
}

interface ErrorLogModalProps {
  logs: ErrorLog[];
  onClose: () => void;
  onClear: () => void;
}

const ErrorLogModal: React.FC<ErrorLogModalProps> = ({ logs, onClose, onClear }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 glass-effect">
      <div className="bg-gray-800/80 border border-red-500 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-red-500/20 flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-red-300">エラーログ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow bg-gray-900/50 p-2 rounded-md overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center p-4">エラーログはありません。</p>
          ) : (
            <ul className="text-xs font-mono text-gray-300 space-y-2">
              {logs.map((log, index) => (
                <li key={index} className="border-b border-gray-700 pb-1">
                  <span className="text-yellow-400">{new Date(log.timestamp).toLocaleString('ja-JP')}</span>: <span className="text-red-400 whitespace-pre-wrap">{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ログをクリア
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogModal;
