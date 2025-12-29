import React from 'react';
import { SuggestionCard as ModelCard } from '../../ux/SuggestionCardModel';

export interface SuggestionCardProps {
  card: ModelCard;
  onDismiss?: (cardId: string) => void;
  onNavigate?: (actionType: string, payload?: Record<string, any>) => void;
  globalRuleText?: string;
}

export function SuggestionCard({ card, onDismiss, onNavigate, globalRuleText }: SuggestionCardProps) {
  const rule = globalRuleText || 'Silence is preferred over persuasion.';
  return (
    <div className="border rounded p-3 space-y-2">
      <div className="text-[11px] text-gray-500">{rule}</div>
      <div className="text-sm font-semibold">{card.title}</div>
      <div className="text-xs text-gray-700">{card.description}</div>
      <div className="text-xs"><span className="font-medium">Why:</span> {card.reason}</div>
      <div className="text-xs text-gray-600">{card.transparencyNote}</div>
      <div className="text-[11px] text-gray-500">{card.disableHint}</div>
      <div className="flex items-center gap-2 mt-2">
        {card.actions.map((a, idx) => (
          <button
            key={`${card.id}-act-${idx}`}
            type="button"
            className="text-xs px-2 py-1 border rounded"
            onClick={() => onNavigate?.(a.type, a.payload)}
          >
            View
          </button>
        ))}
        {card.dismissible && (
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded text-red-600"
            onClick={() => onDismiss?.(card.id)}
            title="Permanently dismiss this suggestion"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export default SuggestionCard;
