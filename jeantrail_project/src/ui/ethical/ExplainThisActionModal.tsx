import React from 'react';
import { ExplainResolution } from '../../ux/ExplainActionResolver';

export interface ExplainThisActionModalProps {
  resolution: ExplainResolution;
  onClose?: () => void;
  globalRuleText?: string;
}

export function ExplainThisActionModal({ resolution, onClose, globalRuleText }: ExplainThisActionModalProps) {
  const rule = globalRuleText || 'Silence is preferred over persuasion.';
  const a = resolution.action;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-xl p-4 space-y-3">
        <div className="text-[11px] text-gray-500">{rule}</div>
        <div className="text-sm font-semibold">Explain This Action</div>
        <div className="text-xs text-gray-700">Action: {String(a.action)} on {a.target}</div>
        <div className="text-xs text-gray-600">When: {a.timestamp}</div>
        <div className="text-xs">{resolution.explanation}</div>
        {resolution.decision && (
          <div className="border rounded p-2">
            <div className="text-xs font-medium">Related Decision</div>
            <div className="text-[11px] text-gray-600">Intent: {resolution.decision.intent}</div>
            <div className="text-[11px] text-gray-600">Outcome: {resolution.decision.outcome}</div>
            <div className="text-[11px] text-gray-600">Confidence: {resolution.decision.confidence}</div>
          </div>
        )}
        <div className="flex justify-end">
          <button type="button" className="text-xs px-2 py-1 border rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExplainThisActionModal;
