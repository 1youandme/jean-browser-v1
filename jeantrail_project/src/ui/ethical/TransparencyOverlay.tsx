import React from 'react';
import { TransparencyOverlay as ModelOverlay, TransparencyDatum } from '../../ux/TransparencyOverlay';

export interface TransparencyOverlayProps {
  overlay: ModelOverlay;
  onClose?: () => void;
  globalRuleText?: string;
}

function DatumRow({ d }: { d: TransparencyDatum }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600">{d.label}</span>
      <span className="text-gray-800">{Array.isArray(d.value) ? d.value.join(', ') : String(d.value ?? '')}</span>
    </div>
  );
}

export function TransparencyOverlay({ overlay, onClose, globalRuleText }: TransparencyOverlayProps) {
  const rule = globalRuleText || 'Silence is preferred over persuasion.';
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4 space-y-3">
        <div className="text-[11px] text-gray-500">{rule}</div>
        <div className="text-sm font-semibold">Transparency</div>
        <div className="text-xs">{overlay.why}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded p-2">
            <div className="text-xs font-medium">Data used</div>
            <div className="mt-1 space-y-1">
              {overlay.usedData.map(d => <DatumRow key={`u-${d.key}`} d={d} />)}
            </div>
          </div>
          <div className="border rounded p-2">
            <div className="text-xs font-medium">Data not used</div>
            <div className="mt-1 space-y-1">
              {overlay.notUsedData.map(d => <DatumRow key={`n-${d.key}`} d={d} />)}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-gray-500">{overlay.disableHint}</div>
        <div className="flex justify-end">
          <button type="button" className="text-xs px-2 py-1 border rounded" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransparencyOverlay;
