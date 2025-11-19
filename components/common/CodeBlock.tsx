
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Artifact } from '../../types';
import { useAgis } from '../../hooks/useAgis';

interface CodeBlockProps {
    code: string;
    language?: string;
    artifacts?: Record<string, Artifact>;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text', artifacts }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
    const { handleOpenPreview } = useAgis();
    
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Special handling for execution results
    const isExecutionResult = code.includes('[Execution Result:');
    
    // Detect if this is a downloadable artifact
    const isDownloadable = language && (
        language === 'html' || 
        language === 'javascript' || 
        language === 'js' || 
        language === 'typescript' || 
        language === 'ts' || 
        language === 'python' || 
        language === 'py' ||
        language === 'xml' ||
        language === 'json' ||
        language === 'css' ||
        language === 'sql'
    );
    
    // Detect specific artifact types for extension
    const isHTML = language === 'html';
    const isGAS = (language === 'javascript' || language === 'js') && (code.includes('function createPresentation') || code.includes('SpreadsheetApp') || code.includes('SlidesApp'));
    const isPython = language === 'python' || language === 'py';
    
    const handleDownloadArtifact = () => {
        let fileContent = code;
        let mimeType = 'text/plain';
        let extension = 'txt';

        // Handle Image Embedding for HTML
        if (isHTML && artifacts) {
            // First replace specific Generate tags
             fileContent = fileContent.replace(/<GENERATE_IMAGE\s+PROMPT="([^"]+)"[^>]*\/>/g, (match, prompt) => {
                // Fuzzy match for artifacts by prompt description
                const foundArtifact = Object.values(artifacts).find(art => art.description.includes(prompt.substring(0, 20)));
                
                if (foundArtifact && foundArtifact.type === 'image') {
                     return `<img src="data:${foundArtifact.mimeType};base64,${foundArtifact.data}" alt="${prompt}" style="max-width:100%; border-radius:8px;" />`;
                }
                return `<div style="background:#333; color:#fff; padding:20px; text-align:center;">[Image Placeholder: ${prompt}]</div>`;
            });
            
            // Also look for simple img src placeholders if agents used them
             fileContent = fileContent.replace(/<img src="\[IMAGE_(\d+)\]" \/>/g, (match, id) => {
                 return match; 
             });
             
            mimeType = 'text/html';
            extension = 'html';
        } else if (isGAS) {
            mimeType = 'text/javascript';
            extension = 'gs';
        } else if (isPython) {
             mimeType = 'text/x-python';
             extension = 'py';
        } else if (language === 'json') {
             mimeType = 'application/json';
             extension = 'json';
        } else if (language) {
            extension = language;
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artifact_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handlePreview = () => {
        if (handleOpenPreview && language) {
            handleOpenPreview(code, language);
        }
    };

    let downloadLabel = 'File';
    if (isHTML) downloadLabel = '.html';
    else if (isGAS) downloadLabel = '.gs';
    else if (language) downloadLabel = `.${language}`;

    return (
        <div className={`relative group my-2 ${isExecutionResult ? 'border-l-4 border-green-500' : ''}`}>
            {language && !isExecutionResult && <div className="absolute top-0 right-0 bg-gray-700 text-gray-400 text-[10px] px-2 py-0.5 rounded-bl rounded-tr">{language}</div>}
            {isExecutionResult && <div className="absolute top-0 right-0 bg-green-900/80 text-green-300 text-[10px] px-2 py-0.5 rounded-bl rounded-tr">Output</div>}
            
            <pre className={`bg-gray-800/60 p-3 rounded-md font-mono text-xs overflow-x-auto ${isExecutionResult ? 'text-green-100' : 'text-cyan-200'}`}>
                <code>{code}</code>
            </pre>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Preview Button for HTML */}
                {isHTML && (
                    <button
                        onClick={handlePreview}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-all flex items-center shadow-lg shadow-emerald-900/50"
                        title={t.agentCard.preview}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Preview
                    </button>
                )}
                
                <button 
                    onClick={handleCopy} 
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-all"
                    title={t.agentCard.copy}
                >
                    {copied ? t.agentCard.copied : t.agentCard.copy}
                </button>
                {isDownloadable && !isExecutionResult && (
                     <button 
                        onClick={handleDownloadArtifact}
                        className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-all flex items-center"
                        title={t.agentCard.download}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {downloadLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CodeBlock;
