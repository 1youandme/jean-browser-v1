export type ProductType = 'plugin' | 'service' | 'compute_pack';

export interface PrivacyImpact {
  dataCollection: ('none' | 'minimal' | 'functional' | 'tracking')[];
  dataSharing: boolean;
  retentionDays: number;
}

export interface StoreItem {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  capability: string;
  limitations: string[];
  privacyImpact: PrivacyImpact;
  price: number;
  currency: string;
}

export interface SuggestionContext {
  userIntent: string;
  isSensitiveContext: boolean;
  recentDismissals: string[];
  sessionSuggestionCount: number;
}

export interface EthicalSuggestion {
  productId: string;
  reason: string;
  transparencyNote: string; // "Why am I seeing this?"
  disableHint: string;      // "How to turn this off"
  optional: true;
  dismissible: true;
}
