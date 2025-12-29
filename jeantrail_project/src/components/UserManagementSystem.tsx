import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Settings,
  Shield,
  Award,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Crown,
  Gem,
  Zap,
  BarChart3,
  Clock,
  Globe,
  Camera,
  FileText,
  CreditCard,
  Bell,
  BellOff
} from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location: {
    country: string;
    city: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      showEmail: boolean;
      showPhone: boolean;
      showLocation: boolean;
    };
  };
  verification: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
    business: boolean;
  };
  subscription: {
    tier: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'suspended' | 'cancelled';
    startDate: string;
    endDate?: string;
    features: string[];
  };
  statistics: {
    joinDate: string;
    lastLogin: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    productsListed: number;
    productsSold: number;
    reviewsReceived: number;
    reviewsGiven: number;
    reputation: number;
    activityScore: number;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    loginAttempts: number;
    blockedUntil?: string;
    deviceTrust: Array<{
      deviceId: string;
      deviceName: string;
      trusted: boolean;
      lastUsed: string;
    }>;
  };
  status: 'active' | 'inactive' | 'suspended' | 'banned';
  roles: string[];
  permissions: string[];
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserFilter {
  status: string;
  subscriptionTier: string;
  verification: string;
  country: string;
  joinDateRange: [string, string];
  lastLoginRange: [string, string];
  hasOrders: boolean;
  hasProducts: boolean;
  minSpent: number;
  maxSpent: number;
  tags: string[];
}

interface CreateUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: string;
  sendWelcomeEmail: boolean;
}

// Mock data
const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-1',
    username: 'ahmed_alrashid',
    email: 'ahmed.rashid@example.com',
    phone: '+966 50 123 4567',
    firstName: 'Ahmed',
    lastName: 'Al Rashid',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    location: {
      country: 'Saudi Arabia',
      city: 'Riyadh',
      address: 'King Abdullah District, Riyadh 12345',
      coordinates: { latitude: 24.7136, longitude: 46.6753 }
    },
    preferences: {
      language: 'ar',
      timezone: 'Asia/Riyadh',
      currency: 'SAR',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: true
      }
    },
    verification: {
      email: true,
      phone: true,
      identity: true,
      address: true,
      business: false
    },
    subscription: {
      tier: 'premium',
      status: 'active',
      startDate: '2023-01-15',
      endDate: '2024-01-15',
      features: ['university_access', 'priority_support', 'api_access', 'analytics']
    },
    statistics: {
      joinDate: '2023-01-15',
      lastLogin: '2024-01-20T10:30:00Z',
      totalOrders: 45,
      totalSpent: 12500,
      averageOrderValue: 278,
      productsListed: 12,
      productsSold: 89,
      reviewsReceived: 34,
      reviewsGiven: 23,
      reputation: 4.7,
      activityScore: 89
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2024-01-01',
      loginAttempts: 0,
      deviceTrust: [
        {
          deviceId: 'device-1',
          deviceName: 'iPhone 14 Pro',
          trusted: true,
          lastUsed: '2024-01-20T10:30:00Z'
        },
        {
          deviceId: 'device-2',
          deviceName: 'MacBook Pro',
          trusted: true,
          lastUsed: '2024-01-19T15:45:00Z'
        }
      ]
    },
    status: 'active',
    roles: ['user', 'seller'],
    permissions: ['buy', 'sell', 'create_listings', 'view_analytics'],
    notes: 'Premium seller with excellent reputation',
    tags: ['verified', 'premium', 'top_seller'],
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'user-2',
    username: 'fatima_salem',
    email: 'fatima.salem@example.com',
    phone: '+971 55 987 6543',
    firstName: 'Fatima',
    lastName: 'Salem',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    dateOfBirth: '1988-09-22',
    gender: 'female',
    location: {
      country: 'UAE',
      city: 'Dubai',
      address: 'Dubai Marina, Dubai',
      coordinates: { latitude: 25.0771, longitude: 55.1384 }
    },
    preferences: {
      language: 'en',
      timezone: 'Asia/Dubai',
      currency: 'AED',
      notifications: {
        email: true,
        push: false,
        sms: true
      },
      privacy: {
        profileVisibility: 'friends',
        showEmail: false,
        showPhone: false,
        showLocation: true
      }
    },
    verification: {
      email: true,
      phone: true,
      identity: false,
      address: true,
      business: true
    },
    subscription: {
      tier: 'basic',
      status: 'active',
      startDate: '2023-06-10',
      features: ['basic_analytics', 'email_support']
    },
    statistics: {
      joinDate: '2023-06-10',
      lastLogin: '2024-01-19T14:20:00Z',
      totalOrders: 23,
      totalSpent: 3450,
      averageOrderValue: 150,
      productsListed: 8,
      productsSold: 34,
      reviewsReceived: 18,
      reviewsGiven: 12,
      reputation: 4.3,
      activityScore: 72
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2023-12-15',
      loginAttempts: 2,
      deviceTrust: [
        {
          deviceId: 'device-3',
          deviceName: 'Samsung Galaxy S23',
          trusted: false,
          lastUsed: '2024-01-19T14:20:00Z'
        }
      ]
    },
    status: 'active',
    roles: ['user'],
    permissions: ['buy', 'create_listings'],
    notes: 'Regular buyer, interested in beauty products',
    tags: ['verified', 'basic'],
    createdAt: '2023-06-10T09:30:00Z',
    updatedAt: '2024-01-19T14:20:00Z'
  },
  {
    id: 'user-3',
    username: 'mohamed_ali',
    email: 'mohamed.ali@example.com',
    phone: '+20 101 234 5678',
    firstName: 'Mohamed',
    lastName: 'Ali',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    dateOfBirth: '1992-03-10',
    gender: 'male',
    location: {
      country: 'Egypt',
      city: 'Cairo',
      address: 'Nasr City, Cairo',
      coordinates: { latitude: 30.0444, longitude: 31.2357 }
    },
    preferences: {
      language: 'ar',
      timezone: 'Africa/Cairo',
      currency: 'EGP',
      notifications: {
        email: false,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'private',
        showEmail: false,
        showPhone: false,
        showLocation: false
      }
    },
    verification: {
      email: true,
      phone: false,
      identity: false,
      address: false,
      business: false
    },
    subscription: {
      tier: 'free',
      status: 'active',
      startDate: '2023-11-01',
      features: []
    },
    statistics: {
      joinDate: '2023-11-01',
      lastLogin: '2024-01-18T16:45:00Z',
      totalOrders: 5,
      totalSpent: 450,
      averageOrderValue: 90,
      productsListed: 2,
      productsSold: 3,
      reviewsReceived: 2,
      reviewsGiven: 4,
      reputation: 3.8,
      activityScore: 45
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2023-11-01',
      loginAttempts: 1,
      deviceTrust: []
    },
    status: 'active',
    roles: ['user'],
    permissions: ['buy'],
    notes: 'New user, exploring the platform',
    tags: ['new', 'free'],
    createdAt: '2023-11-01T11:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z'
  }
];

const SUBSCRIPTION_TIERS = [
  { tier: 'free', name: 'Free', color: 'bg-gray-100 text-gray-700', icon: Users },
  { tier: 'basic', name: 'Basic', color: 'bg-blue-100 text-blue-700', icon: Shield },
  { tier: 'premium', name: 'Premium', color: 'bg-purple-100 text-purple-700', icon: Crown },
  { tier: 'enterprise', name: 'Enterprise', color: 'bg-orange-100 text-orange-700', icon: Gem }
];

const USER_ROLES = [
  { role: 'user', name: 'User', description: 'Regular platform user' },
  { role: 'seller', name: 'Seller', description: 'Can list and sell products' },
  { role: 'moderator', name: 'Moderator', description: 'Can moderate content' },
  { role: 'admin', name: 'Administrator', description: 'Full system access' }
];

export const UserManagementSystem: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<UserFilter>({
    status: '',
    subscriptionTier: '',
    verification: '',
    country: '',
    joinDateRange: ['', ''],
    lastLoginRange: ['', ''],
    hasOrders: false,
    hasProducts: false,
    minSpent: 0,
    maxSpent: 100000,
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Apply filters and search
  useEffect(() => {
    let filtered = users.filter(user => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
          user.location.city.toLowerCase().includes(query) ||
          user.location.country.toLowerCase().includes(query) ||
          user.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && user.status !== filters.status) return false;

      // Subscription tier filter
      if (filters.subscriptionTier && user.subscription.tier !== filters.subscriptionTier) return false;

      // Verification filter
      if (filters.verification) {
        if (filters.verification === 'email' && !user.verification.email) return false;
        if (filters.verification === 'phone' && !user.verification.phone) return false;
        if (filters.verification === 'identity' && !user.verification.identity) return false;
        if (filters.verification === 'business' && !user.verification.business) return false;
      }

      // Country filter
      if (filters.country && user.location.country !== filters.country) return false;

      // Date filters would need more complex implementation
      // For brevity, skipping detailed date filtering logic

      // Has orders filter
      if (filters.hasOrders && user.statistics.totalOrders === 0) return false;

      // Has products filter
      if (filters.hasProducts && user.statistics.productsListed === 0) return false;

      // Spending range filter
      if (user.statistics.totalSpent < filters.minSpent || user.statistics.totalSpent > filters.maxSpent) return false;

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => user.tags.includes(tag))) return false;

      return true;
    });

    setFilteredUsers(filtered);
  }, [users, searchQuery, filters]);

  // Get subscription tier info
  const getSubscriptionTier = (tier: string) => {
    return SUBSCRIPTION_TIERS.find(t => t.tier === tier) || SUBSCRIPTION_TIERS[0];
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get verification status
  const getVerificationStatus = (verification: UserProfile['verification']): { status: string; color: string } => {
    const verifiedCount = Object.values(verification).filter(v => v).length;
    const totalVerifications = Object.keys(verification).length;
    
    if (verifiedCount === totalVerifications) {
      return { status: 'Fully Verified', color: 'bg-green-100 text-green-800' };
    } else if (verifiedCount >= 3) {
      return { status: 'Partially Verified', color: 'bg-blue-100 text-blue-800' };
    } else if (verifiedCount >= 1) {
      return { status: 'Basic Verification', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'Not Verified', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Toggle user status
  const toggleUserStatus = useCallback(async (userId: string, newStatus: UserProfile['status']) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  }, []);

  // Reset user password
  const resetUserPassword = useCallback(async (userId: string) => {
    // Mock password reset
    alert('Password reset link sent to user email');
  }, []);

  // Send verification email
  const sendVerificationEmail = useCallback(async (userId: string) => {
    // Mock verification email
    alert('Verification email sent to user');
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setShowUserDetails(false);
      }
    }
  }, [selectedUser]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              User Management System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive user profiles, verification, and management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowCreateUser(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Create User
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, username, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>

            <select
              value={filters.subscriptionTier}
              onChange={(e) => setFilters(prev => ({ ...prev, subscriptionTier: e.target.value }))}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              {SUBSCRIPTION_TIERS.map(tier => (
                <option key={tier.tier} value={tier.tier}>{tier.name}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Countries</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="UAE">UAE</option>
                  <option value="Egypt">Egypt</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                <select
                  value={filters.verification}
                  onChange={(e) => setFilters(prev => ({ ...prev, verification: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="email">Email Verified</option>
                  <option value="phone">Phone Verified</option>
                  <option value="identity">Identity Verified</option>
                  <option value="business">Business Verified</option>
                </select>
              </div>

              {/* Activity Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasOrders}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasOrders: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Orders</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasProducts}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasProducts: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Products</span>
                  </label>
                </div>
              </div>

              {/* Spending Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Spending: {formatCurrency(filters.minSpent)} - {formatCurrency(filters.maxSpent)}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={filters.minSpent}
                    onChange={(e) => setFilters(prev => ({ ...prev, minSpent: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Min"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={filters.maxSpent}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxSpent: parseInt(e.target.value) || 100000 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  status: '',
                  subscriptionTier: '',
                  verification: '',
                  country: '',
                  joinDateRange: ['', ''],
                  lastLoginRange: ['', ''],
                  hasOrders: false,
                  hasProducts: false,
                  minSpent: 0,
                  maxSpent: 100000,
                  tags: []
                })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Refresh
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              <Upload className="w-3 h-3 inline mr-1" />
              Import Users
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statistics
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => {
              const tierInfo = getSubscriptionTier(user.subscription.tier);
              const verificationInfo = getVerificationStatus(user.verification);
              const TierIcon = tierInfo.icon;

              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.avatar || 'https://via.placeholder.com/40'}
                          alt={user.username}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-400 flex items-center mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.location.city}, {user.location.country}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                    {user.roles.includes('seller') && (
                      <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Seller
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-medium ${tierInfo.color}`}>
                        <TierIcon className="w-3 h-3 mr-1" />
                        {tierInfo.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user.subscription.status === 'active' ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">{user.subscription.status}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${verificationInfo.color}`}>
                      {verificationInfo.status}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {user.verification.email && <CheckCircle className="w-3 h-3 text-green-500" title="Email verified" />}
                      {user.verification.phone && <CheckCircle className="w-3 h-3 text-green-500" title="Phone verified" />}
                      {user.verification.identity && <Shield className="w-3 h-3 text-blue-500" title="Identity verified" />}
                      {user.verification.business && <Award className="w-3 h-3 text-purple-500" title="Business verified" />}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>{user.statistics.totalOrders} orders</div>
                      <div>{formatCurrency(user.statistics.totalSpent, user.preferences.currency)}</div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        {user.statistics.reputation.toFixed(1)} ({user.statistics.reviewsReceived} reviews)
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(user.statistics.lastLogin).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(user.statistics.lastLogin).toLocaleTimeString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                          setEditMode(false);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                          setEditMode(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => resetUserPassword(user.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset Password"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => toggleUserStatus(user.id, 'suspended')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Suspend User"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleUserStatus(user.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                          title="Activate User"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details - {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* User Profile Header */}
              <div className="flex items-start space-x-6 mb-6">
                <div className="flex-shrink-0">
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={selectedUser.avatar || 'https://via.placeholder.com/80'}
                    alt={selectedUser.username}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <p className="text-gray-600">@{selectedUser.username}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedUser.email}
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {selectedUser.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedUser.location.city}, {selectedUser.location.country}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined {new Date(selectedUser.statistics.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['Overview', 'Statistics', 'Verification', 'Security', 'Preferences'].map((tab) => (
                    <button
                      key={tab}
                      className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Overview Tab Content */}
              <div className="space-y-6">
                {/* Subscription Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Subscription</h5>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {(() => {
                        const TierIcon = getSubscriptionTier(selectedUser.subscription.tier).icon;
                        const tierInfo = getSubscriptionTier(selectedUser.subscription.tier);
                        return (
                          <div className={`flex items-center px-3 py-2 rounded-lg ${tierInfo.color}`}>
                            <TierIcon className="w-4 h-4 mr-2" />
                            <span className="font-medium">{tierInfo.name}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Active since {new Date(selectedUser.subscription.startDate).toLocaleDateString()}
                      {selectedUser.subscription.endDate && (
                        <span> • Expires {new Date(selectedUser.subscription.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {selectedUser.statistics.totalOrders}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {formatCurrency(selectedUser.statistics.totalSpent, selectedUser.preferences.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Reputation</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {selectedUser.statistics.reputation.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-orange-600 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Activity Score</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {selectedUser.statistics.activityScore}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    Send Message
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editMode ? 'Save Changes' : 'Edit User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};