import { EthicalSuggestion, StoreItem, SuggestionContext } from './StoreTypes';
import { EthicalSuggestionPolicy } from './EthicalSuggestionPolicy';

/**
 * The PaymentBoundary ensures that intelligence logic never accesses revenue data.
 * It acts as a one-way diode: Intelligence -> Suggestions -> User.
 * Revenue data is strictly isolated and never fed back into decision models.
 */
export class PaymentBoundary {
  
  static getEthicalSuggestion(
    item: StoreItem,
    context: SuggestionContext,
    matchReason: string
  ): EthicalSuggestion | null {
    
    // 1. Policy Gate
    if (!EthicalSuggestionPolicy.shouldSuggest(item, context)) {
      return null;
    }

    // 2. Transparency Generation
    const metadata = EthicalSuggestionPolicy.createTransparencyMetadata(item, matchReason);

    // 3. Construct Suggestion
    return {
      productId: item.id,
      reason: matchReason,
      transparencyNote: metadata.transparencyNote,
      disableHint: metadata.disableHint,
      optional: true,
      dismissible: true
    };
  }

  /**
   * Mock function to process payment. 
   * CRITICAL: This function must NEVER return data that influences future intelligence decisions.
   * Returns simple success/fail status only.
   */
  static async processPaymentIsolated(token: string, amount: number): Promise<boolean> {
    // In a real implementation, this would call a detached payment gateway.
    // Intelligence layers cannot see transaction history or volume.
    return true; 
  }
}
