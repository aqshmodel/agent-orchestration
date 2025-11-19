import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Artifact } from '../types';

interface ArtifactRendererProps {
    id?: string;
    description?: string;
    artifacts?: Record<string, Artifact>;
    prompt?: string;
}

const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ id, description, artifacts, prompt }) => {
    const { t } = useLanguage();
    
    // Find artifact by ID or by matching description/prompt
    let artifact = id && artifacts ? artifacts[id] : undefined;
    
    if (!artifact && prompt && artifacts) {
        // Use fuzzy match or exact match for prompt
        artifact = Object.values(artifacts).find(art => art.description === prompt || art.description.includes(prompt.substring(0, 20)));
    }

    if (!artifact) {
        if (prompt) {
            return (
                <div className="my-2 p-3 border border-dashed border-cyan-700 bg-cyan-900/20 rounded flex items-center justify-center space-x-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-cyan-400 text-xs">{t.agentCard.generatingImage}: "{prompt.length > 30 ? prompt.substring(0,30)+'...' : prompt}"</span>
                </div>
            );
        }
        return (
            <div className="my-2 p-3 border border-dashed border-gray-500 bg-gray-800/50 rounded text-gray-400 text-xs">
                [Artifact: {id || description} not found]
            </div>
        );
    }

    if (artifact.type === 'image') {
        return (
            <div className="my-4 bg-gray-900/80 p-2 rounded border border-gray-700">
                <div className="mb-1 text-[10px] text-gray-400 flex justify-between">
                    <span className="truncate max-w-[200px]" title={description || artifact.description}>{description || artifact.description}</span>
                    <span className="font-mono">{new Date(artifact.timestamp).toLocaleTimeString()}</span>
                </div>
                <img 
                    src={`data:${artifact.mimeType};base64,${artifact.data}`} 
                    alt={description || artifact.description} 
                    className="max-w-full h-auto rounded shadow-lg mx-auto" 
                />
                <div className="mt-2 text-center">
                    <a 
                        href={`data:${artifact.mimeType};base64,${artifact.data}`} 
                        download={`generated-image-${artifact.id}.png`}
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1 rounded transition-colors flex items-center justify-center gap-1 mx-auto w-fit"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.agentCard.downloadImage}
                    </a>
                </div>
            </div>
        );
    }
    
    return (
        <div className="my-2 p-2 bg-gray-800 rounded">
            Unknown Artifact Type: {artifact.type}
        </div>
    );
};

export default ArtifactRenderer;