import React, { useState } from 'react';
import { SimulationBanner } from '../components/developer/SimulationBanner';

type RequestStatus = 'received' | 'in_review' | 'completed' | 'archived';

export const ClientServices: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [serviceType, setServiceType] = useState('consultation');
    const [description, setDescription] = useState('');
    const [requests, setRequests] = useState<Array<{ id: string; name: string; email: string; type: string; description: string; status: RequestStatus }>>([]);

    const submitProposal = () => {
        if (!name || !email || !description) return;
        const id = Math.random().toString(36).slice(2);
        setRequests(prev => [...prev, { id, name, email, type: serviceType, description, status: 'received' }]);
        setName(''); setEmail(''); setDescription('');
    };

    const updateStatus = (id: string, status: RequestStatus) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono text-sm">
            <SimulationBanner />
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <h1 className="text-xl uppercase tracking-widest text-gray-400">Client Services</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Service Request Form</h2>
                        <div className="space-y-3">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full bg-gray-900 border border-gray-800 p-2 rounded" />
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-900 border border-gray-800 p-2 rounded" />
                            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-gray-900 border border-gray-800 p-2 rounded">
                                <option value="consultation">Consultation</option>
                                <option value="integration">Integration</option>
                                <option value="support">Support</option>
                            </select>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full bg-gray-900 border border-gray-800 p-2 rounded h-24" />
                            <button onClick={submitProposal} className="w-full py-2 bg-yellow-900/20 text-yellow-400 border border-yellow-500/50 rounded">
                                Submit Proposal
                            </button>
                            <div className="text-[10px] text-gray-500 text-center">Proposals only. No backend authority.</div>
                        </div>
                    </div>

                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Status Tracking (Manual)</h2>
                        {requests.length === 0 ? (
                            <div className="text-gray-600 italic">No requests yet.</div>
                        ) : (
                            <ul className="space-y-2">
                                {requests.map(r => (
                                    <li key={r.id} className="border-b border-gray-800 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-200">{r.name} — {r.type}</span>
                                            <span className="text-yellow-400">{r.status}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-400">{r.email}</div>
                                        <div className="text-[11px] text-gray-500">{r.description}</div>
                                        <div className="mt-2">
                                            <select value={r.status} onChange={e => updateStatus(r.id, e.target.value as RequestStatus)} className="bg-gray-900 border border-gray-800 p-1 rounded text-xs">
                                                <option value="received">received</option>
                                                <option value="in_review">in_review</option>
                                                <option value="completed">completed</option>
                                                <option value="archived">archived</option>
                                            </select>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="text-center text-[11px] text-gray-500">
                    Display-only and simulation mode. No payments, no legal execution.
                </div>
            </div>
        </div>
    );
};
