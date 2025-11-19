
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { fixMermaidCode } from '../services/geminiService';

// Declare Mermaid global
declare const mermaid: any;

interface MermaidBlockProps {
  code: string;
  className?: string;
  onClick?: () => void;
}

const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className = "", onClick }) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    // New state for retry logic
    const [currentCode, setCurrentCode] = useState(code);
    const [attempt, setAttempt] = useState(0);
    const [isFixing, setIsFixing] = useState(false);
    
    const containerRef = useRef<HTMLDivElement>(null);
    // Stable ID for mermaid rendering
    const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;
    const { t } = useLanguage();

    // Reset when prop changes (e.g. new streaming chunk arrives, or totally new block)
    useEffect(() => {
        setCurrentCode(code);
        setAttempt(0);
        setError(null);
        setIsFixing(false);
    }, [code]);

    useEffect(() => {
        let isMounted = true;

        const renderChart = async () => {
            if (!currentCode) return;

            try {
                if (typeof mermaid !== 'undefined') {
                    // Clean up code (remove markdown wrapper if present)
                    const cleanCode = currentCode.replace(/^```mermaid\n?/, '').replace(/```$/, '').trim();
                    
                    // Need to ensure element exists before rendering
                    if(containerRef.current) {
                         // Reset for re-render
                         containerRef.current.innerHTML = ''; 
                         const { svg } = await mermaid.render(id, cleanCode);
                         if(isMounted) {
                             setSvg(svg);
                             setError(null);
                             setIsFixing(false); // Success
                         }
                    }
                } else {
                    if(isMounted) setError(t.errors.mermaidLib);
                }
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                
                if (isMounted) {
                    // Auto-repair logic: Try once
                    if (attempt < 1) {
                        setIsFixing(true);
                        
                        try {
                             const errorMessage = err.message || "Unknown Syntax Error";
                             console.log("Attempting to fix mermaid code...");
                             const fixedCode = await fixMermaidCode(currentCode, errorMessage);
                             
                             if (fixedCode && isMounted) {
                                 console.log("Fixed code received. Retrying render...");
                                 setAttempt(prev => prev + 1);
                                 setCurrentCode(fixedCode);
                                 // The effect will re-run because currentCode changed
                                 return;
                             }
                        } catch (fixErr) {
                             console.error("Auto-fix failed", fixErr);
                        }
                        
                        // If fix failed or returned null
                        if(isMounted) {
                            setIsFixing(false);
                            setError(t.errors.mermaidRender + err.message);
                        }
                    } else {
                        // Already tried fixing, or attempt limit reached
                        setIsFixing(false);
                        setError(t.errors.mermaidRender + err.message);
                    }
                }
            }
        };

        // Simple debounce/delay to ensure DOM readiness
        const timer = setTimeout(renderChart, 100);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [currentCode, id, t, attempt]);

    if (error) return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-2 text-xs rounded my-2">
            <p className="font-bold">Mermaid Error:</p>
            <p>{error}</p>
            <pre className="mt-1 opacity-50 text-[10px] overflow-x-auto">{currentCode}</pre>
        </div>
    );
    
    if (isFixing) return (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-3 text-xs rounded my-2 flex items-center animate-pulse">
            <svg className="animate-spin h-4 w-4 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Detecting syntax error... Attempting to repair diagram automatically.</span>
        </div>
    );
    
    // Render SVG
    return (
        <div 
            ref={containerRef} 
            onClick={onClick}
            className={`my-4 bg-gray-800/50 p-4 rounded-lg overflow-x-auto flex justify-center border border-gray-700 ${className}`} 
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};

export default MermaidBlock;
