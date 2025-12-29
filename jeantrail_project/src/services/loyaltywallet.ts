// Loyalty Wallet Service Interface and Implementation
export interface LoyaltyWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  points: number;
  tier: LoyaltyTier;
  memberSince: Date;
  lastActivity: Date;
  settings: WalletSettings;
}

export interface LoyaltyTier {
  name: string;
  level: number;
  benefits: string[];
  pointMultiplier: number;
  cashbackRate: number;
  requiredPoints: number;
  nextTier?: LoyaltyTier;
}

export interface WalletSettings {
  notifications: boolean;
  emailUpdates: boolean;
  autoRedeem: boolean;
  preferredRedemption: RedemptionType;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  merchant: Merchant;
  type: 'points' | 'cashback' | 'tiered' | 'hybrid';
  currency: string;
  conversionRate: number;
  expirationPolicy: ExpirationPolicy;
  benefits: ProgramBenefit[];
  isActive: boolean;
  createdAt: Date;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  logo?: string;
  website?: string;
  locations: MerchantLocation[];
}

export interface MerchantLocation {
  id: string;
  address: Address;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  hours: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ExpirationPolicy {
  type: 'fixed' | 'rolling' | 'none';
  duration?: number; // in days
  fixedDate?: Date;
}

export interface ProgramBenefit {
  id: string;
  type: 'discount' | 'freebie' | 'upgrade' | 'cashback' | 'points';
  title: string;
  description: string;
  value: number;
  requiredTier?: string;
  conditions?: string[];
  isActive: boolean;
}

export interface Transaction {
  id: string;
  walletId: string;
  programId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  amount: number;
  points?: number;
  description: string;
  referenceId?: string;
  merchant?: string;
  location?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
}

export interface Redemption {
  id: string;
  walletId: string;
  programId: string;
  type: RedemptionType;
  amount: number;
  pointsUsed: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'expired';
  redemptionCode?: string;
  instructions?: string;
  restrictions?: string[];
  createdAt: Date;
  expiresAt?: Date;
  redeemedAt?: Date;
}

export type RedemptionType = 
  | 'gift_card'
  | 'discount_coupon'
  | 'free_product'
  | 'cash'
  | 'charity'
  | 'experience'
  | 'upgrade';

export interface Reward {
  id: string;
  programId: string;
  name: string;
  description: string;
  type: RedemptionType;
  cost: number;
  value: number;
  imageUrl?: string;
  termsAndConditions?: string;
  availability: {
    total: number;
    remaining: number;
    restrictions?: string[];
  };
  popularity: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  validUntil?: Date;
}

export interface Promotion {
  id: string;
  programId: string;
  name: string;
  description: string;
  type: 'bonus' | 'multiplier' | 'cashback' | 'freebie';
  multiplier?: number;
  bonusPoints?: number;
  cashbackRate?: number;
  conditions: PromotionCondition[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxUsage?: number;
  currentUsage: number;
  targetAudience?: string[];
}

export interface PromotionCondition {
  type: 'spend' | 'visit' | 'category' | 'product' | 'time' | 'location';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
  description: string;
}

export interface LoyaltyWalletService {
  // Wallet management
  getWallet: () => Promise<LoyaltyWallet>;
  updateWalletSettings: (settings: Partial<WalletSettings>) => Promise<LoyaltyWallet>;
  getWalletBalance: () => Promise<{ balance: number; points: number; currency: string }>;
  
  // Program management
  getPrograms: () => Promise<LoyaltyProgram[]>;
  getProgram: (id: string) => Promise<LoyaltyProgram>;
  joinProgram: (programId: string) => Promise<void>;
  leaveProgram: (programId: string) => Promise<void>;
  getActivePrograms: () => Promise<LoyaltyProgram[]>;
  
  // Transaction management
  getTransactions: (filters?: TransactionFilters) => Promise<Transaction[]>;
  getTransaction: (id: string) => Promise<Transaction>;
  getTransactionHistory: (limit?: number, offset?: number) => Promise<{ transactions: Transaction[]; total: number }>;
  
  // Points and rewards
  getRewards: (programId?: string) => Promise<Reward[]>;
  getReward: (id: string) => Promise<Reward>;
  redeemReward: (rewardId: string, quantity?: number) => Promise<Redemption>;
  getRedemptions: (status?: Redemption['status']) => Promise<Redemption[]>;
  getRedemption: (id: string) => Promise<Redemption>;
  cancelRedemption: (redemptionId: string) => Promise<void>;
  
  // Promotions
  getPromotions: (programId?: string) => Promise<Promotion[]>;
  getPromotion: (id: string) => Promise<Promotion>;
  activatePromotion: (promotionId: string) => Promise<void>;
  
  // Analytics and insights
  getEarningsSummary: (timeRange?: string) => Promise<EarningsSummary>;
  getSpendingInsights: () => Promise<SpendingInsight[]>;
  getTierProgress: () => Promise<TierProgress>;
  getSavingsAnalysis: () => Promise<SavingsAnalysis>;
  
  // Search and discovery
  searchMerchants: (query: string, location?: string) => Promise<Merchant[]>;
  getNearbyMerchants: (coordinates: { lat: number; lng: number }, radius?: number) => Promise<Merchant[]>;
  getMerchantPrograms: (merchantId: string) => Promise<LoyaltyProgram[]>;
  
  // Social features
  referFriend: (email: string, message?: string) => Promise<Referral>;
  getReferrals: () => Promise<Referral[]>;
  shareReward: (redemptionId: string, recipient: string) => Promise<void>;
  
  // Notifications
  getNotifications: () => Promise<LoyaltyNotification[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  subscribeToPromotions: (programIds: string[]) => Promise<void>;
  unsubscribeFromPromotions: (programIds: string[]) => Promise<void>;
}

export interface TransactionFilters {
  programId?: string;
  type?: Transaction['type'];
  status?: Transaction['status'];
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  merchant?: string;
}

export interface EarningsSummary {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  pointsEarned: number;
  pointsRedeemed: number;
  savings: number;
  topPrograms: Array<{
    programId: string;
    programName: string;
    earned: number;
    redeemed: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    earned: number;
    redeemed: number;
  }>;
}

export interface SpendingInsight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

export interface TierProgress {
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  currentPoints: number;
  pointsToNext: number;
  progressPercentage: number;
  benefitsToUnlock: string[];
  estimatedTimeToNext: number; // in days
}

export interface SavingsAnalysis {
  totalSavings: number;
  cashbackEarned: number;
  discountValue: number;
  freebieValue: number;
  averageSavingsPerTransaction: number;
  bestProgram: {
    programId: string;
    programName: string;
    savings: number;
  };
  optimizationSuggestions: string[];
}

export interface Referral {
  id: string;
  referredEmail: string;
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  reward: {
    points: number;
    description: string;
  };
  referredAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface LoyaltyNotification {
  id: string;
  type: 'points_earned' | 'reward_available' | 'promotion_active' | 'tier_upgrade' | 'points_expiring';
  title: string;
  message: string;
  programId?: string;
  programName?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

class LoyaltyWalletServiceImpl implements LoyaltyWalletService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getWallet(): Promise<LoyaltyWallet> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/wallet`);
    if (!response.ok) throw new Error('Failed to get wallet');
    return response.json();
  }

  async updateWalletSettings(settings: Partial<WalletSettings>): Promise<LoyaltyWallet> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/wallet/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update wallet settings');
    return response.json();
  }

  async getWalletBalance(): Promise<{ balance: number; points: number; currency: string }> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/wallet/balance`);
    if (!response.ok) throw new Error('Failed to get wallet balance');
    return response.json();
  }

  async getPrograms(): Promise<LoyaltyProgram[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/programs`);
    if (!response.ok) throw new Error('Failed to get programs');
    return response.json();
  }

  async getProgram(id: string): Promise<LoyaltyProgram> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/programs/${id}`);
    if (!response.ok) throw new Error('Failed to get program');
    return response.json();
  }

  async joinProgram(programId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/programs/${programId}/join`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to join program');
  }

  async leaveProgram(programId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/programs/${programId}/leave`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to leave program');
  }

  async getActivePrograms(): Promise<LoyaltyProgram[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/programs/active`);
    if (!response.ok) throw new Error('Failed to get active programs');
    return response.json();
  }

  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
              params.append(`${key}.${subKey}`, String(subValue));
            });
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/loyalty/transactions?${params}`);
    if (!response.ok) throw new Error('Failed to get transactions');
    return response.json();
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/transactions/${id}`);
    if (!response.ok) throw new Error('Failed to get transaction');
    return response.json();
  }

  async getTransactionHistory(limit?: number, offset?: number): Promise<{ transactions: Transaction[]; total: number }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await fetch(`${this.baseUrl}/api/loyalty/transactions/history?${params}`);
    if (!response.ok) throw new Error('Failed to get transaction history');
    return response.json();
  }

  async getRewards(programId?: string): Promise<Reward[]> {
    const params = programId ? `?programId=${programId}` : '';
    const response = await fetch(`${this.baseUrl}/api/loyalty/rewards${params}`);
    if (!response.ok) throw new Error('Failed to get rewards');
    return response.json();
  }

  async getReward(id: string): Promise<Reward> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/rewards/${id}`);
    if (!response.ok) throw new Error('Failed to get reward');
    return response.json();
  }

  async redeemReward(rewardId: string, quantity?: number): Promise<Redemption> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to redeem reward');
    return response.json();
  }

  async getRedemptions(status?: Redemption['status']): Promise<Redemption[]> {
    const params = status ? `?status=${status}` : '';
    const response = await fetch(`${this.baseUrl}/api/loyalty/redemptions${params}`);
    if (!response.ok) throw new Error('Failed to get redemptions');
    return response.json();
  }

  async getRedemption(id: string): Promise<Redemption> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/redemptions/${id}`);
    if (!response.ok) throw new Error('Failed to get redemption');
    return response.json();
  }

  async cancelRedemption(redemptionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/redemptions/${redemptionId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel redemption');
  }

  async getPromotions(programId?: string): Promise<Promotion[]> {
    const params = programId ? `?programId=${programId}` : '';
    const response = await fetch(`${this.baseUrl}/api/loyalty/promotions${params}`);
    if (!response.ok) throw new Error('Failed to get promotions');
    return response.json();
  }

  async getPromotion(id: string): Promise<Promotion> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/promotions/${id}`);
    if (!response.ok) throw new Error('Failed to get promotion');
    return response.json();
  }

  async activatePromotion(promotionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/promotions/${promotionId}/activate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to activate promotion');
  }

  async getEarningsSummary(timeRange?: string): Promise<EarningsSummary> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/loyalty/analytics/earnings${params}`);
    if (!response.ok) throw new Error('Failed to get earnings summary');
    return response.json();
  }

  async getSpendingInsights(): Promise<SpendingInsight[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/analytics/spending-insights`);
    if (!response.ok) throw new Error('Failed to get spending insights');
    return response.json();
  }

  async getTierProgress(): Promise<TierProgress> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/analytics/tier-progress`);
    if (!response.ok) throw new Error('Failed to get tier progress');
    return response.json();
  }

  async getSavingsAnalysis(): Promise<SavingsAnalysis> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/analytics/savings`);
    if (!response.ok) throw new Error('Failed to get savings analysis');
    return response.json();
  }

  async searchMerchants(query: string, location?: string): Promise<Merchant[]> {
    const params = new URLSearchParams({ query });
    if (location) params.append('location', location);

    const response = await fetch(`${this.baseUrl}/api/loyalty/merchants/search?${params}`);
    if (!response.ok) throw new Error('Failed to search merchants');
    return response.json();
  }

  async getNearbyMerchants(coordinates: { lat: number; lng: number }, radius?: number): Promise<Merchant[]> {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lng: coordinates.lng.toString(),
    });
    if (radius) params.append('radius', radius.toString());

    const response = await fetch(`${this.baseUrl}/api/loyalty/merchants/nearby?${params}`);
    if (!response.ok) throw new Error('Failed to get nearby merchants');
    return response.json();
  }

  async getMerchantPrograms(merchantId: string): Promise<LoyaltyProgram[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/merchants/${merchantId}/programs`);
    if (!response.ok) throw new Error('Failed to get merchant programs');
    return response.json();
  }

  async referFriend(email: string, message?: string): Promise<Referral> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    });
    if (!response.ok) throw new Error('Failed to refer friend');
    return response.json();
  }

  async getReferrals(): Promise<Referral[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/referrals`);
    if (!response.ok) throw new Error('Failed to get referrals');
    return response.json();
  }

  async shareReward(redemptionId: string, recipient: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/redemptions/${redemptionId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient }),
    });
    if (!response.ok) throw new Error('Failed to share reward');
  }

  async getNotifications(): Promise<LoyaltyNotification[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/notifications`);
    if (!response.ok) throw new Error('Failed to get notifications');
    return response.json();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/notifications/${notificationId}/read`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }

  async subscribeToPromotions(programIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/subscriptions/promotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programIds }),
    });
    if (!response.ok) throw new Error('Failed to subscribe to promotions');
  }

  async unsubscribeFromPromotions(programIds: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/subscriptions/promotions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ programIds }),
    });
    if (!response.ok) throw new Error('Failed to unsubscribe from promotions');
  }
}

export const loyaltyWalletService = new LoyaltyWalletServiceImpl();
export const useLoyaltyWalletService = () => loyaltyWalletService;