export type MarketplaceItemType = 'tool' | 'service' | 'plugin';

export interface MarketplaceBenefits {
  discountPercentage?: number;
  trialDays?: number;
  notes?: string;
}

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  capability: string[];
  useCases: string[];
  benefits?: MarketplaceBenefits;
}

export interface Suggestion {
  itemId: string;
  itemType: MarketplaceItemType;
  reason: string;
  relevanceScore: number;
  optional: true;
  dismissible: true;
  benefit?: string;
}

export interface SuggestionMemory {
  dismissedIds: string[];
  lastContextKey?: string;
}
