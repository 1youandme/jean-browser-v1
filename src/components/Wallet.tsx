import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Minus, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, DollarSign, Euro, Settings, Download, Upload } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface Currency {
  code: string;
  symbol: string;
  rate: number;
  flag: string;
}

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState(5850.75);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcValue, setCalcValue] = useState('');
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    currency: 'USD',
    description: '',
    category: ''
  });

  // Exchange rates (mock data)
  const currencies: Currency[] = [
    { code: 'USD', symbol: '$', rate: 1, flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', rate: 0.92, flag: '🇪🇺' },
    { code: 'AED', symbol: 'د.إ', rate: 3.67, flag: '🇦🇪' },
    { code: 'GBP', symbol: '£', rate: 0.79, flag: '🇬🇧' },
    { code: 'SAR', symbol: '﷼', rate: 3.75, flag: '🇸🇦' },
    { code: 'BTC', symbol: '₿', rate: 0.000023, flag: '₿' },
    { code: 'ETH', symbol: 'Ξ', rate: 0.00033, flag: 'Ξ' }
  ];

  const categories = [
    'Food & Dining',
    'Shopping',
    'Transport',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Salary',
    'Investment',
    'Other'
  ];

  // Mock transactions data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 3500,
        currency: 'USD',
        description: 'Monthly Salary',
        category: 'Salary',
        timestamp: new Date(Date.now() - 86400000 * 5),
        status: 'completed'
      },
      {
        id: '2',
        type: 'expense',
        amount: 299.99,
        currency: 'USD',
        description: 'Wireless Headphones Pro',
        category: 'Shopping',
        timestamp: new Date(Date.now() - 86400000 * 3),
        status: 'completed'
      },
      {
        id: '3',
        type: 'expense',
        amount: 45.50,
        currency: 'USD',
        description: 'Restaurant Dinner',
        category: 'Food & Dining',
        timestamp: new Date(Date.now() - 86400000 * 2),
        status: 'completed'
      },
      {
        id: '4',
        type: 'income',
        amount: 250,
        currency: 'USD',
        description: 'Freelance Project',
        category: 'Investment',
        timestamp: new Date(Date.now() - 86400000),
        status: 'completed'
      },
      {
        id: '5',
        type: 'expense',
        amount: 89.99,
        currency: 'USD',
        description: 'Laptop Stand Pro',
        category: 'Shopping',
        timestamp: new Date(Date.now() - 3600000 * 12),
        status: 'pending'
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  // Load data from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem('wallet-balance');
    const savedTransactions = localStorage.getItem('wallet-transactions');
    
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('wallet-balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('wallet-transactions', JSON.stringify(transactions));
  }, [transactions]);

  const getCurrentCurrency = () => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0];
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    const from = currencies.find(c => c.code === fromCurrency);
    const to = currencies.find(c => c.code === toCurrency);
    if (!from || !to) return amount;
    return (amount / from.rate) * to.rate;
  };

  const getBalanceInCurrency = () => {
    return convertCurrency(balance, 'USD', selectedCurrency);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, selectedCurrency), 0);
  };

  const getTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, selectedCurrency), 0);
  };

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) {
      alert('Please fill all fields');
      return;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      currency: newTransaction.currency,
      description: newTransaction.description,
      category: newTransaction.category,
      timestamp: new Date(),
      status: 'completed'
    };

    // Convert to USD for balance calculation
    const amountInUSD = convertCurrency(transaction.amount, transaction.currency, 'USD');
    
    if (transaction.type === 'income') {
      setBalance(prev => prev + amountInUSD);
    } else {
      setBalance(prev => prev - amountInUSD);
    }

    setTransactions(prev => [transaction, ...prev]);
    setNewTransaction({
      type: 'expense',
      amount: '',
      currency: 'USD',
      description: '',
      category: ''
    });
    setShowAddTransaction(false);
  };

  const handleCalcButton = (value: string) => {
    if (value === 'C') {
      setCalcValue('');
    } else if (value === '=') {
      try {
        const result = eval(calcValue);
        setCalcValue(result.toString());
      } catch {
        setCalcValue('Error');
      }
    } else {
      setCalcValue(prev => prev + value);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const currentCurrency = getCurrentCurrency();
    const amount = convertCurrency(transaction.amount, transaction.currency, selectedCurrency);
    const isIncome = transaction.type === 'income';

    return (
      <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
            {isIncome ? (
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{transaction.description}</p>
            <p className="text-sm text-gray-500">
              {transaction.category} • {formatDate(transaction.timestamp)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}{currentCurrency.symbol}{amount.toFixed(2)}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full ${
            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {transaction.status}
          </span>
        </div>
      </div>
    );
  };

  const currentCurrency = getCurrentCurrency();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Wallet className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">JeanTrail Wallet</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.code}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Calculator"
              >
                <DollarSign className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Total Balance</h3>
              <Wallet className="w-8 h-8 text-white/80" />
            </div>
            <p className="text-3xl font-bold mb-2">
              {currentCurrency.flag} {currentCurrency.symbol}{getBalanceInCurrency().toFixed(2)}
            </p>
            <p className="text-sm text-white/80">≈ ${balance.toFixed(2)} USD</p>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {currentCurrency.symbol}{getTotalIncome().toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </div>

          <div className="bg-white rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Total Expense</h3>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600 mb-2">
              {currentCurrency.symbol}{getTotalExpense().toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowAddTransaction(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
          <button className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Deposit
          </button>
          <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Withdraw
          </button>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="divide-y">
            {transactions.map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Add Transaction</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      newTransaction.type === 'income'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      newTransaction.type === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={newTransaction.currency}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Enter description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowAddTransaction(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTransaction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Calculator</h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-100 p-4 rounded-lg mb-4 text-right">
                <input
                  type="text"
                  value={calcValue}
                  readOnly
                  className="w-full bg-transparent text-xl font-semibold text-right outline-none"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'].map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleCalcButton(btn)}
                    className={`p-3 rounded-lg font-medium transition-colors ${
                      btn === '=' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      btn === 'C' ? 'bg-red-600 text-white hover:bg-red-700' :
                      ['/', '*', '-', '+'].includes(btn) ? 'bg-gray-200 hover:bg-gray-300' :
                      'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;