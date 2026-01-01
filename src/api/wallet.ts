import api from './index';
import { Transaction, WalletBalance, Currency, ApiResponse, PaginatedResponse } from '../types';

export const walletApi = {
  // Balance
  getBalance: async (): Promise<ApiResponse<WalletBalance>> => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  updateBalance: async (amount: number, currency: string = 'USD'): Promise<ApiResponse<WalletBalance>> => {
    const response = await api.post('/wallet/balance', { amount, currency });
    return response.data;
  },

  // Transactions
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense';
    category?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<Transaction>>> => {
    const response = await api.get('/wallet/transactions', { params });
    return response.data;
  },

  getTransaction: async (id: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.get(`/wallet/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transaction: {
    type: 'income' | 'expense';
    amount: number;
    currency: string;
    description: string;
    category: string;
  }): Promise<ApiResponse<Transaction>> => {
    const response = await api.post('/wallet/transactions', transaction);
    return response.data;
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
    const response = await api.put(`/wallet/transactions/${id}`, transaction);
    return response.data;
  },

  deleteTransaction: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/wallet/transactions/${id}`);
    return response.data;
  },

  // Currencies
  getCurrencies: async (): Promise<ApiResponse<Currency[]>> => {
    const response = await api.get('/wallet/currencies');
    return response.data;
  },

  getExchangeRate: async (fromCurrency: string, toCurrency: string): Promise<ApiResponse<{ rate: number }>> => {
    const response = await api.get('/wallet/exchange-rate', { 
      params: { from: fromCurrency, to: toCurrency } 
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async (params?: {
    period?: 'week' | 'month' | 'year';
    currency?: string;
  }): Promise<ApiResponse<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionsByCategory: Array<{ category: string; amount: number; count: number }>;
    dailyStats: Array<{ date: string; income: number; expense: number }>;
  }>> => {
    const response = await api.get('/wallet/analytics', { params });
    return response.data;
  },

  // Deposit/Withdrawal
  deposit: async (amount: number, currency: string = 'USD', method: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.post('/wallet/deposit', { amount, currency, method });
    return response.data;
  },

  withdraw: async (amount: number, currency: string = 'USD', method: string): Promise<ApiResponse<Transaction>> => {
    const response = await api.post('/wallet/withdraw', { amount, currency, method });
    return response.data;
  },

  // For Phase 1, localStorage based methods
  getLocalBalance: async (): Promise<ApiResponse<WalletBalance>> => {
    const balance = localStorage.getItem('wallet-balance');
    const selectedCurrency = localStorage.getItem('wallet-currency') || 'USD';
    
    return {
      success: true,
      data: {
        userId: 'current-user',
        balance: balance ? parseFloat(balance) : 5850.75,
        currency: selectedCurrency,
        updatedAt: new Date()
      }
    };
  },

  saveLocalBalance: async (balance: number): Promise<ApiResponse<WalletBalance>> => {
    const selectedCurrency = localStorage.getItem('wallet-currency') || 'USD';
    
    localStorage.setItem('wallet-balance', balance.toString());
    
    return {
      success: true,
      data: {
        userId: 'current-user',
        balance,
        currency: selectedCurrency,
        updatedAt: new Date()
      }
    };
  },

  getLocalTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    const transactions = localStorage.getItem('wallet-transactions');
    return {
      success: true,
      data: transactions ? JSON.parse(transactions) : []
    };
  },

  saveLocalTransactions: async (transactions: Transaction[]): Promise<ApiResponse<Transaction[]>> => {
    localStorage.setItem('wallet-transactions', JSON.stringify(transactions));
    return {
      success: true,
      data: transactions
    };
  },

  createLocalTransaction: async (transaction: {
    type: 'income' | 'expense';
    amount: number;
    currency: string;
    description: string;
    category: string;
  }): Promise<ApiResponse<Transaction>> => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      userId: 'current-user',
      ...transaction,
      timestamp: new Date(),
      status: 'completed',
      balance: 0 // Would be calculated based on previous transactions
    };

    const transactions = localStorage.getItem('wallet-transactions');
    const allTransactions: Transaction[] = transactions ? JSON.parse(transactions) : [];
    
    const updatedTransactions = [newTransaction, ...allTransactions];
    localStorage.setItem('wallet-transactions', JSON.stringify(updatedTransactions));
    
    // Update balance
    const balance = localStorage.getItem('wallet-balance');
    if (balance) {
      const currentBalance = parseFloat(balance);
      const amountInUSD = transaction.currency === 'USD' ? transaction.amount : transaction.amount; // Simplified for Phase 1
      const newBalance = transaction.type === 'income' 
        ? currentBalance + amountInUSD 
        : currentBalance - amountInUSD;
      
      localStorage.setItem('wallet-balance', newBalance.toString());
    }
    
    return {
      success: true,
      data: newTransaction
    };
  }
};