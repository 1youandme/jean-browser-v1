import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  DollarSign,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  BarChart3,
  PieChart,
  Wallet,
  Smartphone,
  QrCode,
  Building,
  Landmark,
  Coins,
  Receipt,
  Calendar,
  Clock,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  Bell,
  BellOff
} from 'lucide-react';

// Types
interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate to USD
  isActive: boolean;
  isDefault: boolean;
  decimalPlaces: number;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'cryptocurrency' | 'cash' | 'check';
  name: string;
  provider: string;
  supportedCurrencies: string[];
  fees: {
    percentage?: number;
    fixed?: number;
    currency: string;
  };
  limits: {
    min: number;
    max: number;
    currency: string;
  };
  processingTime: string;
  availability: string[];
  features: string[];
  isActive: boolean;
  icon: string;
  color: string;
}

interface Transaction {
  id: string;
  reference: string;
  type: 'payment' | 'refund' | 'chargeback' | 'dispute' | 'fee';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  amount: number;
  currency: string;
  usdAmount: number; // Always stored in USD for consistency
  paymentMethod: {
    id: string;
    type: string;
    name: string;
    last4?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  order?: {
    id: string;
    number: string;
    items: number;
  };
  fees: {
    processing: number;
    platform: number;
    total: number;
  };
  netAmount: number;
  description: string;
  metadata: Record<string, any>;
  gateway: {
    provider: string;
    transactionId?: string;
    authorizationCode?: string;
  };
  risk: {
    score: number;
    level: 'low' | 'medium' | 'high';
    flags: string[];
  };
  refunds: {
    amount: number;
    reason: string;
    status: string;
    processedAt?: string;
  }[];
  timeline: TransactionEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TransactionEvent {
  timestamp: string;
  status: string;
  description: string;
  performedBy: string;
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'credit_card' | 'bank_transfer' | 'digital_wallet' | 'cryptocurrency';
  supportedMethods: string[];
  supportedCurrencies: string[];
  configuration: {
    apiKey: string;
    secretKey: string;
    webhookUrl: string;
    environment: 'sandbox' | 'production';
  };
  features: string[];
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  isDefault: boolean;
  isActive: boolean;
  statistics: {
    totalTransactions: number;
    successRate: number;
    averageProcessingTime: number;
  };
}

// Mock data
const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, isActive: true, isDefault: true, decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rate: 3.75, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.12, isActive: true, isDefault: false, decimalPlaces: 2 },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', rate: 0.000023, isActive: false, isDefault: false, decimalPlaces: 8 },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', rate: 0.00034, isActive: false, isDefault: false, decimalPlaces: 8 }
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'visa',
    type: 'credit_card',
    name: 'Visa',
    provider: 'Visa Inc.',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
    fees: { percentage: 2.9, fixed: 0.30, currency: 'USD' },
    limits: { min: 1, max: 50000, currency: 'USD' },
    processingTime: 'Instant',
    availability: ['Worldwide'],
    features: ['3D Secure', 'Chargeback protection', 'Fraud detection'],
    isActive: true,
    icon: '💳',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'mastercard',
    type: 'credit_card',
    name: 'Mastercard',
    provider: 'Mastercard Inc.',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
    fees: { percentage: 2.9, fixed: 0.30, currency: 'USD' },
    limits: { min: 1, max: 50000, currency: 'USD' },
    processingTime: 'Instant',
    availability: ['Worldwide'],
    features: ['3D Secure', 'Chargeback protection', 'Fraud detection'],
    isActive: true,
    icon: '💳',
    color: 'bg-orange-100 text-orange-700'
  },
  {
    id: 'paypal',
    type: 'digital_wallet',
    name: 'PayPal',
    provider: 'PayPal Inc.',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CNY'],
    fees: { percentage: 3.4, fixed: 0.30, currency: 'USD' },
    limits: { min: 1, max: 10000, currency: 'USD' },
    processingTime: 'Instant',
    availability: ['200+ countries'],
    features: ['Buyer protection', 'One-touch checkout', 'Recurring payments'],
    isActive: true,
    icon: '🅿️',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    provider: 'Global Banking Network',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'CNY', 'INR'],
    fees: { fixed: 5, currency: 'USD' },
    limits: { min: 10, max: 1000000, currency: 'USD' },
    processingTime: '1-3 business days',
    availability: ['Worldwide'],
    features: ['High limits', 'Secure', 'Trackable'],
    isActive: true,
    icon: '🏦',
    color: 'bg-green-100 text-green-700'
  },
  {
    id: 'bitcoin',
    type: 'cryptocurrency',
    name: 'Bitcoin',
    provider: 'Bitcoin Network',
    supportedCurrencies: ['BTC', 'USD', 'EUR'],
    fees: { percentage: 1.0, currency: 'USD' },
    limits: { min: 0.001, max: 100, currency: 'BTC' },
    processingTime: '10-60 minutes',
    availability: ['Worldwide'],
    features: ['Decentralized', 'Low fees', 'Anonymous'],
    isActive: true,
    icon: '₿',
    color: 'bg-orange-100 text-orange-700'
  },
  {
    id: 'stcpay',
    type: 'digital_wallet',
    name: 'STC Pay',
    provider: 'Saudi Telecom Company',
    supportedCurrencies: ['SAR'],
    fees: { percentage: 2.5, currency: 'SAR' },
    limits: { min: 1, max: 20000, currency: 'SAR' },
    processingTime: 'Instant',
    availability: ['Saudi Arabia'],
    features: ['Mobile payments', 'QR codes', 'Instant transfer'],
    isActive: true,
    icon: '📱',
    color: 'bg-purple-100 text-purple-700'
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-1',
    reference: 'JEAN-2024-0001',
    type: 'payment',
    status: 'completed',
    amount: 299.99,
    currency: 'USD',
    usdAmount: 299.99,
    paymentMethod: {
      id: 'visa',
      type: 'credit_card',
      name: 'Visa',
      last4: '4242'
    },
    customer: {
      id: 'cust-1',
      name: 'Ahmed Al Rashid',
      email: 'ahmed.rashid@example.com'
    },
    order: {
      id: 'order-1',
      number: 'JEAN-2024-001',
      items: 3
    },
    fees: {
      processing: 8.70,
      platform: 3.00,
      total: 11.70
    },
    netAmount: 288.29,
    description: 'Purchase of wireless earbuds and accessories',
    metadata: {
      ip_address: '192.168.1.1',
      device: 'Mobile',
      browser: 'Chrome'
    },
    gateway: {
      provider: 'Stripe',
      transactionId: 'ch_3O9f9Y2eZvKYlo2C0ABC123',
      authorizationCode: 'AUTH123456'
    },
    risk: {
      score: 15,
      level: 'low',
      flags: []
    },
    refunds: [],
    timeline: [
      {
        timestamp: '2024-01-20T10:30:00Z',
        status: 'created',
        description: 'Payment initiated',
        performedBy: 'customer'
      },
      {
        timestamp: '2024-01-20T10:30:15Z',
        status: 'processing',
        description: 'Payment processing started',
        performedBy: 'system'
      },
      {
        timestamp: '2024-01-20T10:31:22Z',
        status: 'completed',
        description: 'Payment completed successfully',
        performedBy: 'system'
      }
    ],
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:31:22Z',
    completedAt: '2024-01-20T10:31:22Z'
  },
  {
    id: 'txn-2',
    reference: 'JEAN-2024-0002',
    type: 'refund',
    status: 'completed',
    amount: -89.99,
    currency: 'SAR',
    usdAmount: -24.00,
    paymentMethod: {
      id: 'stcpay',
      type: 'digital_wallet',
      name: 'STC Pay'
    },
    customer: {
      id: 'cust-2',
      name: 'Fatima Salem',
      email: 'fatima.salem@example.com'
    },
    order: {
      id: 'order-2',
      number: 'JEAN-2024-002',
      items: 1
    },
    fees: {
      processing: -2.25,
      platform: 0,
      total: -2.25
    },
    netAmount: -87.74,
    description: 'Refund for returned skincare product',
    metadata: {
      refund_reason: 'Product returned - customer not satisfied'
    },
    gateway: {
      provider: 'STC Pay',
      transactionId: 'REF789012'
    },
    risk: {
      score: 5,
      level: 'low',
      flags: []
    },
    refunds: [],
    timeline: [
      {
        timestamp: '2024-01-19T14:20:00Z',
        status: 'requested',
        description: 'Refund requested by customer',
        performedBy: 'customer'
      },
      {
        timestamp: '2024-01-19T14:45:00Z',
        status: 'approved',
        description: 'Refund approved by merchant',
        performedBy: 'admin'
      },
      {
        timestamp: '2024-01-19T15:10:00Z',
        status: 'completed',
        description: 'Refund processed successfully',
        performedBy: 'system'
      }
    ],
    createdAt: '2024-01-19T14:20:00Z',
    updatedAt: '2024-01-19T15:10:00Z',
    completedAt: '2024-01-19T15:10:00Z'
  }
];

const PAYMENT_GATEWAYS: PaymentGateway[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    type: 'credit_card',
    supportedMethods: ['visa', 'mastercard', 'amex', 'discover'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED'],
    configuration: {
      apiKey: 'sk_test_...',
      secretKey: 'sk_live_...',
      webhookUrl: 'https://api.jeantrail.com/webhooks/stripe',
      environment: 'production'
    },
    features: ['3D Secure', 'Chargeback protection', 'Fraud detection', 'Subscription management'],
    fees: { percentage: 2.9, fixed: 0.30, currency: 'USD' },
    isDefault: true,
    isActive: true,
    statistics: {
      totalTransactions: 15420,
      successRate: 98.5,
      averageProcessingTime: 1.2
    }
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'digital_wallet',
    supportedMethods: ['paypal', 'venmo', 'credit_card'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CNY'],
    configuration: {
      apiKey: 'paypal_client_id',
      secretKey: 'paypal_client_secret',
      webhookUrl: 'https://api.jeantrail.com/webhooks/paypal',
      environment: 'production'
    },
    features: ['Buyer protection', 'One-touch checkout', 'Recurring payments', 'Mass payments'],
    fees: { percentage: 3.4, fixed: 0.30, currency: 'USD' },
    isDefault: false,
    isActive: true,
    statistics: {
      totalTransactions: 8934,
      successRate: 97.8,
      averageProcessingTime: 2.1
    }
  }
];

export const PaymentSystem: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);
  const [currencies, setCurrencies] = useState<Currency[]>(CURRENCIES);
  const [gateways, setGateways] = useState<PaymentGateway[]>(PAYMENT_GATEWAYS);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'methods' | 'currencies' | 'gateways'>('transactions');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'failed':
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <RefreshCw className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'refunded': return <ArrowDownRight className="w-4 h-4" />;
      case 'failed':
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    const currencyInfo = currencies.find(c => c.code === currency);
    if (!currencyInfo) return `${currency} ${amount.toFixed(2)}`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces
    }).format(amount);
  };

  // Get risk level color
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        transaction.reference.toLowerCase().includes(query) ||
        transaction.customer.name.toLowerCase().includes(query) ||
        transaction.customer.email.toLowerCase().includes(query) ||
        transaction.order?.number.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (statusFilter && transaction.status !== statusFilter) return false;
    if (currencyFilter && transaction.currency !== currencyFilter) return false;
    if (methodFilter && transaction.paymentMethod.type !== methodFilter) return false;

    return true;
  });

  // Calculate statistics
  const totalRevenue = transactions
    .filter(t => t.status === 'completed' && t.type === 'payment')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const totalRefunds = transactions
    .filter(t => t.status === 'completed' && t.type === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.netAmount), 0);

  const successRate = transactions.length > 0 
    ? (transactions.filter(t => t.status === 'completed').length / transactions.length) * 100 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Multi-Currency Payment System
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Global payment processing with multiple currencies and methods
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Plus className="w-4 h-4 inline mr-2" />
              New Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="px-6 py-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totalRefunds)}
                </p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {successRate.toFixed(1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Methods</p>
                <p className="text-xl font-bold text-purple-600">
                  {paymentMethods.filter(m => m.isActive).length}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-8">
          {[
            { id: 'transactions', label: 'Transactions', count: transactions.length },
            { id: 'methods', label: 'Payment Methods', count: paymentMethods.length },
            { id: 'currencies', label: 'Currencies', count: currencies.filter(c => c.isActive).length },
            { id: 'gateways', label: 'Gateways', count: gateways.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by reference, customer, or order..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="disputed">Disputed</option>
                </select>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Currencies</option>
                  {currencies.filter(c => c.isActive).map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </option>
                  ))}
                </select>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Methods</option>
                  {Array.from(new Set(paymentMethods.map(m => m.type))).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transaction.reference}
                        </div>
                        {transaction.order && (
                          <div className="text-gray-500">Order {transaction.order.number}</div>
                        )}
                        <div className="text-gray-500 capitalize">{transaction.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{transaction.customer.name}</div>
                        <div className="text-gray-500">{transaction.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">
                          {paymentMethods.find(m => m.id === transaction.paymentMethod.id)?.icon}
                        </span>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{transaction.paymentMethod.name}</div>
                          {transaction.paymentMethod.last4 && (
                            <div className="text-gray-500">•••• {transaction.paymentMethod.last4}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-semibold ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                        <div className="text-gray-500">
                          {formatCurrency(transaction.netAmount, 'USD')} net
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        <span className="mr-1">{getStatusIcon(transaction.status)}</span>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(transaction.risk.level)}`}>
                          {transaction.risk.level} ({transaction.risk.score})
                        </span>
                        {transaction.risk.flags.length > 0 && (
                          <div className="text-xs text-orange-600">
                            {transaction.risk.flags.length} flags
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowTransactionDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Download Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {transaction.status === 'completed' && transaction.type === 'payment' && (
                          <button
                            className="text-orange-600 hover:text-orange-900"
                            title="Issue Refund"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentMethods.map(method => (
              <div key={method.id} className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                method.isActive ? 'border-gray-200' : 'border-gray-300 opacity-75'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{method.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {method.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{method.provider}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{method.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing:</span>
                    <span className="font-medium">{method.processingTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Limits:</span>
                    <span className="font-medium">
                      {formatCurrency(method.limits.min, method.limits.currency)} - {formatCurrency(method.limits.max, method.limits.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fees:</span>
                    <span className="font-medium">
                      {method.fees.percentage ? `${method.fees.percentage}%` : ''}
                      {method.fees.percentage && method.fees.fixed ? ' + ' : ''}
                      {method.fees.fixed ? formatCurrency(method.fees.fixed, method.fees.currency) : ''}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Supported Currencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {method.supportedCurrencies.slice(0, 4).map(currency => (
                      <span key={currency} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {currency}
                      </span>
                    ))}
                    {method.supportedCurrencies.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{method.supportedCurrencies.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Configure
                  </button>
                  <button className={`p-2 rounded-lg ${
                    method.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                  }`}>
                    {method.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Transaction Details - {selectedTransaction.reference}
                </h3>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">{selectedTransaction.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedTransaction.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gateway:</span>
                      <span className="font-medium">{selectedTransaction.gateway.provider}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Financial Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fees:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(selectedTransaction.fees.processing, selectedTransaction.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fees:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(selectedTransaction.fees.platform, selectedTransaction.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net Amount:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedTransaction.netAmount, selectedTransaction.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer and Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedTransaction.customer.name}</p>
                    <p className="text-gray-600">{selectedTransaction.customer.email}</p>
                  </div>
                </div>

                {selectedTransaction.order && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{selectedTransaction.order.number}</p>
                      <p className="text-gray-600">{selectedTransaction.order.items} items</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Assessment */}
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(selectedTransaction.risk.level)}`}>
                      {selectedTransaction.risk.level.toUpperCase()} RISK
                    </span>
                    <p className="text-sm text-gray-600 mt-1">Risk Score: {selectedTransaction.risk.score}/100</p>
                  </div>
                  <div className="text-right">
                    <Shield className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                {selectedTransaction.risk.flags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">Risk Flags:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTransaction.risk.flags.map((flag, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Timeline</h4>
                <div className="space-y-3">
                  {selectedTransaction.timeline.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 capitalize">{event.status}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-500">by {event.performedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Receipt className="w-4 h-4 inline mr-2" />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};