import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Globe,
  Activity,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Calendar,
  MapPin,
  MessageSquare,
  Bot,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Server,
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Wind
} from 'lucide-react';

// Types
interface UserStats {
  total: number;
  active: number;
  new: number;
  premium: number;
  growth: number;
}

interface ProductStats {
  total: number;
  active: number;
  sold: number;
  revenue: number;
  pending: number;
}

interface SystemStats {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: number;
  services: number;
}

interface UserHeatmapData {
  city: string;
  country: string;
  users: number;
  growth: number;
  latitude: number;
  longitude: number;
}

interface AgentStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy' | 'maintenance';
  tasks: number;
  performance: number;
  lastActivity: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'inactive' | 'sold' | 'pending';
  seller: string;
  created: string;
  views: number;
  sales: number;
}

// Mock data (replace with real API calls)
const mockUserStats: UserStats = {
  total: 15420,
  active: 8934,
  new: 342,
  premium: 2847,
  growth: 12.5
};

const mockProductStats: ProductStats = {
  total: 3421,
  active: 2893,
  sold: 528,
  revenue: 124567.89,
  pending: 89
};

const mockSystemStats: SystemStats = {
  cpu: 45,
  memory: 67,
  storage: 78,
  network: 92,
  uptime: 99.9,
  services: 13
};

const mockHeatmapData: UserHeatmapData[] = [
  { city: 'New York', country: 'USA', users: 2341, growth: 15.2, latitude: 40.7128, longitude: -74.0060 },
  { city: 'London', country: 'UK', users: 1876, growth: 8.7, latitude: 51.5074, longitude: -0.1278 },
  { city: 'Dubai', country: 'UAE', users: 1543, growth: 22.1, latitude: 25.2048, longitude: 55.2708 },
  { city: 'Tokyo', country: 'Japan', users: 1234, growth: 5.3, latitude: 35.6762, longitude: 139.6503 },
  { city: 'Singapore', country: 'Singapore', users: 987, growth: 18.9, latitude: 1.3521, longitude: 103.8198 },
  { city: 'Paris', country: 'France', users: 876, growth: 6.4, latitude: 48.8566, longitude: 2.3522 },
  { city: 'Mumbai', country: 'India', users: 754, growth: 28.6, latitude: 19.0760, longitude: 72.8777 },
  { city: 'Sydney', country: 'Australia', users: 623, growth: 9.8, latitude: -33.8688, longitude: 151.2093 }
];

const mockAgents: AgentStatus[] = [
  { id: 'trae-001', name: 'JeanTrail UI Designer', status: 'online', tasks: 12, performance: 95, lastActivity: '2 min ago' },
  { id: 'trae-002', name: 'DevOps Engineer', status: 'busy', tasks: 8, performance: 88, lastActivity: '5 min ago' },
  { id: 'trae-003', name: 'Scraper Commerce', status: 'online', tasks: 24, performance: 92, lastActivity: '1 min ago' },
  { id: 'trae-004', name: 'JeanTrail Marketplace', status: 'online', tasks: 15, performance: 87, lastActivity: '3 min ago' },
  { id: 'trae-005', name: 'Security Specialist', status: 'maintenance', tasks: 0, performance: 100, lastActivity: '1 hour ago' }
];

const mockProducts: Product[] = [
  { id: 'prod-001', name: 'Premium Dashboard Template', price: 299.99, category: 'Templates', status: 'active', seller: 'DesignStudio', created: '2024-01-15', views: 1234, sales: 45 },
  { id: 'prod-002', name: 'AI Assistant Plugin', price: 199.99, category: 'Plugins', status: 'active', seller: 'TechCorp', created: '2024-01-14', views: 892, sales: 28 },
  { id: 'prod-003', name: 'E-commerce Solution', price: 599.99, category: 'Solutions', status: 'sold', seller: 'BusinessTech', created: '2024-01-13', views: 2341, sales: 12 },
  { id: 'prod-004', name: 'Mobile App Framework', price: 399.99, category: 'Frameworks', status: 'pending', seller: 'MobileDev', created: '2024-01-12', views: 567, sales: 0 }
];

const revenueData = [
  { month: 'Jan', revenue: 45000, orders: 120 },
  { month: 'Feb', revenue: 52000, orders: 145 },
  { month: 'Mar', revenue: 48000, orders: 132 },
  { month: 'Apr', revenue: 61000, orders: 178 },
  { month: 'May', revenue: 58000, orders: 165 },
  { month: 'Jun', revenue: 67000, orders: 189 },
  { month: 'Jul', revenue: 72000, orders: 201 },
  { month: 'Aug', revenue: 69000, orders: 194 }
];

const categoryData = [
  { name: 'Templates', value: 1234, color: '#3B82F6' },
  { name: 'Plugins', value: 876, color: '#10B981' },
  { name: 'Solutions', value: 654, color: '#F59E0B' },
  { name: 'Frameworks', value: 432, color: '#EF4444' },
  { name: 'Tools', value: 321, color: '#8B5CF6' }
];

const performanceData = [
  { time: '00:00', cpu: 30, memory: 45, network: 85 },
  { time: '04:00', cpu: 25, memory: 42, network: 80 },
  { time: '08:00', cpu: 55, memory: 68, network: 92 },
  { time: '12:00', cpu: 72, memory: 78, network: 95 },
  { time: '16:00', cpu: 68, memory: 74, network: 90 },
  { time: '20:00', cpu: 45, memory: 60, network: 88 },
  { time: '23:59', cpu: 35, memory: 50, network: 82 }
];

// Component
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'agents' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [jeanAICommand, setJeanAICommand] = useState('');
  const [isExecutingCommand, setIsExecutingCommand] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Jean AI Command Handler
  const executeJeanAICommand = useCallback(async () => {
    if (!jeanAICommand.trim()) return;

    setIsExecutingCommand(true);
    try {
      // Simulate Jean AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Parse simple commands
      const command = jeanAICommand.toLowerCase();
      if (command.includes('show') && command.includes('products')) {
        setActiveTab('products');
      } else if (command.includes('show') && command.includes('users')) {
        setActiveTab('users');
      } else if (command.includes('show') && command.includes('agents')) {
        setActiveTab('agents');
      } else if (command.includes('generate') && command.includes('report')) {
        setActiveTab('reports');
      }

      setJeanAICommand('');
    } catch (error) {
      console.error('Jean AI Command Error:', error);
    } finally {
      setIsExecutingCommand(false);
    }
  }, [jeanAICommand]);

  // Product Management Handlers
  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: 'New Product',
      price: 0,
      category: 'Templates',
      status: 'pending',
      seller: 'Admin',
      created: new Date().toISOString().split('T')[0],
      views: 0,
      sales: 0
    };
    setProducts([newProduct, ...products]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'text-green-500 bg-green-100';
      case 'offline':
      case 'inactive':
        return 'text-red-500 bg-red-100';
      case 'busy':
      case 'pending':
        return 'text-yellow-500 bg-yellow-100';
      case 'maintenance':
      case 'sold':
        return 'text-purple-500 bg-purple-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <span className="px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-full">
                Live
              </span>
            </div>
            
            {/* Jean AI Command Input */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                <input
                  type="text"
                  value={jeanAICommand}
                  onChange={(e) => setJeanAICommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && executeJeanAICommand()}
                  placeholder="Ask Jean AI..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isExecutingCommand}
                />
              </div>
              <button
                onClick={executeJeanAICommand}
                disabled={isExecutingCommand}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isExecutingCommand ? 'Processing...' : 'Execute'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {(['overview', 'products', 'users', 'agents', 'reports'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{mockUserStats.total.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">{mockUserStats.growth}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Products Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900">{mockProductStats.total.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Package className="w-4 h-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-500">{mockProductStats.active} active</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Package className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Revenue Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${mockProductStats.revenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">+12.5%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </div>

              {/* System Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-gray-900">{mockSystemStats.uptime}%</p>
                    <div className="flex items-center mt-2">
                      <Server className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">{mockSystemStats.services} services</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Categories Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Products by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Heatmap */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution by City</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockHeatmapData.map((city) => (
                  <div key={city.city} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{city.city}</h4>
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Users:</span>
                        <span className="font-medium">{city.users.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Growth:</span>
                        <span className="text-green-500 font-medium">+{city.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Product Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Product Management</h3>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Templates">Templates</option>
                  <option value="Plugins">Plugins</option>
                  <option value="Solutions">Solutions</option>
                  <option value="Frameworks">Frameworks</option>
                  <option value="Tools">Tools</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.seller}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${product.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>👁 {product.views}</div>
                          <div>💰 {product.sales}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{mockUserStats.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{mockUserStats.active.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full mr-4">
                    <TrendingUp className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Users</p>
                    <p className="text-2xl font-bold text-gray-900">{mockUserStats.new}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full mr-4">
                    <DollarSign className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Premium Users</p>
                    <p className="text-2xl font-bold text-gray-900">{mockUserStats.premium.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Agent Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAgents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-full mr-3">
                        <Bot className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{agent.name}</h4>
                        <p className="text-sm text-gray-500">{agent.id}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active Tasks:</span>
                      <span className="font-medium">{agent.tasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance:</span>
                      <span className="font-medium">{agent.performance}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Activity:</span>
                      <span className="font-medium">{agent.lastActivity}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${agent.performance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* System Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="memory" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="network" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Report Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">$67,000</div>
                  <div className="text-sm text-green-500">+15.3% from last month</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                  <div className="text-2xl font-bold text-gray-900">189</div>
                  <div className="text-sm text-green-500">+8.7% from last month</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Active Users</div>
                  <div className="text-2xl font-bold text-gray-900">8,934</div>
                  <div className="text-sm text-green-500">+12.5% from last month</div>
                </div>
              </div>
            </div>

            {/* Detailed Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Month</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Export Reports</h3>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export as PDF</span>
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export as Excel</span>
                </button>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Send via Email</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;