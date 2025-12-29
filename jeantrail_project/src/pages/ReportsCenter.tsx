import React from 'react';
import { SimulationBanner } from '../components/developer/SimulationBanner';

export const ReportsCenter: React.FC = () => {
    const runtimeActivity = [
        { time: '09:00', event: 'Presence: observing' },
        { time: '09:05', event: 'Policy: frozen' },
        { time: '09:12', event: 'Decision route: UI_EXPLANATION' }
    ];
    const agentProposals = [
        { agentId: 'agent.dev', proposal: 'Add code analysis view', status: 'pending' },
        { agentId: 'agent.ops', proposal: 'Enable log export', status: 'rejected' }
    ];
    const policyDecisions = [
        { time: '09:02', decision: 'Blocked category: pornography' },
        { time: '09:10', decision: 'Allowed: contextual explanation' }
    ];

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono text-sm">
            <SimulationBanner />
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <h1 className="text-xl uppercase tracking-widest text-gray-400">Reports Center</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Runtime Activity</h2>
                        <ul className="space-y-2">
                            {runtimeActivity.map((r, i) => (
                                <li key={i} className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-500">{r.time}</span>
                                    <span className="text-gray-200">{r.event}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Agent Proposals</h2>
                        <ul className="space-y-2">
                            {agentProposals.map((p, i) => (
                                <li key={i} className="border-b border-gray-800 pb-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-200">{p.agentId}</span>
                                        <span className="text-yellow-400">{p.status}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-500">{p.proposal}</div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Policy Decisions Log</h2>
                        <ul className="space-y-2">
                            {policyDecisions.map((d, i) => (
                                <li key={i} className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-500">{d.time}</span>
                                    <span className="text-gray-200">{d.decision}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-center text-[11px] text-gray-500">
                    Read-only. No backend authority. All entries are simulated.
                </div>
            </div>
        </div>
    );
};
