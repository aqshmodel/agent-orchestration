

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Artifact } from '../types';

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
        html = html.replace(/<GENERATE_IMAGE\s+PROMPT="([^"]+)"[^>]*\/>/g, (match, prompt) => {
            // Find artifact by prompt description (fuzzy match)
            const foundArtifact = Object.values(artifacts).find(art => 
                art.type === 'image' && (art.description === prompt || art.description.includes(prompt.substring(0, 20)))
            );
            
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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[200] animate-fade-in">
      <div className="bg-gray-900 border border-cyan-500 rounded-lg w-full max-w-[90vw] h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/30 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-gray-900">
            <h2 className="text-lg font-bold text-cyan-100 flex items-center gap-2">
                <span className="bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded text-xs border border-cyan-700">HTML Preview</span>
                {t.modal.previewTitle}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="p-6 w-full h-full overflow-auto bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm">
                    <pre>{processedCode}</pre>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-2 bg-gray-900 border-t border-gray-800 text-xs text-gray-500 flex justify-between items-center">
            <span>Sandbox Environment</span>
            {language === 'html' && <span className="text-amber-500">⚠️ Scripts are allowed. Be careful with external links.</span>}
        </div>
      </div>
    </div>
  );
};

export default ArtifactPreviewModal;