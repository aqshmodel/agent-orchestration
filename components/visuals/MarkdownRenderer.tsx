
import React from 'react';
import CodeBlock from '../common/CodeBlock';
import MermaidBlock from './MermaidBlock';
import ArtifactRenderer from './ArtifactRenderer';
import { Artifact } from '../../types';
import { parseMarkdownContent } from '../../utils/contentProcessor';

interface MarkdownRendererProps {
    content: string;
    artifacts?: Record<string, Artifact>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, artifacts }) => {
    // Parse the content into structured parts using the utility
    const parsedParts = parseMarkdownContent(content);
    
    return (
        <>
            {parsedParts.map((part, i) => {
                if (part.type === 'code') {
                    return <CodeBlock key={i} code={part.content} language={part.language} artifacts={artifacts} />;
                }
                
                if (part.type === 'mermaid') {
                    return <MermaidBlock key={i} code={part.content} />;
                }
                
                if (part.type === 'artifact_tag') {
                    return (
                        <ArtifactRenderer 
                            key={i} 
                            id={part.id} 
                            description={part.description} 
                            prompt={part.prompt} 
                            artifacts={artifacts} 
                        />
                    );
                }

                // Text processing
                return part.content.trim().split(/\n\s*\n/).map((paragraph, k) => {
                    const lines = paragraph.split('\n').filter(line => line.trim() !== '');
                    if (lines.length === 0) return null;

                    const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
                    const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

                    // Check for inline image (Markdown style) - legacy support or for external images
                    const imgMatch = paragraph.match(/!\[(.*?)\]\((data:image\/.*?;base64,.*?)\)/);
                    if (imgMatch) {
                        return (
                            <div key={`${i}-${k}`} className="my-3">
                                <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full h-auto rounded border border-gray-600 shadow-lg mx-auto" />
                                <p className="text-center text-xs text-gray-500 mt-1">{imgMatch[1]}</p>
                            </div>
                        );
                    }

                    if (isUnorderedList) {
                        return (
                            <ul key={`${i}-${k}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                                {lines.map((item, l) => <li key={l}>{item.trim().substring(2)}</li>)}
                            </ul>
                        );
                    }
                    if (isOrderedList) {
                            return (
                            <ol key={`${i}-${k}`} className="list-decimal list-inside space-y-1 my-2 pl-4">
                                {lines.map((item, l) => <li key={l}>{item.trim().replace(/^\d+\.\s/, '')}</li>)}
                            </ol>
                        );
                    }
                    
                    return <p key={`${i}-${k}`} className="my-2 whitespace-pre-wrap break-words leading-relaxed">{paragraph}</p>;
                });
            })}
        </>
    );
};

export default MarkdownRenderer;
