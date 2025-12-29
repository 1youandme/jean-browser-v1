import React from 'react';

export default function JeanHomepage() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold tracking-wide">Jean Browser</h1>
        <div className="mt-8 border border-gray-300 bg-white">
          <div className="px-4 py-3 border-b border-gray-300 text-sm font-semibold">What Jean Is</div>
          <div className="px-4 py-4 text-sm text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>A governance-first desktop browser shell</li>
              <li>Deny-by-default controls and local-first operation</li>
              <li>Institutional interface with formal boundaries</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 border border-gray-300 bg-white">
          <div className="px-4 py-3 border-b border-gray-300 text-sm font-semibold">What Jean Is Not</div>
          <div className="px-4 py-4 text-sm text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>Not autonomous and not self-executing</li>
              <li>Not surveillance and not data monetization</li>
              <li>Not experimental in production contexts</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 border border-gray-300 bg-white">
          <div className="px-4 py-3 border-b border-gray-300 text-sm font-semibold">Governance Principles</div>
          <div className="px-4 py-4 text-sm text-gray-800">
            <ul className="list-disc pl-5 space-y-2">
              <li>Explicit consent and visible refusals</li>
              <li>Local-only defaults; no background networking</li>
              <li>Auditability and regulator-grade clarity</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <button className="h-10 px-5 bg-gray-50 border border-gray-300 text-sm" aria-disabled="true" disabled>
            Download (disabled)
          </button>
          <button className="h-10 px-5 bg-gray-50 border border-gray-300 text-sm" aria-disabled="true" disabled>
            Transparency / Audit (disabled)
          </button>
        </div>
        <div className="mt-6 text-xs text-gray-600">
          Formal notice: This interface is provided as a governance-first artifact. Use is subject to applicable law and institutional policy.
        </div>
      </div>
    </div>
  );
}
