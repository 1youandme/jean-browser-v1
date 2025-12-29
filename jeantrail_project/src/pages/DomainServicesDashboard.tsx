import React, { useState } from 'react';
import { SimulationBanner } from '../components/developer/SimulationBanner';

export const DomainServicesDashboard: React.FC = () => {
    const ownedDomains = ['jeantrail.com', 'jeantrail.local', 'jeantrail.dev'];
    const domainsForSale = [
        { domain: 'jeantrail.app', price: '$1,200', status: 'display-only' },
        { domain: 'jeantrail.ai', price: '$2,800', status: 'display-only' },
        { domain: 'jeantrail.store', price: '$900', status: 'display-only' }
    ];
    const [interestRequests] = useState([
        { domain: 'jeantrail.app', contact: 'alice@example.com', message: 'Interested in app domain', status: 'received' },
        { domain: 'jeantrail.ai', contact: 'bob@example.com', message: 'AI brand match', status: 'pending' }
    ]);

    return (
        <div className="min-h-screen bg-black text-gray-300 font-mono text-sm">
            <SimulationBanner />
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                <h1 className="text-xl uppercase tracking-widest text-gray-400">Domain Services</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Owned Domains</h2>
                        <ul className="space-y-2">
                            {ownedDomains.map(d => (
                                <li key={d} className="flex justify-between border-b border-gray-800 pb-2">
                                    <span className="text-gray-200">{d}</span>
                                    <span className="text-gray-500">owned</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Domains for Sale</h2>
                        <ul className="space-y-2">
                            {domainsForSale.map(item => (
                                <li key={item.domain} className="border-b border-gray-800 pb-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-200">{item.domain}</span>
                                        <span className="text-green-400">{item.price}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500">status: {item.status}</div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border border-gray-800 rounded p-4">
                        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Interest Requests</h2>
                        <ul className="space-y-2">
                            {interestRequests.map((req, i) => (
                                <li key={i} className="border-b border-gray-800 pb-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-200">{req.domain}</span>
                                        <span className="text-yellow-400">{req.status}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400">{req.contact}</div>
                                    <div className="text-[11px] text-gray-500">{req.message}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-center text-[11px] text-gray-500">
                    Display-only. Proposals only. No payments and no authority.
                </div>
            </div>
        </div>
    );
};
