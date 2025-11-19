import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuestionModalProps {
  question: string;
  onSubmit: (answer: string) => void;
  isLoading: boolean;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, onSubmit, isLoading }) => {
  const [answer, setAnswer] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !isLoading) {
      onSubmit(answer);
      setAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 glass-effect">
      <div className="bg-gray-800/80 border border-cyan-500 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl shadow-cyan-500/20 flex flex-col" style={{maxHeight: '80vh'}}>
        <h2 className="text-lg font-bold text-cyan-300 mb-2 flex-shrink-0">{t.modal.questionTitle}</h2>
        <div className="overflow-y-auto mb-4 pr-2 flex-grow">
          <p className="text-gray-300 whitespace-pre-wrap">{question}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex-shrink-0">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t.modal.questionPlaceholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
            rows={3}
            disabled={isLoading}
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !answer.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {t.modal.questionSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionModal;