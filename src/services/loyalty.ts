// Loyalty / Points / Tokenomics Service Interface and Implementation
export interface LoyaltyLedger {
  id: string;
  userId: string;
  transactionType: string;
  source: string;
  points: number;
  direction: Direction;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

export type Direction = 'earn' | 'spend';

export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: Record<string, any>;
  isActive: boolean;
  quantityAvailable?: number;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  pointsUsed: number;
  status: string;
  claimedAt: Date;
  usedAt?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

export interface UserPointsBalance {
  userId: string;
  currentBalance: number;
  earnedLifetime: number;
  spentLifetime: number;
  expiringSoon: number;
  nextExpiration?: string;
}

export interface EarnPointsRequest {
  userId: string;
  source: string;
  transactionType: string;
  points: number;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  expiresDays?: number;
}

export interface RedeemRewardRequest {
  userId: string;
  rewardId: string;
  metadata?: Record<string, any>;
}

export interface CreateRewardRequest {
  name: string;
  description?: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: Record<string, any>;
  quantityAvailable?: number;
  validUntil?: Date;
}

export interface TransactionHistoryQuery {
  limit?: number;
  offset?: number;
  source?: string;
  direction?: Direction;
}

export interface ListRewardsQuery {
  isActive?: boolean;
  rewardType?: string;
  minPoints?: number;
  maxPoints?: number;
}

export interface LoyaltyService {
  // Points balance
  getUserPointsBalance: (userId: string) => Promise<UserPointsBalance>;
  earnPoints: (request: EarnPointsRequest) => Promise<LoyaltyLedger>;
  spendPoints: (userId: string, request: { points: number; description?: string }) => Promise<{
    success: boolean;
    newBalance: number;
    pointsSpent: number;
    ledgerEntry: LoyaltyLedger;
  }>;
  
  // Transaction history
  getUserTransactionHistory: (userId: string, query?: TransactionHistoryQuery) => Promise<LoyaltyLedger[]>;
  
  // Rewards management
  listRewards: (query?: ListRewardsQuery) => Promise<Reward[]>;
  createReward: (request: CreateRewardRequest) => Promise<Reward>;
  redeemReward: (request: RedeemRewardRequest) => Promise<UserReward>;
  getUserRewards: (userId: string) => Promise<UserReward[]>;
  
  // Points earning triggers
  triggerDailyLoginBonus: (userId: string) => Promise<void>;
  triggerReferralBonus: (referrerId: string, referredId: string) => Promise<void>;
  triggerContentCreationBonus: (userId: string, contentType: string) => Promise<void>;
}

class LoyaltyServiceImpl implements LoyaltyService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getUserPointsBalance(userId: string): Promise<UserPointsBalance> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/users/${userId}/balance`);
    if (!response.ok) throw new Error(`Failed to fetch points balance: ${response.statusText}`);
    return response.json();
  }

  async earnPoints(request: EarnPointsRequest): Promise<LoyaltyLedger> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/earn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to earn points: ${response.statusText}`);
    return response.json();
  }

  async spendPoints(userId: string, request: { points: number; description?: string }): Promise<{
    success: boolean;
    newBalance: number;
    pointsSpent: number;
    ledgerEntry: LoyaltyLedger;
  }> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/users/${userId}/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to spend points: ${response.statusText}`);
    return response.json();
  }

  async getUserTransactionHistory(userId: string, query?: TransactionHistoryQuery): Promise<LoyaltyLedger[]> {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());
    if (query?.source) params.append('source', query.source);
    if (query?.direction) params.append('direction', query.direction);

    const response = await fetch(`${this.baseUrl}/api/loyalty/users/${userId}/transactions?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
    return response.json();
  }

  async listRewards(query?: ListRewardsQuery): Promise<Reward[]> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query?.rewardType) params.append('rewardType', query.rewardType);
    if (query?.minPoints) params.append('minPoints', query.minPoints.toString());
    if (query?.maxPoints) params.append('maxPoints', query.maxPoints.toString());

    const response = await fetch(`${this.baseUrl}/api/loyalty/rewards?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch rewards: ${response.statusText}`);
    return response.json();
  }

  async createReward(request: CreateRewardRequest): Promise<Reward> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create reward: ${response.statusText}`);
    return response.json();
  }

  async redeemReward(request: RedeemRewardRequest): Promise<UserReward> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to redeem reward: ${response.statusText}`);
    return response.json();
  }

  async getUserRewards(userId: string): Promise<UserReward[]> {
    const response = await fetch(`${this.baseUrl}/api/loyalty/users/${userId}/rewards`);
    if (!response.ok) throw new Error(`Failed to fetch user rewards: ${response.statusText}`);
    return response.json();
  }

  async triggerDailyLoginBonus(userId: string): Promise<void> {
    const request: EarnPointsRequest = {
      userId,
      source: 'engagement',
      transactionType: 'daily_login',
      points: 10,
      description: 'Daily login bonus',
      metadata: { trigger: 'daily_login' },
      expiresDays: 365,
    };

    await this.earnPoints(request);
  }

  async triggerReferralBonus(referrerId: string, referredId: string): Promise<void> {
    const request: EarnPointsRequest = {
      userId: referrerId,
      source: 'referral',
      transactionType: 'referral_success',
      points: 100,
      description: 'Referral bonus - new user joined',
      referenceId: referredId,
      metadata: { referredUser: referredId },
      expiresDays: 365,
    };

    await this.earnPoints(request);
  }

  async triggerContentCreationBonus(userId: string, contentType: string): Promise<void> {
    const pointsMap: Record<string, number> = {
      video: 50,
      article: 25,
      plugin: 200,
      tutorial: 75,
    };

    const points = pointsMap[contentType] || 10;

    const request: EarnPointsRequest = {
      userId,
      source: 'content_creation',
      transactionType: `${contentType}_created`,
      points,
      description: `Bonus for creating ${contentType}`,
      metadata: { contentType },
      expiresDays: 365,
    };

    await this.earnPoints(request);
  }
}

// Singleton instance
export const loyaltyService = new LoyaltyServiceImpl();

// React hook
export const useLoyaltyService = (): LoyaltyService => {
  return loyaltyService;
};

// Points calculation helpers
export function calculatePointsForActivity(activity: {
  type: string;
  duration?: number;
  complexity?: 'low' | 'medium' | 'high';
}): number {
  const basePoints: Record<string, number> = {
    'daily_login': 10,
    'message_sent': 1,
    'file_uploaded': 5,
    'tab_created': 2,
    'plugin_installed': 20,
    'workspace_saved': 15,
    'api_call_made': 3,
  };

  let points = basePoints[activity.type] || 0;

  // Complexity multiplier
  if (activity.complexity) {
    const multiplier = {
      low: 1,
      medium: 1.5,
      high: 2,
    };
    points *= multiplier[activity.complexity];
  }

  // Duration bonus (for activities with time component)
  if (activity.duration && activity.duration > 300) { // 5 minutes
    points += Math.floor(activity.duration / 300) * 2;
  }

  return Math.round(points);
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function getPointsLevel(balance: number): { level: string; color: string; nextLevel?: string; pointsNeeded?: number } {
  const levels = [
    { name: 'Bronze', minPoints: 0, color: 'text-amber-600' },
    { name: 'Silver', minPoints: 500, color: 'text-gray-500' },
    { name: 'Gold', minPoints: 1500, color: 'text-yellow-600' },
    { name: 'Platinum', minPoints: 5000, color: 'text-purple-600' },
    { name: 'Diamond', minPoints: 10000, color: 'text-blue-600' },
  ];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const nextLevel = levels[i + 1];

    if (balance >= level.minPoints && (!nextLevel || balance < nextLevel.minPoints)) {
      return {
        level: level.name,
        color: level.color,
        nextLevel: nextLevel?.name,
        pointsNeeded: nextLevel ? nextLevel.minPoints - balance : undefined,
      };
    }
  }

  return { level: 'Bronze', color: 'text-amber-600' };
}