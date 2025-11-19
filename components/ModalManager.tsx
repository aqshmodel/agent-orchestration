
import React from 'react';
import { AGENTS } from '../constants';
import Toast from './Toast';
import QuestionModal from './QuestionModal';
import ErrorLogModal from './ErrorLogModal';
import KnowledgeBaseModal from './KnowledgeBaseModal';
import SessionManagerModal from './SessionManagerModal';
import DependencyGraphModal from './DependencyGraphModal';
import AgentCard from './AgentCard';
import ArtifactPreviewModal from './ArtifactPreviewModal';
import { useAgis } from '../hooks/useAgis';

const ModalManager: React.FC = () => {
    const {
        messages,
        isLoading,
        thinkingAgents,
        finalReport,
        toast,
        humanQuestion,
        errorLogs,
        isErrorLogModalOpen,
        isKnowledgeBaseOpen,
        isSessionManagerOpen,
        isGraphModalOpen,
        isPreviewModalOpen,
        expandedAgentId,
        selectedAgents,
        currentSessionId,
        sharedKnowledgeBaseContent,
        graphEvents,
        artifacts,
        previewCode,
        handleHumanResponse,
        handleLoadSession,
        handleSaveSession,
        handleDeleteSession,
        handleNewSession,
        clearErrorLogs,
        setExpandedAgentId,
        setIsErrorLogModalOpen,
        setIsKnowledgeBaseOpen,
        setIsSessionManagerOpen,
        setIsGraphModalOpen,
        setIsPreviewModalOpen,
        handleOpenPreview,
    } = useAgis();

    const expandedAgent = expandedAgentId ? AGENTS.find(a => a.id === expandedAgentId) : null;

    return (
        <>
            <Toast message={toast?.message} type={toast?.type} />
            {humanQuestion && <QuestionModal question={humanQuestion} onSubmit={handleHumanResponse} isLoading={isLoading} />}
            {isErrorLogModalOpen && <ErrorLogModal logs={errorLogs} onClose={() => setIsErrorLogModalOpen(false)} onClear={clearErrorLogs} />}
            {isKnowledgeBaseOpen && (
                <KnowledgeBaseModal
                    content={sharedKnowledgeBaseContent}
                    messages={messages}
                    artifacts={artifacts}
                    onClose={() => setIsKnowledgeBaseOpen(false)}
                />
            )}
            {isGraphModalOpen && <DependencyGraphModal events={graphEvents} selectedAgents={selectedAgents} onClose={() => setIsGraphModalOpen(false)} onAgentClick={(id) => setExpandedAgentId(id)} />}
            {isSessionManagerOpen && (
                <SessionManagerModal
                    currentSessionId={currentSessionId}
                    onLoad={handleLoadSession}
                    onSave={handleSaveSession}
                    onDelete={handleDeleteSession}
                    onNew={handleNewSession}
                    onClose={() => setIsSessionManagerOpen(false)}
                />
            )}
            {isPreviewModalOpen && previewCode && (
                <ArtifactPreviewModal 
                    code={previewCode.code}
                    language={previewCode.language}
                    artifacts={artifacts}
                    onClose={() => setIsPreviewModalOpen(false)}
                />
            )}

            {/* Expanded Agent Modal */}
            {expandedAgentId && expandedAgent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setExpandedAgentId(null)}></div>
                    <div className="relative w-full max-w-5xl h-[90vh] z-10 shadow-2xl shadow-cyan-500/20 rounded-lg overflow-hidden">
                        <AgentCard
                            key={`expanded-${expandedAgent.id}`}
                            agent={expandedAgent}
                            isExpanded={true}
                            messages={messages[expandedAgent.id] || []}
                            isThinking={thinkingAgents.has(expandedAgent.id)}
                            finalReport={expandedAgent.id === 'president' ? finalReport : null}
                            artifacts={artifacts}
                            onClose={() => setExpandedAgentId(null)}
                            onPreview={handleOpenPreview}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ModalManager;
