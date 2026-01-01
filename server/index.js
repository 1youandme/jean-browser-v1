const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');

const app = express();
const PORT = process.env.PORT || 3001;
const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY));
const supabase = hasSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY)
  : null;
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(() => {});

let jeanRunning = false;
let jeanInterval = null;
let jeanLastRun = null;
let jeanNextRun = null;
let jeanTasks = [];

const scheduleNextRun = () => {
  const now = new Date();
  jeanNextRun = new Date(now.getTime() + 60 * 60 * 1000);
};

const runJeanTasks = async () => {
  jeanLastRun = new Date();
  scheduleNextRun();
  const task = {
    id: Date.now().toString(),
    action: "sync",
    details: "مزامنة الأسعار، الأسهم، الشحنات",
    timestamp: new Date().toISOString(),
  };
  jeanTasks.push(task);
  try {
    await redisClient.set(`jean:last_run`, jeanLastRun.toISOString(), { EX: 3600 });
  } catch {}
  if (supabase) {
    try {
      await supabase.from('jean_runs').insert({
        run_id: task.id,
        action: task.action,
        details: task.details,
        timestamp: task.timestamp
      });
    } catch {}
  }
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline styles for development
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock data storage (in-memory for Phase 1)
const mockData = {
  users: [
    {
      id: '1',
      name: 'Ahmed Mohamed',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      status: 'online',
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c4ca?w=100',
      status: 'away',
      lastSeen: '5 minutes ago',
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Jean AI',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      status: 'online',
      createdAt: new Date()
    }
  ],
  products: [
    {
      id: '1',
      name: 'Wireless Headphones Pro',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
      category: 'Electronics',
      rating: 4.5,
      description: 'Premium noise-canceling wireless headphones',
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Smart Watch Ultra',
      price: 449.99,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300',
      category: 'Electronics',
      rating: 4.8,
      description: 'Advanced fitness and health tracking',
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Organic Coffee Beans',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300',
      category: 'Food',
      rating: 4.2,
      description: 'Premium organic arabica coffee beans',
      inStock: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  transactions: [
    {
      id: '1',
      userId: 'current-user',
      type: 'income',
      amount: 3500,
      currency: 'USD',
      description: 'Monthly Salary',
      category: 'Salary',
      timestamp: new Date(Date.now() - 86400000 * 5),
      status: 'completed',
      balance: 5850.75
    },
    {
      id: '2',
      userId: 'current-user',
      type: 'expense',
      amount: 299.99,
      currency: 'USD',
      description: 'Wireless Headphones Pro',
      category: 'Shopping',
      timestamp: new Date(Date.now() - 86400000 * 3),
      status: 'completed',
      balance: 5550.76
    }
  ],
  orders: [],
  chats: [],
  messages: []
};

// Utility functions
const successResponse = (data, message = 'Success') => ({
  success: true,
  data,
  message
});

const errorResponse = (message, status = 400) => ({
  success: false,
  error: message
});

const paginate = (array, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const results = array.slice(startIndex, endIndex);
  
  return {
    data: results,
    total: array.length,
    page,
    limit,
    hasNext: endIndex < array.length,
    hasPrev: page > 1
  };
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json(successResponse({ status: 'OK', timestamp: new Date() }));
});

// AI Routes (import TypeScript routes)
try {
  const aiRoutes = require('./routes/ai.routes.ts');
  app.use('/api/ai', aiRoutes);
} catch (error) {
  console.log('AI routes not available - TypeScript compilation may be needed');
}

// Marketplace Routes
app.get('/api/products', (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const cacheKey = `products:${page}:${limit}:${category || 'all'}:${search || ''}`;
    (async () => {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.json(successResponse(JSON.parse(cached)));
        }
      } catch {}
      let filtered = [...mockData.products];
      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }
      const paginated = paginate(filtered, parseInt(page), parseInt(limit));
      try {
        await redisClient.set(cacheKey, JSON.stringify(paginated), { EX: 3600 });
      } catch {}
      res.json(successResponse(paginated));
    })();
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = mockData.products.find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json(errorResponse('Product not found'));
    }
    res.json(successResponse(product));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/products/categories', (req, res) => {
  try {
    const categories = [...new Set(mockData.products.map(p => p.category))];
    res.json(successResponse(categories));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
      id: Date.now().toString(),
      userId: 'current-user',
      items,
      totalAmount,
      currency: 'USD',
      status: 'pending',
      shippingAddress,
      paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockData.orders.push(order);
    res.status(201).json(successResponse(order, 'Order created successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/orders', (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    let filtered = [...mockData.orders];
    
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }
    
    const paginated = paginate(filtered, parseInt(page), parseInt(limit));
    res.json(successResponse(paginated));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

// Messenger Routes
app.get('/api/users', (req, res) => {
  try {
    const { search } = req.query;
    let filtered = [...mockData.users];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(successResponse(filtered));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = mockData.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.json(successResponse(user));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.post('/api/chats', (req, res) => {
  try {
    const { participantId } = req.body;
    const chat = {
      id: Date.now().toString(),
      participants: ['current-user', participantId],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockData.chats.push(chat);
    res.status(201).json(successResponse(chat, 'Chat created successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/chats', (req, res) => {
  try {
    res.json(successResponse(mockData.chats));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.post('/api/chats/:id/messages', (req, res) => {
  try {
    const { text } = req.body;
    const message = {
      id: Date.now().toString(),
      senderId: 'current-user',
      receiverId: 'other',
      text,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
      chatId: req.params.id
    };
    
    mockData.messages.push(message);
    res.status(201).json(successResponse(message, 'Message sent successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

// Wallet Routes
app.get('/api/wallet/balance', (req, res) => {
  try {
    const balance = {
      userId: 'current-user',
      balance: 5850.75,
      currency: 'USD',
      updatedAt: new Date()
    };
    res.json(successResponse(balance));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.post('/api/wallet/balance', (req, res) => {
  try {
    const { amount, currency } = req.body;
    const balance = {
      userId: 'current-user',
      balance: amount,
      currency: currency || 'USD',
      updatedAt: new Date()
    };
    res.json(successResponse(balance, 'Balance updated successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/wallet/transactions', (req, res) => {
  try {
    const { page = 1, limit = 10, type, category } = req.query;
    let filtered = [...mockData.transactions];
    
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }
    
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }
    
    const paginated = paginate(filtered, parseInt(page), parseInt(limit));
    res.json(successResponse(paginated));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.post('/api/wallet/transactions', (req, res) => {
  try {
    const { type, amount, currency, description, category } = req.body;
    const transaction = {
      id: Date.now().toString(),
      userId: 'current-user',
      type,
      amount,
      currency: currency || 'USD',
      description,
      category,
      timestamp: new Date(),
      status: 'completed',
      balance: 5850.75 // Would be calculated
    };
    
    mockData.transactions.push(transaction);
    res.status(201).json(successResponse(transaction, 'Transaction created successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/wallet/currencies', (req, res) => {
  try {
    const currencies = [
      { code: 'USD', symbol: '$', rate: 1, flag: '🇺🇸' },
      { code: 'EUR', symbol: '€', rate: 0.92, flag: '🇪🇺' },
      { code: 'AED', symbol: 'د.إ', rate: 3.67, flag: '🇦🇪' },
      { code: 'GBP', symbol: '£', rate: 0.79, flag: '🇬🇧' },
      { code: 'SAR', symbol: '﷼', rate: 3.75, flag: '🇸🇦' }
    ];
    res.json(successResponse(currencies));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
});

app.get('/api/jean/status', (req, res) => {
  res.json(successResponse({
    running: jeanRunning,
    tasks_scheduled: jeanTasks.length,
    last_run: jeanLastRun ? jeanLastRun.toISOString() : null,
    next_run: jeanNextRun ? jeanNextRun.toISOString() : null
  }));
});

app.post('/api/jean/start', async (req, res) => {
  if (!jeanRunning) {
    jeanRunning = true;
    scheduleNextRun();
    jeanInterval = setInterval(runJeanTasks, 60 * 60 * 1000);
    await runJeanTasks();
  }
  res.json(successResponse({ started: true }));
});

app.post('/api/jean/stop', (req, res) => {
  if (jeanInterval) {
    clearInterval(jeanInterval);
    jeanInterval = null;
  }
  jeanRunning = false;
  res.json(successResponse({ stopped: true }));
});

app.get('/api/jean/tasks', (req, res) => {
  res.json(successResponse(jeanTasks));
});

app.post('/api/test/db', async (req, res) => {
  try {
    if (!supabase) {
      return res.json(successResponse({ connected: false }));
    }
    const { error } = await supabase.from('test_connection').select('*').limit(1);
    if (error) {
      return res.json(successResponse({ connected: false }));
    }
    res.json(successResponse({ connected: true }));
  } catch {
    res.json(successResponse({ connected: false }));
  }
});

app.post('/api/test/cache', async (req, res) => {
  try {
    const key = 'health:cache';
    await redisClient.set(key, 'ok', { EX: 60 });
    const val = await redisClient.get(key);
    res.json(successResponse({ connected: val === 'ok' }));
  } catch {
    res.json(successResponse({ connected: false }));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json(errorResponse('Something went wrong!'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json(errorResponse('Route not found'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JeanTrail Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛍️  Marketplace API: http://localhost:${PORT}/api/products`);
  console.log(`💬 Messenger API: http://localhost:${PORT}/api/users`);
  console.log(`💰 Wallet API: http://localhost:${PORT}/api/wallet/balance`);
});

module.exports = app;
