
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Artifact } from '../../types';

interface ArtifactPreviewModalProps {
  code: string;
  language: string;
  artifacts?: Record<string, Artifact>;
  onClose: () => void;
}

const ArtifactPreviewModal: React.FC<ArtifactPreviewModalProps> = ({ code, language, artifacts, onClose }) => {
  const { t } = useLanguage();
  const [processedCode, setProcessedCode] = useState('');

  useEffect(() => {
    // Inject images into HTML if available
    if (language === 'html' && artifacts) {
        let html = code;
        
        // Replace <GENERATE_IMAGE> tags with actual base64 images
        // Support both ID-based and Prompt-based lookup
        html = html.replace(/<GENERATE_IMAGE\s+(?:ID="([^"]+)"\s+)?PROMPT="([^"]+)"[^>]*\/>/g, (match, id, prompt) => {
            let foundArtifact;
            
            // 1. Try ID
            if (id && artifacts[id]) {
                foundArtifact = artifacts[id];
            }
            
            // 2. Try Prompt Fuzzy
            if (!foundArtifact) {
                foundArtifact = Object.values(artifacts).find((art: Artifact) => 
                    art.type === 'image' && (art.description === prompt || art.description.includes(prompt.substring(0, 20)))
                );
            }
            
            if (foundArtifact) {
                 return `<img src="data:${foundArtifact.mimeType};base64,${foundArtifact.data}" alt="${prompt}" style="max-width:100%;" />`;
            }
            // If not found, replace with a placeholder
            return `<div style="background:#333; color:#fff; padding:20px; text-align:center; border:1px dashed #666;">[Generating Image: ${prompt}...]</div>`;
        });

        // Replace <FIGURE> tags (Python generated graphs)
        html = html.replace(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/g, (match, id, desc) => {
            const foundArtifact = artifacts[id];
            if (foundArtifact && foundArtifact.type === 'image') {
                 return `<img src="data:${foundArtifact.mimeType};base64,${foundArtifact.data}" alt="${desc}" style="max-width:100%;" />`;
            }
            return `<div style="background:#333; color:#fff; padding:20px; text-align:center; border:1px dashed #666;">[Graph: ${desc}]</div>`;
        });

        // Also handle simple placeholders if agents used them (e.g. [IMAGE_ID]) - less common but good to have
        html = html.replace(/src="\[IMAGE_(\d+)\]"/g, (match, id) => {
             // Logic to find by some ID if needed, currently placeholders are mostly tags
             return match;
        });

        setProcessedCode(html);
    } else {
        setProcessedCode(code);
    }
  }, [code, language, artifacts]);

  return (
    <div className="fixed inset-0 z-[200] bg-black animate-fade-in">
      <div className="w-full h-full flex flex-col bg-gray-900 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900 shadow-md z-10">
            <h2 className="text-xl font-bold text-cyan-100 flex items-center gap-3">
                <span className="bg-cyan-900 text-cyan-300 px-3 py-1 rounded text-sm border border-cyan-700 font-mono tracking-wider">HTML PREVIEW</span>
                <span className="opacity-90">{t.modal.previewTitle}</span>
            </h2>
            <button 
                onClick={onClose} 
                className="text-gray-300 hover:text-white hover:bg-red-900/50 transition-colors p-2 rounded-full flex items-center gap-2 group"
                title="Close Preview"
            >
                <span className="text-sm font-bold hidden sm:inline group-hover:text-red-300 transition-colors">CLOSE</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow bg-white relative">
            {language === 'html' ? (
                 <iframe 
                    srcDoc={processedCode}
                    title="Artifact Preview"
                    className="w-full h-full border-none bg-white"
                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" 
                 />
            ) : (
                <div className="p-8 w-full h-full overflow-auto bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm leading-relaxed">
                    <pre>{processedCode}</pre>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center">
            <span>Sandbox Environment - Full Screen Mode</span>
            {language === 'html' && <span className="text-amber-500">⚠️ Scripts are allowed. Be careful with external links.</span>}
        </div>
      </div>
    </div>
  );
};

export default ArtifactPreviewModal;
