import { EthicalSuggestion, StoreItem, SuggestionContext } from './StoreTypes';

export class EthicalSuggestionPolicy {
  private static MAX_SUGGESTIONS_PER_SESSION = 3;
  private static DISMISSAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

  static shouldSuggest(item: StoreItem, context: SuggestionContext): boolean {
    // 1. Sensitive Context Block
    if (context.isSensitiveContext) {
      return false;
    }

    // 2. Frequency Cap
    if (context.sessionSuggestionCount >= this.MAX_SUGGESTIONS_PER_SESSION) {
      return false;
    }

    // 3. Dismissal Respect
    if (context.recentDismissals.includes(item.id)) {
      return false;
    }

    // 4. Privacy Check (Symbolic gate)
    if (item.privacyImpact.dataCollection.includes('tracking')) {
      return false; // Jean never suggests tracking products
    }

    return true;
  }

  static createTransparencyMetadata(item: StoreItem, reason: string): Pick<EthicalSuggestion, 'transparencyNote' | 'disableHint'> {
    return {
      transparencyNote: `Suggested because your intent '${reason}' matches this item's capability. No payment data influenced this.`,
      disableHint: 'You can disable store suggestions in Settings > Privacy > Store Suggestions.'
    };
  }
}
