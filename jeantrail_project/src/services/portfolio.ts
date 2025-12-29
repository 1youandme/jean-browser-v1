// Portfolio Aggregator Service Interface and Implementation
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  accounts: Account[];
  totalValue: number;
  baseCurrency: string;
  lastUpdated: Date;
  createdAt: Date;
  settings: PortfolioSettings;
}

export interface Account {
  id: string;
  institutionId: string;
  institutionName: string;
  type: AccountType;
  name: string;
  balance: number;
  currency: string;
  balanceInBaseCurrency: number;
  holdings: Holding[];
  isActive: boolean;
  lastSync: Date;
  syncStatus: 'success' | 'pending' | 'error';
  metadata: AccountMetadata;
}

export type AccountType = 
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'investment'
  | 'retirement'
  | 'crypto'
  | 'loan'
  | 'mortgage'
  | 'property'
  | 'other';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currentPriceInBaseCurrency: number;
  marketValue: number;
  marketValueInBaseCurrency: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  assetClass: AssetClass;
  sector?: string;
  region?: string;
  lastPriceUpdate: Date;
}

export type AssetClass = 
  | 'stocks'
  | 'bonds'
  | 'real_estate'
  | 'commodities'
  | 'crypto'
  | 'cash'
  | 'alternative'
  | 'other';

export interface AccountMetadata {
  accountNumber?: string;
  routingNumber?: string;
  interestRate?: number;
  creditLimit?: number;
  availableCredit?: number;
  nextPaymentDate?: Date;
  minimumPayment?: number;
  accountOpenDate?: Date;
  maturityDate?: Date;
}

export interface PortfolioSettings {
  autoSync: boolean;
  syncFrequency: number; // in hours
  alertThresholds: AlertThresholds;
  privacy: PrivacySettings;
  display: DisplaySettings;
}

export interface AlertThresholds {
  priceChange: number; // percentage
  balanceChange: number; // amount
  newTransaction: number; // amount
  accountLowBalance: number; // amount
  creditCardHighUsage: number; // percentage
}

export interface PrivacySettings {
  shareAnonymousData: boolean;
  showNetWorth: boolean;
  showAccountDetails: boolean;
  showTransactions: boolean;
}

export interface DisplaySettings {
  defaultCurrency: string;
  showPercentages: boolean;
  showAbsoluteValues: boolean;
  defaultTimeRange: TimeRange;
  chartType: 'line' | 'bar' | 'pie' | 'area';
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  type: TransactionType;
  amount: number;
  currency: string;
  amountInBaseCurrency: number;
  description: string;
  category?: string;
  date: Date;
  balance?: number;
  pending: boolean;
  metadata: TransactionMetadata;
}

export type TransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'purchase'
  | 'sale'
  | 'transfer_in'
  | 'transfer_out'
  | 'dividend'
  | 'interest'
  | 'fee'
  | 'payment'
  | 'refund'
  | 'other';

export interface TransactionMetadata {
  merchant?: string;
  location?: string;
  reference?: string;
  tags?: string[];
  attachments?: string[];
  recurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  alpha?: number;
  beta?: number;
  timeWeightedReturn: number;
  moneyWeightedReturn: number;
}

export interface AssetAllocation {
  assetClass: AssetClass;
  value: number;
  percentage: number;
  targetPercentage?: number;
  deviation: number;
  holdings: Holding[];
}

export interface Institution {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  supportedAccountTypes: AccountType[];
  connectionMethod: 'plaid' | 'ofx' | 'api' | 'manual';
  features: InstitutionFeatures;
  isActive: boolean;
}

export interface InstitutionFeatures {
  realTimeData: boolean;
  historicalData: boolean;
  transactions: boolean;
  transfers: boolean;
  billPay: boolean;
  investments: boolean;
}

export interface PortfolioAggregatorService {
  // Portfolio management
  getPortfolios: () => Promise<Portfolio[]>;
  getPortfolio: (id: string) => Promise<Portfolio>;
  createPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<Portfolio>;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => Promise<Portfolio>;
  deletePortfolio: (id: string) => Promise<void>;
  
  // Account management
  getAccounts: (portfolioId?: string) => Promise<Account[]>;
  getAccount: (id: string) => Promise<Account>;
  addAccount: (portfolioId: string, institutionId: string, credentials: AccountCredentials) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  removeAccount: (id: string) => Promise<void>;
  syncAccount: (id: string) => Promise<Account>;
  syncAllAccounts: (portfolioId?: string) => Promise<void>;
  
  // Institution management
  getInstitutions: () => Promise<Institution[]>;
  getInstitution: (id: string) => Promise<Institution>;
  searchInstitutions: (query: string) => Promise<Institution[]>;
  
  // Transactions
  getTransactions: (accountId?: string, filters?: TransactionFilters) => Promise<Transaction[]>;
  getTransaction: (id: string) => Promise<Transaction>;
  categorizeTransaction: (transactionId: string, category: string) => Promise<void>;
  addTransactionTag: (transactionId: string, tag: string) => Promise<void>;
  removeTransactionTag: (transactionId: string, tag: string) => Promise<void>;
  
  // Holdings and performance
  getHoldings: (portfolioId?: string) => Promise<Holding[]>;
  getHolding: (id: string) => Promise<Holding>;
  getPerformanceMetrics: (portfolioId: string, timeRange?: TimeRange) => Promise<PerformanceMetrics>;
  getHistoricalPerformance: (portfolioId: string, timeRange: TimeRange) => Promise<PerformanceDataPoint[]>;
  
  // Asset allocation
  getAssetAllocation: (portfolioId: string) => Promise<AssetAllocation[]>;
  getTargetAssetAllocation: (portfolioId: string) => Promise<AssetAllocation[]>;
  setTargetAssetAllocation: (portfolioId: string, allocation: Omit<AssetAllocation, 'value' | 'percentage' | 'deviation' | 'holdings'>[]) => Promise<void>;
  getRebalancingRecommendations: (portfolioId: string) => Promise<RebalancingRecommendation[]>;
  
  // Analytics and insights
  getPortfolioSummary: (portfolioId: string) => Promise<PortfolioSummary>;
  getSpendingAnalysis: (portfolioId: string, timeRange?: TimeRange) => Promise<SpendingAnalysis>;
  getNetWorthTrend: (portfolioId: string, timeRange: TimeRange) => Promise<NetWorthDataPoint[]>;
  getIncomeAnalysis: (portfolioId: string, timeRange?: TimeRange) => Promise<IncomeAnalysis>;
  getExpenseAnalysis: (portfolioId: string, timeRange?: TimeRange) => Promise<ExpenseAnalysis>;
  
  // Goals and planning
  getGoals: (portfolioId: string) => Promise<FinancialGoal[]>;
  createGoal: (portfolioId: string, goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => Promise<FinancialGoal>;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<FinancialGoal>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalProgress: (goalId: string) => Promise<GoalProgress>;
  
  // Alerts and notifications
  getAlerts: (portfolioId?: string) => Promise<Alert[]>;
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => Promise<Alert>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<Alert>;
  deleteAlert: (id: string) => Promise<void>;
  
  // Reports and exports
  generateReport: (portfolioId: string, reportType: ReportType, filters?: ReportFilters) => Promise<Report>;
  exportData: (portfolioId: string, format: 'csv' | 'json' | 'pdf', filters?: ExportFilters) => Promise<Blob>;
  
  // Budget management
  getBudgets: (portfolioId: string) => Promise<Budget[]>;
  createBudget: (portfolioId: string, budget: Omit<Budget, 'id' | 'createdAt'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetPerformance: (budgetId: string, timeRange?: TimeRange) => Promise<BudgetPerformance>;
}

export interface AccountCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  accessToken?: string;
  accountId?: string;
  // Additional institution-specific credentials
  [key: string]: any;
}

export interface TransactionFilters {
  type?: TransactionType[];
  category?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
  tags?: string[];
}

export interface PerformanceDataPoint {
  date: Date;
  value: number;
  return?: number;
}

export interface RebalancingRecommendation {
  assetClass: AssetClass;
  currentAllocation: number;
  targetAllocation: number;
  difference: number;
  action: 'buy' | 'sell';
  amount: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashBalance: number;
  investmentValue: number;
  realEstateValue: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  retirementProgress: number;
  netWorthChange: {
    amount: number;
    percentage: number;
    period: TimeRange;
  };
}

export interface SpendingAnalysis {
  totalSpending: number;
  spendingByCategory: CategorySpending[];
  spendingByMonth: MonthlySpending[];
  topExpenses: Transaction[];
  averageDailySpending: number;
  budgetVariance: BudgetVariance[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageTransaction: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlySpending {
  month: string;
  amount: number;
  change: number;
  changePercentage: number;
}

export interface BudgetVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export interface NetWorthDataPoint {
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface IncomeAnalysis {
  totalIncome: number;
  incomeBySource: IncomeSource[];
  incomeTrend: MonthlyIncome[];
  averageMonthlyIncome: number;
  yearToDateIncome: number;
  projectedAnnualIncome: number;
}

export interface IncomeSource {
  source: string;
  amount: number;
  percentage: number;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'irregular';
  stability: 'stable' | 'variable' | 'uncertain';
}

export interface MonthlyIncome {
  month: string;
  amount: number;
  change: number;
  changePercentage: number;
}

export interface ExpenseAnalysis {
  totalExpenses: number;
  expensesByCategory: CategoryExpenses[];
  fixedVsVariable: {
    fixed: number;
    variable: number;
    percentage: number;
  };
  expensesTrend: MonthlyExpenses[];
  averageMonthlyExpenses: number;
  largestExpenseCategories: string[];
}

export interface CategoryExpenses {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyExpenses {
  month: string;
  amount: number;
  change: number;
  changePercentage: number;
}

export interface FinancialGoal {
  id: string;
  portfolioId: string;
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  autoContribution: boolean;
  contributionAmount: number;
  contributionFrequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export type GoalType = 
  | 'retirement'
  | 'emergency_fund'
  | 'house_purchase'
  | 'education'
  | 'car_purchase'
  | 'vacation'
  | 'debt_payoff'
  | 'investment'
  | 'savings'
  | 'other';

export interface GoalProgress {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  percentageComplete: number;
  amountRemaining: number;
  timeRemaining: number; // in days
  onTrack: boolean;
  projectedCompletionDate: Date;
  monthlyContributionNeeded: number;
  recommendations: string[];
}

export interface Alert {
  id: string;
  portfolioId?: string;
  accountId?: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  conditions: AlertCondition[];
}

export type AlertType = 
  | 'balance_threshold'
  | 'transaction_amount'
  | 'price_change'
  | 'goal_progress'
  | 'budget_variance'
  | 'account_sync_error'
  | 'market_event'
  | 'rebalancing_needed'
  | 'other';

export interface AlertCondition {
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  value: any;
  description: string;
}

export type ReportType = 
  | 'portfolio_summary'
  | 'performance_report'
  | 'asset_allocation'
  | 'income_expense'
  | 'net_worth_trend'
  | 'tax_summary'
  | 'investment_analysis'
  | 'custom';

export interface ReportFilters {
  dateRange?: TimeRange;
  accounts?: string[];
  categories?: string[];
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
  data: any;
  charts?: ChartData[];
  summary: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
}

export interface ExportFilters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  accounts?: string[];
  includeTransactions?: boolean;
  includeHoldings?: boolean;
  includePerformance?: boolean;
}

export interface Budget {
  id: string;
  portfolioId: string;
  name: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isActive: boolean;
  alertThreshold?: number;
  createdAt: Date;
}

export interface BudgetPerformance {
  budgetId: string;
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  onTrack: boolean;
  dailyAverageSpending: number;
  projectedSpending: number;
  recommendations: string[];
}

class PortfolioAggregatorServiceImpl implements PortfolioAggregatorService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getPortfolios(): Promise<Portfolio[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios`);
    if (!response.ok) throw new Error('Failed to get portfolios');
    return response.json();
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${id}`);
    if (!response.ok) throw new Error('Failed to get portfolio');
    return response.json();
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Portfolio> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(portfolio),
    });
    if (!response.ok) throw new Error('Failed to create portfolio');
    return response.json();
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>): Promise<Portfolio> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update portfolio');
    return response.json();
  }

  async deletePortfolio(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete portfolio');
  }

  async getAccounts(portfolioId?: string): Promise<Account[]> {
    const params = portfolioId ? `?portfolioId=${portfolioId}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts${params}`);
    if (!response.ok) throw new Error('Failed to get accounts');
    return response.json();
  }

  async getAccount(id: string): Promise<Account> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts/${id}`);
    if (!response.ok) throw new Error('Failed to get account');
    return response.json();
  }

  async addAccount(portfolioId: string, institutionId: string, credentials: AccountCredentials): Promise<Account> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionId, credentials }),
    });
    if (!response.ok) throw new Error('Failed to add account');
    return response.json();
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
  }

  async removeAccount(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove account');
  }

  async syncAccount(id: string): Promise<Account> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts/${id}/sync`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync account');
    return response.json();
  }

  async syncAllAccounts(portfolioId?: string): Promise<void> {
    const params = portfolioId ? `?portfolioId=${portfolioId}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/accounts/sync-all${params}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync all accounts');
  }

  async getInstitutions(): Promise<Institution[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/institutions`);
    if (!response.ok) throw new Error('Failed to get institutions');
    return response.json();
  }

  async getInstitution(id: string): Promise<Institution> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/institutions/${id}`);
    if (!response.ok) throw new Error('Failed to get institution');
    return response.json();
  }

  async searchInstitutions(query: string): Promise<Institution[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/institutions/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search institutions');
    return response.json();
  }

  async getTransactions(accountId?: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([subKey, subValue]) => {
              params.append(`${key}.${subKey}`, String(subValue));
            });
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/portfolio/transactions?${params}`);
    if (!response.ok) throw new Error('Failed to get transactions');
    return response.json();
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/transactions/${id}`);
    if (!response.ok) throw new Error('Failed to get transaction');
    return response.json();
  }

  async categorizeTransaction(transactionId: string, category: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/transactions/${transactionId}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (!response.ok) throw new Error('Failed to categorize transaction');
  }

  async addTransactionTag(transactionId: string, tag: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/transactions/${transactionId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    if (!response.ok) throw new Error('Failed to add transaction tag');
  }

  async removeTransactionTag(transactionId: string, tag: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/transactions/${transactionId}/tags/${tag}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove transaction tag');
  }

  async getHoldings(portfolioId?: string): Promise<Holding[]> {
    const params = portfolioId ? `?portfolioId=${portfolioId}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/holdings${params}`);
    if (!response.ok) throw new Error('Failed to get holdings');
    return response.json();
  }

  async getHolding(id: string): Promise<Holding> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/holdings/${id}`);
    if (!response.ok) throw new Error('Failed to get holding');
    return response.json();
  }

  async getPerformanceMetrics(portfolioId: string, timeRange?: TimeRange): Promise<PerformanceMetrics> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/performance${params}`);
    if (!response.ok) throw new Error('Failed to get performance metrics');
    return response.json();
  }

  async getHistoricalPerformance(portfolioId: string, timeRange: TimeRange): Promise<PerformanceDataPoint[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/performance/history?timeRange=${timeRange}`);
    if (!response.ok) throw new Error('Failed to get historical performance');
    return response.json();
  }

  async getAssetAllocation(portfolioId: string): Promise<AssetAllocation[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/allocation`);
    if (!response.ok) throw new Error('Failed to get asset allocation');
    return response.json();
  }

  async getTargetAssetAllocation(portfolioId: string): Promise<AssetAllocation[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/allocation/target`);
    if (!response.ok) throw new Error('Failed to get target asset allocation');
    return response.json();
  }

  async setTargetAssetAllocation(portfolioId: string, allocation: Omit<AssetAllocation, 'value' | 'percentage' | 'deviation' | 'holdings'>[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/allocation/target`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocation }),
    });
    if (!response.ok) throw new Error('Failed to set target asset allocation');
  }

  async getRebalancingRecommendations(portfolioId: string): Promise<RebalancingRecommendation[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/rebalancing`);
    if (!response.ok) throw new Error('Failed to get rebalancing recommendations');
    return response.json();
  }

  async getPortfolioSummary(portfolioId: string): Promise<PortfolioSummary> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/summary`);
    if (!response.ok) throw new Error('Failed to get portfolio summary');
    return response.json();
  }

  async getSpendingAnalysis(portfolioId: string, timeRange?: TimeRange): Promise<SpendingAnalysis> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/analysis/spending${params}`);
    if (!response.ok) throw new Error('Failed to get spending analysis');
    return response.json();
  }

  async getNetWorthTrend(portfolioId: string, timeRange: TimeRange): Promise<NetWorthDataPoint[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/net-worth/trend?timeRange=${timeRange}`);
    if (!response.ok) throw new Error('Failed to get net worth trend');
    return response.json();
  }

  async getIncomeAnalysis(portfolioId: string, timeRange?: TimeRange): Promise<IncomeAnalysis> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/analysis/income${params}`);
    if (!response.ok) throw new Error('Failed to get income analysis');
    return response.json();
  }

  async getExpenseAnalysis(portfolioId: string, timeRange?: TimeRange): Promise<ExpenseAnalysis> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/analysis/expenses${params}`);
    if (!response.ok) throw new Error('Failed to get expense analysis');
    return response.json();
  }

  async getGoals(portfolioId: string): Promise<FinancialGoal[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/goals`);
    if (!response.ok) throw new Error('Failed to get goals');
    return response.json();
  }

  async createGoal(portfolioId: string, goal: Omit<FinancialGoal, 'id' | 'createdAt'>): Promise<FinancialGoal> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) throw new Error('Failed to create goal');
    return response.json();
  }

  async updateGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update goal');
    return response.json();
  }

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/goals/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete goal');
  }

  async getGoalProgress(goalId: string): Promise<GoalProgress> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/goals/${goalId}/progress`);
    if (!response.ok) throw new Error('Failed to get goal progress');
    return response.json();
  }

  async getAlerts(portfolioId?: string): Promise<Alert[]> {
    const params = portfolioId ? `?portfolioId=${portfolioId}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/alerts${params}`);
    if (!response.ok) throw new Error('Failed to get alerts');
    return response.json();
  }

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    if (!response.ok) throw new Error('Failed to create alert');
    return response.json();
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update alert');
    return response.json();
  }

  async deleteAlert(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/alerts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete alert');
  }

  async generateReport(portfolioId: string, reportType: ReportType, filters?: ReportFilters): Promise<Report> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: reportType, filters }),
    });
    if (!response.ok) throw new Error('Failed to generate report');
    return response.json();
  }

  async exportData(portfolioId: string, format: 'csv' | 'json' | 'pdf', filters?: ExportFilters): Promise<Blob> {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/export?${params}`);
    if (!response.ok) throw new Error('Failed to export data');
    return response.blob();
  }

  async getBudgets(portfolioId: string): Promise<Budget[]> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/budgets`);
    if (!response.ok) throw new Error('Failed to get budgets');
    return response.json();
  }

  async createBudget(portfolioId: string, budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/portfolios/${portfolioId}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    if (!response.ok) throw new Error('Failed to create budget');
    return response.json();
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update budget');
    return response.json();
  }

  async deleteBudget(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/portfolio/budgets/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete budget');
  }

  async getBudgetPerformance(budgetId: string, timeRange?: TimeRange): Promise<BudgetPerformance> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/portfolio/budgets/${budgetId}/performance${params}`);
    if (!response.ok) throw new Error('Failed to get budget performance');
    return response.json();
  }
}

export const portfolioAggregatorService = new PortfolioAggregatorServiceImpl();
export const usePortfolioAggregatorService = () => portfolioAggregatorService;