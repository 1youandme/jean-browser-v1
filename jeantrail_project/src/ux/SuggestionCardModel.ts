import { StoreItem, SuggestionContext } from '../store/StoreTypes';
import { EthicalSuggestionPolicy } from '../store/EthicalSuggestionPolicy';

export interface SuggestionCardAction {
  type: string;
  payload?: Record<string, any>;
}

export interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  reason: string;
  transparencyNote: string;
  disableHint: string;
  optional: true;
  dismissible: true;
  blocking: false;
  actions: SuggestionCardAction[];
}

export function isCardAllowed(item: StoreItem, context: SuggestionContext): boolean {
  return EthicalSuggestionPolicy.shouldSuggest(item, context);
}

export function buildSuggestionCard(item: StoreItem, context: SuggestionContext, matchReason: string): SuggestionCard | null {
  if (!isCardAllowed(item, context)) return null;
  const meta = EthicalSuggestionPolicy.createTransparencyMetadata(item, matchReason);
  return {
    id: item.id,
    title: item.name,
    description: item.description,
    reason: matchReason,
    transparencyNote: meta.transparencyNote,
    disableHint: meta.disableHint,
    optional: true,
    dismissible: true,
    blocking: false,
    actions: [{ type: 'view_item', payload: { productId: item.id } }]
  };
}

export function dismissCard(cardId: string, context: SuggestionContext): SuggestionContext {
  const set = new Set(context.recentDismissals);
  set.add(cardId);
  return { ...context, recentDismissals: Array.from(set) };
}

export function recordCardImpression(context: SuggestionContext): SuggestionContext {
  return { ...context, sessionSuggestionCount: context.sessionSuggestionCount + 1 };
}

