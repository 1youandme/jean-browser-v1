import React from 'react';
import { GovernanceBanner } from '@/components/governance/GovernanceBanner';

export default function DeveloperMode() {
  const netEnabled = Boolean((window as any).__JEAN_NETWORK_ENABLED__);
  const governanceState = 'REVIEW_PENDING';
  const governanceReason = 'Public Review • Non-Production • Deny-by-Default';

  const allowed = [
    { key: 'Read-only code inspection', detail: 'View code and structures without mutation' },
    { key: 'Governance explanations', detail: 'Explain states, constraints, and decisions' },
    { key: 'Task planning (no execution)', detail: 'Draft plans; store locally only if explicitly allowed' }
  ];

  const denied = [
    { key: 'File writes', detail: 'No filesystem modifications' },
    { key: 'Network calls', detail: 'No fetch/WebSocket/EventSource/beacon' },
    { key: 'Execution without approval', detail: 'No OS actions or kernel execution' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="w-full">
        <GovernanceBanner state={governanceState as any} reason={governanceReason} />
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold tracking-wide">Developer Mode</h1>
          <div className="text-xs px-2 py-1 rounded border"
               style={{ borderColor: netEnabled ? '#22c55e' : '#ef4444', color: netEnabled ? '#22c55e' : '#ef4444', background: 'rgba(0,0,0,0.05)' }}>
            📡 Network: {netEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="border border-gray-300 bg-white rounded">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold">John Capability Matrix</div>
            <div className="p-4">
              <div className="text-xs uppercase text-gray-500 mb-2">Allowed</div>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {allowed.map(item => (
                  <li key={item.key}>
                    <span className="font-medium">{item.key}</span>
                    <span className="text-gray-600"> — {item.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs uppercase text-gray-500 mt-4 mb-2">Denied</div>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                {denied.map(item => (
                  <li key={item.key}>
                    <span className="font-medium">{item.key}</span>
                    <span className="text-gray-600"> — {item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="border border-gray-300 bg-white rounded">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold">Developer Page</div>
            <div className="p-4 text-sm">
              <ul className="list-disc pl-5 space-y-2">
                <li>Read-only inspector for code and configuration</li>
                <li>Visible governance state and reason at all times</li>
                <li>Planning workspace for tasks without execution hooks</li>
                <li>No file writes, no network, no auto-actions</li>
              </ul>
              <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 inline-block">
                Review Only • Non-Production
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
