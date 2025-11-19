
import React from 'react';
import { AGENTS, TEAM_COLORS } from '../constants';
import { Agent, Team } from '../types';
import AgentCard from './AgentCard';
import { useAgis } from '../hooks/useAgis';
import { useLanguage } from '../contexts/LanguageContext';

const AgentGrid: React.FC = () => {
    const { selectedAgents, messages, thinkingAgents, artifacts, setExpandedAgentId, handleOpenPreview } = useAgis();
    const { t } = useLanguage();

    const specialistAgents = AGENTS.slice(2);
    const isInitialState = selectedAgents.size === 0;

    const specialistAgentsByTeam = specialistAgents.reduce((acc, agent) => {
        const team = agent.team;
        if (!acc[team]) {
            acc[team] = [];
        }
        acc[team].push(agent);
        return acc;
    }, {} as Record<Team, Agent[]>);

    const teamOrder = [
        Team.STRATEGY_PLANNING,
        Team.INSIGHT_CULTURE,
        Team.PRODUCT_DESIGN,
        Team.ADVANCED_DEV,
        Team.OPS_INFRA,
        Team.SECURITY_GOV,
        Team.GROWTH_MARKETING,
        Team.SALES,
        Team.RELATIONS_ASSETS,
        Team.FINANCE_SCM,
        Team.HR_ADMIN,
    ];

    const allSelectedSpecialists = teamOrder.flatMap(teamName =>
        (specialistAgentsByTeam[teamName] || []).filter(agent => selectedAgents.has(agent.id))
    );

    return (
        <div className="min-h-0 overflow-y-auto p-4 pb-40 -m-2 sm:-m-4 custom-scrollbar">
            {isInitialState ? (
                <div className="space-y-4">
                    {teamOrder.map(teamName => (
                        <div key={teamName}>
                            <h3 className={`text-sm font-bold p-2 rounded-t-lg ${TEAM_COLORS[teamName].bg} ${TEAM_COLORS[teamName].text} border-b-2 ${TEAM_COLORS[teamName].border}`}>
                                {t.teams[teamName] || teamName}
                            </h3>
                            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-2 rounded-b-lg ${TEAM_COLORS[teamName].bg}`}>
                                {(specialistAgentsByTeam[teamName] || []).map(agent => (
                                    <AgentCard
                                        key={agent.id}
                                        agent={agent}
                                        isCompact={true}
                                        messages={messages[agent.id] || []}
                                        isThinking={thinkingAgents.has(agent.id)}
                                        artifacts={artifacts}
                                        onExpand={() => setExpandedAgentId(agent.id)}
                                        onPreview={handleOpenPreview}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allSelectedSpecialists.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            isCompact={false}
                            messages={messages[agent.id] || []}
                            isThinking={thinkingAgents.has(agent.id)}
                            artifacts={artifacts}
                            onExpand={() => setExpandedAgentId(agent.id)}
                            onPreview={handleOpenPreview}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgentGrid;
