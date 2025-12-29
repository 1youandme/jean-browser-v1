import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Star,
  Gift,
  Crown,
  Gem,
  Zap,
  Award,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  Users,
  ShoppingCart,
  MessageSquare,
  Heart,
  Share2,
  CheckCircle,
  Lock,
  Unlock,
  Settings,
  Plus,
  X,
  Eye,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  Coins,
  Medal,
  Flame,
  Rocket
} from 'lucide-react';

// Types
interface RewardTier {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints?: number;
  icon: string;
  color: string;
  benefits: string[];
  nextTierProgress?: number;
}

interface RewardRule {
  id: string;
  name: string;
  description: string;
  type: 'purchase' | 'referral' | 'review' | 'social' | 'login' | 'milestone' | 'custom';
  points: number;
  multiplier?: number;
  conditions: {
    minAmount?: number;
    category?: string;
    maxPerDay?: number;
    maxPerMonth?: number;
    verificationRequired?: boolean;
  };
  isActive: boolean;
  expiryDate?: string;
}

interface RewardActivity {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  points: number;
  description: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  metadata?: Record<string, any>;
  expiresAt?: string;
}

interface UserReward {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  spentPoints: number;
  currentTier: RewardTier;
  tierProgress: {
    currentPoints: number;
    nextTierPoints: number;
    percentage: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActivity: string;
  };
  achievements: Achievement[];
  activityHistory: RewardActivity[];
  monthlyStats: {
    earned: number;
    spent: number;
    activities: number;
  };
  referrals: {
    count: number;
    successful: number;
    pointsEarned: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface RewardRedemption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'voucher' | 'product' | 'service' | 'experience';
  category: string;
  image?: string;
  value?: number;
  currency?: string;
  validityPeriod?: number; // days
  maxRedemptions?: number;
  currentRedemptions?: number;
  tierRequirement?: string;
  isActive: boolean;
  terms?: string;
}

// Mock data
const REWARD_TIERS: RewardTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Member',
    level: 1,
    minPoints: 0,
    maxPoints: 999,
    icon: '🥉',
    color: 'bg-orange-100 text-orange-700',
    benefits: [
      '1 point per $1 spent',
      'Basic member support',
      'Monthly rewards newsletter',
      'Birthday bonus points'
    ],
    nextTierProgress: 1000
  },
  {
    id: 'silver',
    name: 'Silver Member',
    level: 2,
    minPoints: 1000,
    maxPoints: 4999,
    icon: '🥈',
    color: 'bg-gray-100 text-gray-700',
    benefits: [
      '1.2x points multiplier',
      'Priority customer support',
      'Exclusive silver deals',
      'Free shipping on orders over $50',
      'Early access to sales'
    ],
    nextTierProgress: 5000
  },
  {
    id: 'gold',
    name: 'Gold Member',
    level: 3,
    minPoints: 5000,
    maxPoints: 14999,
    icon: '🥇',
    color: 'bg-yellow-100 text-yellow-700',
    benefits: [
      '1.5x points multiplier',
      'Dedicated account manager',
      'Exclusive gold member events',
      'Free shipping on all orders',
      'Price match guarantee',
      'Extended return period (60 days)'
    ],
    nextTierProgress: 15000
  },
  {
    id: 'platinum',
    name: 'Platinum Member',
    level: 4,
    minPoints: 15000,
    maxPoints: 49999,
    icon: '💎',
    color: 'bg-purple-100 text-purple-700',
    benefits: [
      '2x points multiplier',
      '24/7 VIP support',
      'Personal shopping assistant',
      'Exclusive platinum products',
      'Annual loyalty bonus',
      'Invitation to exclusive events',
      'Complimentary gift wrapping'
    ],
    nextTierProgress: 50000
  },
  {
    id: 'diamond',
    name: 'Diamond Member',
    level: 5,
    minPoints: 50000,
    icon: '💎',
    color: 'bg-blue-100 text-blue-700',
    benefits: [
      '3x points multiplier',
      'Personal concierge service',
      'Custom product design service',
      'First access to new products',
      'Lifetime price guarantee',
      'Annual diamond retreat invitation',
      'Exclusive diamond member community',
      'Unlimited free shipping & returns'
    ]
  }
];

const REWARD_RULES: RewardRule[] = [
  {
    id: 'purchase-points',
    name: 'Purchase Points',
    description: 'Earn points for every purchase',
    type: 'purchase',
    points: 1,
    conditions: {
      minAmount: 1
    },
    isActive: true
  },
  {
    id: 'referral-bonus',
    name: 'Referral Bonus',
    description: 'Earn points for successful referrals',
    type: 'referral',
    points: 500,
    conditions: {
      verificationRequired: true
    },
    isActive: true
  },
  {
    id: 'review-bonus',
    name: 'Product Review',
    description: 'Earn points for writing product reviews',
    type: 'review',
    points: 50,
    conditions: {
      maxPerDay: 5,
      maxPerMonth: 50
    },
    isActive: true
  },
  {
    id: 'social-share',
    name: 'Social Sharing',
    description: 'Share products on social media',
    type: 'social',
    points: 10,
    conditions: {
      maxPerDay: 10
    },
    isActive: true
  },
  {
    id: 'daily-login',
    name: 'Daily Login',
    description: 'Login daily to maintain streak',
    type: 'login',
    points: 5,
    conditions: {
      maxPerDay: 1
    },
    isActive: true
  },
  {
    id: 'first-purchase',
    name: 'First Purchase Bonus',
    description: 'Bonus points for first purchase',
    type: 'milestone',
    points: 100,
    conditions: {},
    isActive: true
  }
];

const MOCK_REWARDS: RewardRedemption[] = [
  {
    id: 'discount-10',
    name: '10% Off Coupon',
    description: 'Get 10% off your next purchase',
    pointsCost: 500,
    type: 'discount',
    category: 'Discounts',
    value: 10,
    validityPeriod: 30,
    isActive: true,
    terms: 'Valid for single purchase, minimum order $25'
  },
  {
    id: 'discount-25',
    name: '25% Off Coupon',
    description: 'Get 25% off your next purchase',
    pointsCost: 1200,
    type: 'discount',
    category: 'Discounts',
    value: 25,
    validityPeriod: 30,
    tierRequirement: 'silver',
    isActive: true,
    terms: 'Valid for single purchase, minimum order $50'
  },
  {
    id: 'free-shipping',
    name: 'Free Shipping Voucher',
    description: 'Free shipping on your next order',
    pointsCost: 200,
    type: 'voucher',
    category: 'Shipping',
    validityPeriod: 60,
    isActive: true
  },
  {
    id: 'product-gift',
    name: 'Premium Wireless Earbuds',
    description: 'Free pair of premium wireless earbuds',
    pointsCost: 3000,
    type: 'product',
    category: 'Products',
    maxRedemptions: 100,
    currentRedemptions: 45,
    isActive: true,
    terms: 'While supplies last, color may vary'
  },
  {
    id: 'vip-experience',
    name: 'VIP Shopping Experience',
    description: 'Personal shopping assistant and exclusive access',
    pointsCost: 5000,
    type: 'experience',
    category: 'Experiences',
    tierRequirement: 'gold',
    validityPeriod: 90,
    isActive: true
  }
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-purchase',
    name: 'First Purchase',
    description: 'Complete your first purchase',
    icon: '🛒',
    points: 100,
    unlockedAt: '2023-06-15',
    rarity: 'common'
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Share 10 products on social media',
    icon: '🦋',
    points: 200,
    unlockedAt: '2023-07-20',
    rarity: 'common'
  },
  {
    id: 'review-master',
    name: 'Review Master',
    description: 'Write 25 product reviews',
    icon: '⭐',
    points: 500,
    unlockedAt: '2023-08-10',
    rarity: 'rare'
  },
  {
    id: 'referral-champion',
    name: 'Referral Champion',
    description: 'Refer 10 successful new members',
    icon: '🏆',
    points: 1000,
    unlockedAt: '2023-09-05',
    rarity: 'epic'
  },
  {
    id: 'loyalty-legend',
    name: 'Loyalty Legend',
    description: 'Maintain a 100-day login streak',
    icon: '👑',
    points: 2000,
    unlockedAt: '2023-11-01',
    rarity: 'legendary'
  }
];

const MOCK_USER_REWARD: UserReward = {
  userId: 'user-1',
  totalPoints: 12500,
  availablePoints: 8750,
  spentPoints: 3750,
  currentTier: REWARD_TIERS[2], // Gold
  tierProgress: {
    currentPoints: 12500,
    nextTierPoints: 15000,
    percentage: 83.3
  },
  streak: {
    current: 15,
    longest: 45,
    lastActivity: new Date().toISOString()
  },
  achievements: MOCK_ACHIEVEMENTS,
  activityHistory: [],
  monthlyStats: {
    earned: 750,
    spent: 250,
    activities: 28
  },
  referrals: {
    count: 12,
    successful: 8,
    pointsEarned: 4000
  }
};

export const RewardsSystem: React.FC = () => {
  const [userReward, setUserReward] = useState<UserReward>(MOCK_USER_REWARD);
  const [rewards, setRewards] = useState<RewardRedemption[]>(MOCK_REWARDS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState<RewardRedemption | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get rarity color
  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format points
  const formatPoints = (points: number): string => {
    return points.toLocaleString();
  };

  // Calculate tier progress percentage
  const calculateTierProgress = (currentPoints: number, currentTier: RewardTier): number => {
    if (!currentTier.nextTierProgress) return 100;
    const tierRange = currentTier.nextTierProgress - currentTier.minPoints;
    const userProgress = currentPoints - currentTier.minPoints;
    return Math.min((userProgress / tierRange) * 100, 100);
  };

  // Redeem reward
  const handleRedeemReward = useCallback(async (reward: RewardRedemption) => {
    if (userReward.availablePoints < reward.pointsCost) {
      alert('Insufficient points to redeem this reward');
      return;
    }

    setIsLoading(true);
    
    // Mock redemption process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update user points
    setUserReward(prev => ({
      ...prev,
      availablePoints: prev.availablePoints - reward.pointsCost,
      spentPoints: prev.spentPoints + reward.pointsCost
    }));

    // Update reward redemption count
    setRewards(prev => prev.map(r =>
      r.id === reward.id && r.maxRedemptions
        ? { ...r, currentRedemptions: (r.currentRedemptions || 0) + 1 }
        : r
    ));

    setShowRedeemModal(false);
    setIsLoading(false);
    alert('Reward redeemed successfully!');
  }, [userReward.availablePoints]);

  // Filter rewards by category
  const filteredRewards = selectedCategory === 'All' 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(rewards.map(r => r.category)))];

  // User's current tier
  const currentTierInfo = REWARD_TIERS.find(t => t.id === userReward.currentTier.id) || REWARD_TIERS[0];
  const nextTierInfo = REWARD_TIERS.find(t => t.level === currentTierInfo.level + 1);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              JeanTrail Rewards System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Earn points, unlock achievements, and redeem exclusive rewards
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRules(!showRules)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                showRules 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Rules
            </button>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                showAchievements 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Award className="w-4 h-4 inline mr-1" />
              Achievements
            </button>
          </div>
        </div>
      </div>

      {/* User Stats Overview */}
      <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Tier */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Tier</h3>
              <div className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center ${currentTierInfo.color}`}>
                <span className="mr-2">{currentTierInfo.icon}</span>
                {currentTierInfo.name}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Points</span>
                <span className="font-semibold">{formatPoints(userReward.totalPoints)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-green-600">{formatPoints(userReward.availablePoints)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spent</span>
                <span className="font-semibold text-orange-600">{formatPoints(userReward.spentPoints)}</span>
              </div>
              {nextTierInfo && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress to {nextTierInfo.name}</span>
                    <span className="font-medium">
                      {userReward.tierProgress.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${userReward.tierProgress.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPoints(userReward.currentTier.nextTierProgress - userReward.totalPoints)} points to next tier
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Streak & Activity */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Streak</h3>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Streak</span>
                <span className="font-semibold text-orange-600 flex items-center">
                  <Flame className="w-4 h-4 mr-1" />
                  {userReward.streak.current} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Longest Streak</span>
                <span className="font-semibold text-gray-900">
                  {userReward.streak.longest} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold text-blue-600">
                  {formatPoints(userReward.monthlyStats.earned)} earned
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Login daily to maintain your streak!
                </div>
              </div>
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Referrals</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Referred</span>
                <span className="font-semibold text-blue-600">
                  {userReward.referrals.count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Successful</span>
                <span className="font-semibold text-green-600">
                  {userReward.referrals.successful}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Points Earned</span>
                <span className="font-semibold text-purple-600">
                  {formatPoints(userReward.referrals.pointsEarned)}
                </span>
              </div>
              <button className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Users className="w-3 h-3 inline mr-1" />
                Refer Friends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      {showRules && (
        <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REWARD_RULES.filter(rule => rule.isActive).map(rule => (
              <div key={rule.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <span className="text-sm font-semibold text-blue-600">
                    +{formatPoints(rule.points)} points
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  {rule.type === 'purchase' && <ShoppingCart className="w-3 h-3 mr-1" />}
                  {rule.type === 'referral' && <Users className="w-3 h-3 mr-1" />}
                  {rule.type === 'review' && <MessageSquare className="w-3 h-3 mr-1" />}
                  {rule.type === 'social' && <Share2 className="w-3 h-3 mr-1" />}
                  {rule.type === 'login' && <Clock className="w-3 h-3 mr-1" />}
                  {rule.type === 'milestone' && <Trophy className="w-3 h-3 mr-1" />}
                  {rule.conditions.maxPerDay && (
                    <span className="ml-2">Max {rule.conditions.maxPerDay}/day</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {showAchievements && (
        <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <span className="text-sm text-gray-600">
              {userReward.achievements.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userReward.achievements.map(achievement => (
              <div key={achievement.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{achievement.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-green-600">
                    +{formatPoints(achievement.points)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Redemption */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Redeem Rewards</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="text-sm text-gray-600">
              Your balance: <span className="font-semibold text-green-600">
                {formatPoints(userReward.availablePoints)} points
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map(reward => (
            <div key={reward.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Reward Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {reward.category}
                  </span>
                  {reward.tierRequirement && (
                    <span className="text-xs text-gray-500">
                      {reward.tierRequirement}+ tier
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{reward.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-lg font-bold text-gray-900">
                      {formatPoints(reward.pointsCost)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">points</span>
                  </div>
                  {reward.value && (
                    <span className="text-sm font-medium text-green-600">
                      {reward.currency === 'USD' && '$'}
                      {reward.value}
                      {reward.currency !== 'USD' && reward.currency}
                      {reward.type === 'discount' && '% off'}
                    </span>
                  )}
                </div>
              </div>

              {/* Reward Details */}
              <div className="p-4 bg-white">
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {reward.validityPeriod && (
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-2" />
                      Valid for {reward.validityPeriod} days after redemption
                    </div>
                  )}
                  {reward.maxRedemptions && (
                    <div className="flex items-center">
                      <Target className="w-3 h-3 mr-2" />
                      {reward.maxRedemptions - (reward.currentRedemptions || 0)} of {reward.maxRedemptions} available
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedReward(reward);
                    setShowRedeemModal(true);
                  }}
                  disabled={
                    userReward.availablePoints < reward.pointsCost ||
                    !reward.isActive ||
                    (reward.maxRedemptions && (reward.currentRedemptions || 0) >= reward.maxRedemptions)
                  }
                  className={`w-full px-4 py-2 rounded-lg font-medium text-sm ${
                    userReward.availablePoints >= reward.pointsCost && reward.isActive &&
                    (!reward.maxRedemptions || (reward.currentRedemptions || 0) < reward.maxRedemptions)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {userReward.availablePoints < reward.pointsCost
                    ? 'Insufficient Points'
                    : !reward.isActive
                    ? 'Not Available'
                    : reward.maxRedemptions && (reward.currentRedemptions || 0) >= reward.maxRedemptions
                    ? 'Sold Out'
                    : 'Redeem Reward'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redemption Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Redeem Reward</h3>
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎁</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedReward.name}
                </h4>
                <p className="text-gray-600 mb-4">{selectedReward.description}</p>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPoints(selectedReward.pointsCost)}
                    </span>
                    <span className="text-gray-500 ml-1">points</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your balance after redemption: 
                    <span className="font-semibold text-green-600">
                      {' '}{formatPoints(userReward.availablePoints - selectedReward.pointsCost)} points
                    </span>
                  </p>
                </div>
                {selectedReward.terms && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600">
                      <strong>Terms:</strong> {selectedReward.terms}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRedeemReward(selectedReward)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />
                  ) : (
                    <Gift className="w-4 h-4 inline mr-1" />
                  )}
                  {isLoading ? 'Processing...' : 'Redeem Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};