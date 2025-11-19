
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
    const containerRef = useRef<HTMLDivElement>(null);
    // Stable ID for mermaid rendering
    const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;
    const { t } = useLanguage();

    useEffect(() => {
        const renderChart = async () => {
            try {
                if (typeof mermaid !== 'undefined') {
                    // Clean up code (remove markdown wrapper if present)
                    const cleanCode = code.replace(/^```mermaid\n?/, '').replace(/```$/, '').trim();
                    // Need to ensure element exists before rendering
                    if(containerRef.current) {
                         // Reset for re-render
                         containerRef.current.innerHTML = ''; 
                         const { svg } = await mermaid.render(id, cleanCode);
                         setSvg(svg);
                         setError(null);
                    }
                } else {
                    setError(t.errors.mermaidLib);
                }
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                setError(t.errors.mermaidRender + err.message);
            }
        };
        // Simple debounce/delay to ensure DOM readiness
        const timer = setTimeout(renderChart, 100);
        return () => clearTimeout(timer);
    }, [code, id, t]);

    if (error) return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-2 text-xs rounded my-2">
            <p className="font-bold">Mermaid Error:</p>
            <p>{error}</p>
            <pre className="mt-1 opacity-50 text-[10px] overflow-x-auto">{code}</pre>
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
