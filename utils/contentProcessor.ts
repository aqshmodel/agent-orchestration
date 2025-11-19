
import { Artifact } from '../types';

/**
 * Extracts HTML content from a mixed text response.
 * Prioritizes explicit code blocks, then Python string assignments, then raw HTML structures.
 */
export const extractHtmlFromContent = (content: string | null | undefined): string | null => {
    if (!content) return null;
    
    // 1. Check for explicit ```html or ```xml blocks containing DOCTYPE or <html
    const htmlBlockMatch = content.match(/```(?:html|xml)\n([\s\S]*?)```/);
    if (htmlBlockMatch && (htmlBlockMatch[1].includes('<!DOCTYPE html>') || htmlBlockMatch[1].includes('<html'))) {
        return htmlBlockMatch[1];
    }

    // 2. Check for Python multi-line string assignment (e.g. html = """...""")
    // This handles the case where AI outputs Python code to generate HTML
    const pythonStringMatch = content.match(/["']{3}\s*(<!DOCTYPE html>[\s\S]*?<\/html>)\s*["']{3}/);
    if (pythonStringMatch) {
        return pythonStringMatch[1];
    }

    // 3. Check for direct HTML structure embedded in text
    const directMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (directMatch) {
        return directMatch[0];
    }
    
    // 4. Check if the content starts like an HTML file (allowing for whitespace/markdown preamble)
    if (content.trim().match(/^<!DOCTYPE html>/i) || content.trim().match(/^<html/i)) {
        return content;
    }

    return null;
};

export type ContentPart = 
  | { type: 'code'; language: string; content: string }
  | { type: 'mermaid'; content: string }
  | { type: 'artifact_tag'; id?: string; description?: string; prompt?: string }
  | { type: 'text'; content: string };

/**
 * Parses markdown content into structured parts for rendering.
 * Handles Code Blocks, Mermaid Diagrams, and Custom Artifact Tags.
 */
export const parseMarkdownContent = (content: string): ContentPart[] => {
    // 1. Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);
    
    return parts.flatMap((part): ContentPart[] => {
        // Handle Code Blocks
        if (part.startsWith('```') && part.endsWith('```')) {
            const firstLine = part.split('\n')[0];
            const language = firstLine.replace(/^```/, '').trim();
            const code = part.slice(firstLine.length, -3).trim();
            
            if (language === 'mermaid') {
                return [{ type: 'mermaid', content: code }];
            }
            return [{ type: 'code', language, content: code }];
        }

        // Handle custom artifact tags inside text blocks
        // <FIGURE ID="..." /> or <GENERATE_IMAGE PROMPT="..." />
        const artifactParts = part.split(/(<(?:FIGURE|GENERATE_IMAGE)\s+[^>]+>)/g).filter(Boolean);

        return artifactParts.map((subPart): ContentPart => {
            // Match FIGURE tag
            const figMatch = subPart.match(/<FIGURE\s+ID="([^"]+)"\s+DESC="([^"]*)"\s*\/>/);
            if (figMatch) {
                return { 
                    type: 'artifact_tag', 
                    id: figMatch[1], 
                    description: figMatch[2] 
                };
            }

            // Match GENERATE_IMAGE tag
            const genMatch = subPart.match(/<GENERATE_IMAGE\s+(?:ID="([^"]+)"\s+)?PROMPT="([^"]+)"/);
            if (genMatch) {
                return { 
                    type: 'artifact_tag', 
                    id: genMatch[1], 
                    prompt: genMatch[2] 
                };
            }

            // Normal text
            return { type: 'text', content: subPart };
        });
    });
};
