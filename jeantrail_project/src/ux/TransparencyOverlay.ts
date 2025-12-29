import { StoreItem, SuggestionContext } from '../store/StoreTypes';
import { EthicalSuggestionPolicy } from '../store/EthicalSuggestionPolicy';

export interface TransparencyOverlay {
  id: string;
  why: string;
  usedData: TransparencyDatum[];
  notUsedData: TransparencyDatum[];
  disableHint: string;
}

export interface TransparencyDatum {
  key: string;
  label: string;
  source: 'intent' | 'policy' | 'session' | 'product' | 'system';
  value?: string | number | boolean | string[];
}

export function buildTransparencyOverlayForSuggestion(
  item: StoreItem,
  context: SuggestionContext,
  matchReason: string
): TransparencyOverlay | null {
  if (!EthicalSuggestionPolicy.shouldSuggest(item, context)) {
    return null;
  }
  const meta = EthicalSuggestionPolicy.createTransparencyMetadata(item, matchReason);
  const usedData: TransparencyDatum[] = [
    { key: 'intent_match', label: 'Intent Match', source: 'intent', value: matchReason },
    { key: 'item_capability', label: 'Item Capability', source: 'product', value: item.capability },
    { key: 'session_suggestion_count', label: 'Session Suggestion Count', source: 'session', value: context.sessionSuggestionCount },
    { key: 'sensitive_context_gate', label: 'Sensitive Context Gate', source: 'policy', value: !context.isSensitiveContext },
  ];
  const notUsedData: TransparencyDatum[] = [
    { key: 'payment_data', label: 'Payment Data', source: 'policy', value: false },
    { key: 'credentials', label: 'Credentials or Private Forms', source: 'policy', value: false },
    { key: 'cross_session_history', label: 'Cross-Session History', source: 'policy', value: false },
    { key: 'tracking_signals', label: 'Tracking Signals', source: 'policy', value: false },
  ];
  return {
    id: item.id,
    why: meta.transparencyNote,
    usedData,
    notUsedData,
    disableHint: meta.disableHint
  };
}

