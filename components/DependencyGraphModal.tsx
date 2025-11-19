
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GraphEvent, Agent } from '../types';
import { AGENTS, TEAM_COLORS, AGENT_COLORS } from '../constants';

// Declare Mermaid global
declare const mermaid: any;

interface DependencyGraphModalProps {
  events: GraphEvent[];
  selectedAgents: Set<string>;
  onClose: () => void;
  onAgentClick: (agentId: string) => void;
}

const DependencyGraphModal: React.FC<DependencyGraphModalProps> = ({ events, selectedAgents, onClose, onAgentClick }) => {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Helper to get agent details
  const getAgent = (aliasOrId: string): Agent | undefined => {
      // First try alias
      let agent = AGENTS.find(a => a.alias === aliasOrId);
      // Then try id
      if (!agent) agent = AGENTS.find(a => a.id === aliasOrId);
      return agent;
  };
  
  // Helper to get translated name safely
  const getAgentName = (agent: Agent) => {
      const transAgent = t.agents[agent.id];
      return transAgent ? transAgent.name : agent.name;
  };

  useEffect(() => {
    const renderGraph = async () => {
        try {
            if (typeof mermaid === 'undefined') {
                setError(t.errors.mermaidLib);
                return;
            }

            // Build Mermaid Definition
            let def = `graph TD\n`;

            // 1. Define Styles
            // Leadership
            def += `classDef leadership fill:#334155,stroke:#94a3b8,color:#fff,stroke-width:2px;\n`;
            
            // Teams
            const addedStyles = new Set<string>();
            AGENTS.forEach(agent => {
                if (agent.team && !addedStyles.has(agent.team)) {
                    const colors = TEAM_COLORS[agent.team];
                    
                    // Simple mapping for reliability
                    let fill = '#1e293b'; // Default dark
                    let stroke = '#64748b';
                    
                    if (agent.team.includes("戦略")) { fill = '#450a0a'; stroke = '#ef4444'; }
                    else if (agent.team.includes("インサイト")) { fill = '#431407'; stroke = '#f97316'; }
                    else if (agent.team.includes("デザイン")) { fill = '#451a03'; stroke = '#f59e0b'; }
                    else if (agent.team.includes("開発")) { fill = '#422006'; stroke = '#eab308'; }
                    else if (agent.team.includes("運用")) { fill = '#1a2e05'; stroke = '#84cc16'; }
                    
                    // Apply style
                    // We use a sanitized team name as class name
                    const className = `team_${agent.team.replace(/[^a-zA-Z0-9]/g, '')}`;
                    if(!addedStyles.has(className)){
                        def += `classDef ${className} fill:${fill},stroke:${stroke},color:#e2e8f0;\n`;
                        addedStyles.add(className);
                        addedStyles.add(agent.team); // Track raw team name to avoid re-adding
                    }
                }
            });

            // 2. Define Nodes
            const activeNodes = new Set<string>();
            
            // Always include President & Orchestrator
            const president = getAgent('president')!;
            const orchestrator = getAgent('orchestrator')!;
            
            def += `${president.alias}["${getAgentName(president)}"]:::leadership\n`;
            def += `${orchestrator.alias}["${getAgentName(orchestrator)}"]:::leadership\n`;
            
            activeNodes.add(president.alias);
            activeNodes.add(orchestrator.alias);

            // Process Events to find active agents and edges
            const edges: string[] = [];
            
            // Initial Edge
            edges.push(`${president.alias} --> ${orchestrator.alias}`);

            events.forEach((e, index) => {
                const fromAgent = getAgent(e.from);
                const toAgent = getAgent(e.to);

                if (fromAgent && toAgent) {
                    // Add nodes if not present
                    if (!activeNodes.has(fromAgent.alias)) {
                        const className = fromAgent.id === 'orchestrator' || fromAgent.id === 'president' 
                            ? 'leadership' 
                            : `team_${fromAgent.team.replace(/[^a-zA-Z0-9]/g, '')}`;
                        def += `${fromAgent.alias}["${getAgentName(fromAgent)}"]:::${className}\n`;
                        activeNodes.add(fromAgent.alias);
                    }
                    if (!activeNodes.has(toAgent.alias)) {
                         const className = toAgent.id === 'orchestrator' || toAgent.id === 'president' 
                            ? 'leadership' 
                             : `team_${toAgent.team.replace(/[^a-zA-Z0-9]/g, '')}`;
                        def += `${toAgent.alias}["${getAgentName(toAgent)}"]:::${className}\n`;
                        activeNodes.add(toAgent.alias);
                    }

                    // Add edge
                    // Sequential index for thought chain visualization
                    const seq = index + 1;
                    let arrow = '-->'; // Default Invoke
                    let label = '';
                    
                    if (e.type === 'consult') {
                        arrow = '-.->';
                        label = `|${seq}. Consult|`;
                    } else if (e.type === 'review') {
                        arrow = '==>';
                        label = `|${seq}. Review|`;
                    } else if (e.type === 'invoke') {
                        label = `|${seq}. Invoke|`;
                    } else if (e.type === 'report') {
                        arrow = '-->';
                        label = `|Report|`;
                    }
                    
                    // Simplified graph: remove label number if too cluttered, but user asked for "Thought Chain"
                    edges.push(`${fromAgent.alias} ${arrow} ${label} ${toAgent.alias}`);
                }
            });

            // Append Edges
            def += edges.join('\n');

            // Render
            const id = `mermaid-graph-${Date.now()}`;
            const { svg } = await mermaid.render(id, def);
            setSvg(svg);
            setError(null);

        } catch (err: any) {
            console.error("Mermaid render error:", err);
            setError(t.errors.mermaidRender + err.message);
        }
    };

    renderGraph();
  }, [events, t, language]); // Re-render when events change

  // Handle clicks on the SVG
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
       const target = e.target as HTMLElement;
       // Traverse up to find a node
       let current = target;
       while (current && current !== containerRef.current) {
           if (current.classList.contains('node')) {
               // Simplest: Logic to map Node ID back to Agent
               // The ID in DOM usually contains the alias we defined in graph definition e.g. "flowchart-A1-..."
               const domId = current.id;
               const matchedAgent = AGENTS.find(a => domId.includes(`-${a.alias}-`));
               if (matchedAgent) {
                   onAgentClick(matchedAgent.id);
                   onClose();
               }
               break;
           }
           current = current.parentElement as HTMLElement;
       }
    };
    
    const container = containerRef.current;
    if (container) {
        container.addEventListener('click', handleClick);
    }
    return () => {
        if (container) container.removeEventListener('click', handleClick);
    };
  }, [svg, onAgentClick, onClose]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 glass-effect animate-fade-in">
      <div className="bg-gray-900/95 border border-cyan-500 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col relative shadow-2xl shadow-cyan-900/50">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 rounded-t-lg">
           <div>
               <h2 className="text-xl font-bold text-cyan-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                {t.modal.graphTitle}
               </h2>
               <p className="text-xs text-gray-400 mt-1">{t.modal.graphDesc}</p>
           </div>
           <div className="flex items-center gap-3">
               <div className="flex gap-1 bg-gray-800 rounded p-1">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-300" title="Zoom Out">-</button>
                   <span className="text-xs text-gray-400 px-2 py-1 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-gray-700 rounded text-gray-300" title="Zoom In">+</button>
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
               </button>
           </div>
        </div>

        {/* Graph Container */}
        <div className="flex-grow overflow-auto bg-[#0f172a] relative flex items-center justify-center p-10 cursor-move">
            {error ? (
                <div className="text-red-400 p-4 border border-red-900 bg-red-900/20 rounded">
                    {error}
                </div>
            ) : (
                <div 
                    ref={containerRef}
                    style={{ 
                        transform: `scale(${zoom})`, 
                        transformOrigin: 'center center', 
                        transition: 'transform 0.2s',
                        width: '100%', 
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                    dangerouslySetInnerHTML={{ __html: svg }} 
                    className="mermaid-container"
                />
            )}
        </div>
        
        <style>{`
          .mermaid-container svg {
            max-width: none !important;
            width: 100% !important;
            height: auto !important;
            min-height: 400px;
          }
        `}</style>

        {/* Legend */}
        <div className="p-3 bg-gray-900 border-t border-gray-800 text-[10px] text-gray-500 flex justify-center gap-4">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#334155] border border-[#94a3b8] block"></span> Leadership</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#450a0a] border border-[#ef4444] block"></span> Strategy</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-[#431407] border border-[#f97316] block"></span> Insight</div>
            <div className="flex items-center gap-1"><span className="w-10 h-0.5 bg-[#64748b] block relative"><span className="absolute -top-1.5 right-0 text-gray-500">▶</span></span> Invoke</div>
            <div className="flex items-center gap-1"><span className="w-10 h-0.5 border-t border-dashed border-[#64748b] block relative"><span className="absolute -top-1.5 right-0 text-gray-500">▶</span></span> Consult</div>
        </div>

      </div>
    </div>
  );
};

export default DependencyGraphModal;
