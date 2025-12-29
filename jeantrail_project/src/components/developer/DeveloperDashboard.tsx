import React, { useState, useEffect } from 'react';
import { FreezeBanner } from './FreezeBanner';
import { JeanPresenceState } from '../../jean-runtime/state/JeanPresenceStateMachine';

import { AgentSpec } from '../../jean-runtime/core/AgentSpec';
import { PluginContract } from '../../jean-runtime/core/PluginContract';

export const DeveloperDashboard: React.FC = () => {
    // 1. Runtime Status (Simulated Read-Only)
    const [presenceState, setPresenceState] = useState<JeanPresenceState>(JeanPresenceState.IDLE);
    const [policyStatus] = useState<'ACTIVE' | 'FROZEN'>('FROZEN');

    // 2. Logs & Timeline (Local State)
    const [logs] = useState<string[]>([
        "[System] Developer Control Layer Initialized",
        "[Governance] DECISION_FREEZE_BETA.md Loaded",
        "[Runtime] Presence State Machine: IDLE"
    ]);

    // 3. Agent Registry (Read-Only)
    const [agents] = useState<AgentSpec[]>([]); // Empty by default

    // 4. Plugin Registry (Read-Only)
    const [plugins] = useState<PluginContract[]>([]); // Empty by default

    // Listen for Presence Changes (Read-Only)
    useEffect(() => {
        const handlePresenceChange = (event: CustomEvent) => {
            if (event.detail && event.detail.state) {
                setPresenceState(event.detail.state);
            }
        };
        window.addEventListener('jean-presence-change' as any, handlePresenceChange as any);
        return () => window.removeEventListener('jean-presence-change' as any, handlePresenceChange as any);
    }, []);

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono text-sm flex flex-col">
            <FreezeBanner />
            
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Panel 1: Runtime Status */}
                <div className="border border-gray-800 rounded p-4">
                    <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Runtime Status</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Presence State:</span>
                            <span className={`font-bold ${
                                presenceState === JeanPresenceState.IDLE ? 'text-blue-400' : 
                                presenceState === JeanPresenceState.OBSERVING ? 'text-yellow-400' : 'text-green-400'
                            }`}>{presenceState}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Policy Status:</span>
                            <span className="text-red-400">{policyStatus}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Governance:</span>
                            <span className="text-gray-500">STRICT</span>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Agent Registry */}
                <div className="border border-gray-800 rounded p-4 opacity-75">
                     <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Agent Registry (Phase B)</h2>
                     {agents.length === 0 ? (
                         <div className="text-center py-8 text-gray-600 italic">
                             No Agents Registered.
                             <br/><span className="text-xs not-italic">Spawning Disabled by Freeze.</span>
                         </div>
                     ) : (
                         <ul>{/* Map agents here */}</ul>
                     )}
                </div>

                 {/* Panel 3: Plugin System */}
                <div className="border border-gray-800 rounded p-4 opacity-75">
                     <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Plugin System (Phase C)</h2>
                     {plugins.length === 0 ? (
                         <div className="text-center py-8 text-gray-600 italic">
                             No Plugins Loaded.
                             <br/><span className="text-xs not-italic">Network/FS Disabled.</span>
                         </div>
                     ) : (
                         <ul>{/* Map plugins here */}</ul>
                     )}
                </div>

                {/* Panel 4: Logs & Timeline */}
                <div className="border border-gray-800 rounded p-4 col-span-1 md:col-span-2 lg:col-span-3">
                    <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Execution Log</h2>
                    <div className="bg-gray-900/50 p-2 rounded h-32 overflow-y-auto font-mono text-xs">
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-gray-800/50 last:border-0 py-1">
                                <span className="text-gray-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Panel 5: Kill Switch (Documentation Only) */}
                <div className="border border-red-900/30 rounded p-4 col-span-1">
                     <h2 className="text-xs uppercase tracking-widest text-red-700 mb-4 border-b border-red-900/30 pb-2">Emergency Controls</h2>
                     <button disabled className="w-full py-2 bg-red-900/20 text-red-800 border border-red-900/50 rounded cursor-not-allowed opacity-50">
                         GLOBAL KILL SWITCH (DISABLED)
                     </button>
                     <p className="text-[10px] text-gray-600 mt-2 text-center">
                         Hard reset functionality documented in SAFETY_POLICY.md. 
                         Currently disabled for Beta stability.
                     </p>
                </div>

            </div>
        </div>
    );
};
