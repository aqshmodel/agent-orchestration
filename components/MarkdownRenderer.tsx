import React from 'react';
import CodeBlock from './CodeBlock';
import MermaidBlock from './MermaidBlock';
import ArtifactRenderer from './ArtifactRenderer';
import { Artifact } from '../types';

interface MarkdownRendererProps {
    content: string;
    artifacts?: Record<string, Artifact>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, artifacts }) => {
    
    // 1. Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);
    
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const firstLine = part.split('\n')[0];
                    const language = firstLine.replace(/^```/, '').trim();
                    const code = part.slice(firstLine.length, -3).trim();
                    
                    if (language === 'mermaid') {
                        return <MermaidBlock key={i} code={code} />;
                    }
                    return <CodeBlock key={i} code={code} language={language} artifacts={artifacts} />;
                }

                // 2. Split by Artifact Tags or Image Generation Tags
                // <FIGURE ID="..." /> or <GENERATE_IMAGE PROMPT="..." />
                const artifactParts = part.split(/(<(?:FIGURE|GENERATE_IMAGE)\s+[^>]+>)/g).filter(Boolean);

                return artifactParts.map((subPart, j) => {
                    // Match FIGURE tag
                    const figMatch = subPart.match(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/);
                    if (figMatch) {
                        const artifactId = figMatch[1];
                        const desc = figMatch[2];
                        return <ArtifactRenderer key={`${i}-${j}`} id={artifactId} description={desc} artifacts={artifacts} />;
                    }

                    // Match GENERATE_IMAGE tag
                    const genMatch = subPart.match(/<GENERATE_IMAGE\s+PROMPT="([^"]+)"/);
                    if (genMatch) {
                        const prompt = genMatch[1];
                        return <ArtifactRenderer key={`${i}-${j}`} prompt={prompt} artifacts={artifacts} />;
                    }

                    // 3. Normal text processing
                    return subPart.trim().split(/\n\s*\n/).map((paragraph, k) => {
                        const lines = paragraph.split('\n').filter(line => line.trim() !== '');
                        const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
                        const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

                        // Check for inline image (Markdown style) - legacy support or for external images
                        const imgMatch = paragraph.match(/!\[(.*?)\]\((data:image\/.*?;base64,.*?)\)/);
                        if (imgMatch) {
                            return (
                                <div key={`${i}-${j}-${k}`} className="my-3">
                                    <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full h-auto rounded border border-gray-600 shadow-lg mx-auto" />
                                    <p className="text-center text-xs text-gray-500 mt-1">{imgMatch[1]}</p>
                                </div>
                            );
                        }

                        if (isUnorderedList) {
                            return (
                                <ul key={`${i}-${j}-${k}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                                    {lines.map((item, l) => <li key={l}>{item.trim().substring(2)}</li>)}
                                </ul>
                            );
                        }
                        if (isOrderedList) {
                             return (
                                <ol key={`${i}-${j}-${k}`} className="list-decimal list-inside space-y-1 my-2 pl-4">
                                    {lines.map((item, l) => <li key={l}>{item.trim().replace(/^\d+\.\s/, '')}</li>)}
                                </ol>
                            );
                        }
                        
                        return <p key={`${i}-${j}-${k}`} className="my-2 whitespace-pre-wrap break-words leading-relaxed">{paragraph}</p>;
                    });
                });
            })}
        </>
    );
};

export default MarkdownRenderer;