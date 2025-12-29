import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Star,
  Truck,
  Shield,
  Package,
  Globe,
  TrendingUp,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  MapPin,
  Award,
  Zap,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ExternalLink
} from 'lucide-react';

// Types
interface Product {
  id: string;
  title: string;
  description: string;
  price: {
    original: number;
    discounted: number;
    currency: string;
  };
  images: string[];
  category: string;
  subcategory: string;
  supplier: {
    id: string;
    name: string;
    rating: number;
    totalSales: number;
    responseRate: number;
    responseTime: string;
    location: {
      country: string;
      city: string;
    };
    isVerified: boolean;
    yearsOnPlatform: number;
  };
  shipping: {
    freeShipping: boolean;
    cost: number;
    estimatedDelivery: string;
    locations: string[];
  };
  specifications: Record<string, string>;
  tags: string[];
  rating: {
    average: number;
    reviews: number;
    distribution: Record<number, number>;
  };
  moq: number; // Minimum Order Quantity
  stock: number;
  views: number;
  orders: number;
  uploadDate: string;
  lastUpdated: string;
  featured: boolean;
  trending: boolean;
}

interface SearchFilters {
  category: string;
  subcategory: string;
  priceRange: [number, number];
  minRating: number;
  supplierLocation: string[];
  freeShipping: boolean;
  verifiedSupplier: boolean;
  inStock: boolean;
  moqMax: number;
  tags: string[];
}

interface CartItem extends Product {
  quantity: number;
  selectedVariants?: Record<string, string>;
}

// Mock data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Premium Wireless Bluetooth Earbuds TWS',
    description: 'High-quality wireless earbuds with active noise cancellation, 24-hour battery life, and premium sound quality. Perfect for music lovers and professionals.',
    price: {
      original: 89.99,
      discounted: 45.99,
      currency: 'USD'
    },
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300'
    ],
    category: 'Electronics',
    subcategory: 'Audio',
    supplier: {
      id: 'sup-1',
      name: 'TechGear Manufacturing Co.',
      rating: 4.8,
      totalSales: 15420,
      responseRate: 98,
      responseTime: '2 hours',
      location: {
        country: 'China',
        city: 'Shenzhen'
      },
      isVerified: true,
      yearsOnPlatform: 8
    },
    shipping: {
      freeShipping: true,
      cost: 0,
      estimatedDelivery: '7-15 days',
      locations: ['Worldwide', 'USA', 'Europe', 'Middle East']
    },
    specifications: {
      'Battery Life': '24 hours',
      'Bluetooth Version': '5.2',
      'Water Resistance': 'IPX7',
      'Charging Port': 'USB-C',
      'Noise Cancellation': 'Active'
    },
    tags: ['wireless', 'bluetooth', 'earbuds', 'noise-cancellation'],
    rating: {
      average: 4.6,
      reviews: 1234,
      distribution: { 5: 623, 4: 412, 3: 156, 2: 32, 1: 11 }
    },
    moq: 10,
    stock: 5000,
    views: 45678,
    orders: 2341,
    uploadDate: '2024-01-15',
    lastUpdated: '2024-01-20',
    featured: true,
    trending: true
  },
  {
    id: 'prod-2',
    title: 'Smart Watch with Health Monitoring',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS tracking, and smartphone integration. Water resistant with 7-day battery life.',
    price: {
      original: 129.99,
      discounted: 78.99,
      currency: 'USD'
    },
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
    ],
    category: 'Electronics',
    subcategory: 'Wearables',
    supplier: {
      id: 'sup-2',
      name: 'SmartTech International',
      rating: 4.7,
      totalSales: 8934,
      responseRate: 96,
      responseTime: '4 hours',
      location: {
        country: 'China',
        city: 'Guangzhou'
      },
      isVerified: true,
      yearsOnPlatform: 6
    },
    shipping: {
      freeShipping: false,
      cost: 12.99,
      estimatedDelivery: '10-20 days',
      locations: ['USA', 'Europe', 'Asia']
    },
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery Life': '7 days',
      'Water Resistance': '5ATM',
      'GPS': 'Built-in',
      'Health Sensors': 'Heart rate, SpO2, Sleep'
    },
    tags: ['smartwatch', 'fitness', 'health', 'gps'],
    rating: {
      average: 4.5,
      reviews: 892,
      distribution: { 5: 445, 4: 267, 3: 134, 2: 28, 1: 18 }
    },
    moq: 5,
    stock: 2000,
    views: 23456,
    orders: 987,
    uploadDate: '2024-01-10',
    lastUpdated: '2024-01-18',
    featured: true,
    trending: false
  },
  {
    id: 'prod-3',
    title: 'Organic Skincare Set - Complete Face Care',
    description: 'Natural organic skincare products including cleanser, toner, serum, and moisturizer. Suitable for all skin types with clinically proven results.',
    price: {
      original: 59.99,
      discounted: 35.99,
      currency: 'USD'
    },
    images: [
      'https://images.unsplash.com/photo-1570172619644-dfd03ed7d781?w=300'
    ],
    category: 'Beauty',
    subcategory: 'Skincare',
    supplier: {
      id: 'sup-3',
      name: 'Natural Beauty Supplies',
      rating: 4.9,
      totalSales: 6789,
      responseRate: 99,
      responseTime: '1 hour',
      location: {
        country: 'China',
        city: 'Shanghai'
      },
      isVerified: true,
      yearsOnPlatform: 10
    },
    shipping: {
      freeShipping: true,
      cost: 0,
      estimatedDelivery: '5-12 days',
      locations: ['Worldwide']
    },
    specifications: {
      'Products': '4 pieces',
      'Ingredients': 'Organic, Natural',
      'Skin Types': 'All',
      'Certification': 'FDA Approved',
      'Shelf Life': '3 years'
    },
    tags: ['organic', 'skincare', 'natural', 'beauty'],
    rating: {
      average: 4.8,
      reviews: 567,
      distribution: { 5: 342, 4: 168, 3: 45, 2: 8, 1: 4 }
    },
    moq: 20,
    stock: 3500,
    views: 34567,
    orders: 1456,
    uploadDate: '2024-01-08',
    lastUpdated: '2024-01-22',
    featured: false,
    trending: true
  }
];

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: '💻' },
  { id: 'clothing', name: 'Clothing & Fashion', icon: '👕' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: '💄' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
  { id: 'toys', name: 'Toys & Hobbies', icon: '🎮' },
  { id: 'automotive', name: 'Automotive', icon: '🚗' },
  { id: 'industrial', name: 'Industrial Equipment', icon: '🏭' }
];

const SUBCATEGORIES = {
  electronics: ['Audio', 'Computers', 'Cameras', 'Wearables', 'Accessories'],
  clothing: ["Men's", "Women's", "Children's", 'Shoes', 'Accessories'],
  beauty: ['Skincare', 'Makeup', 'Hair Care', 'Fragrance', 'Personal Care'],
  home: ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Tools'],
  sports: ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Equipment'],
  toys: ['Educational', 'Action Figures', 'Board Games', 'Electronic Toys', 'Arts & Crafts'],
  automotive: ['Parts', 'Accessories', 'Tools', 'Electronics', 'Care Products'],
  industrial: ['Machinery', 'Tools', 'Safety Equipment', 'Raw Materials', 'Packaging']
};

export const EcommerceMarketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    subcategory: '',
    priceRange: [0, 1000],
    minRating: 0,
    supplierLocation: [],
    freeShipping: false,
    verifiedSupplier: false,
    inStock: true,
    moqMax: 1000,
    tags: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating' | 'orders'>('relevance');

  // Apply filters and search
  useEffect(() => {
    let filtered = products.filter(product => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.toLowerCase().includes(query)) ||
          product.supplier.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) return false;

      // Subcategory filter
      if (filters.subcategory && product.subcategory !== filters.subcategory) return false;

      // Price range filter
      const price = product.price.discounted;
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;

      // Rating filter
      if (product.rating.average < filters.minRating) return false;

      // Supplier location filter
      if (filters.supplierLocation.length > 0 && 
          !filters.supplierLocation.includes(product.supplier.location.country)) return false;

      // Free shipping filter
      if (filters.freeShipping && !product.shipping.freeShipping) return false;

      // Verified supplier filter
      if (filters.verifiedSupplier && !product.supplier.isVerified) return false;

      // In stock filter
      if (filters.inStock && product.stock <= 0) return false;

      // MOQ filter
      if (product.moq > filters.moqMax) return false;

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => product.tags.includes(tag))) return false;

      return true;
    });

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price.discounted - b.price.discounted;
        case 'price-high':
          return b.price.discounted - a.price.discounted;
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'orders':
          return b.orders - a.orders;
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, filters, sortBy]);

  // Add to cart
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  // Update cart quantity
  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  }, [removeFromCart]);

  // Toggle wishlist
  const toggleWishlist = useCallback((productId: string) => {
    setWishlist(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // Calculate cart totals
  const cartTotal = cart.reduce((total, item) => total + (item.price.discounted * item.quantity), 0);
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Format price
  const formatPrice = (price: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  // Get rating stars
  const getRatingStars = (rating: number): JSX.Element[] => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
              JeanTrail Marketplace
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Direct sourcing from Alibaba, 1688, and global suppliers
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Heart className="w-4 h-4" />
                <span>Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {wishlist.length}
                  </span>
                )}
              </button>
            </div>
            <div className="relative">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <span className="bg-white text-blue-600 text-xs rounded-full px-2 py-0.5 font-medium">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                  {formatPrice(cartTotal)}
                </span>
              )}
            </div>
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
                placeholder="Search products, suppliers, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          {filters.category && (
            <div className="lg:w-48">
              <select
                value={filters.subcategory}
                onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subcategories</option>
                {SUBCATEGORIES[filters.category as keyof typeof SUBCATEGORIES]?.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Most Relevant</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="orders">Most Orders</option>
            </select>
          </div>

          {/* View Mode and Filters */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                    }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating: {filters.minRating}+ stars
                </label>
                <div className="flex space-x-1">
                  {[0, 3, 3.5, 4, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilters(prev => ({ ...prev, minRating: rating }))}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        filters.minRating === rating
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {rating === 0 ? 'Any' : rating + '+'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.freeShipping}
                      onChange={(e) => setFilters(prev => ({ ...prev, freeShipping: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Free Shipping</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.verifiedSupplier}
                      onChange={(e) => setFilters(prev => ({ ...prev, verifiedSupplier: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Verified Suppliers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock}
                      onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">In Stock</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  category: '',
                  subcategory: '',
                  priceRange: [0, 1000],
                  minRating: 0,
                  supplierLocation: [],
                  freeShipping: false,
                  verifiedSupplier: false,
                  inStock: true,
                  moqMax: 1000,
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
            Showing {filteredProducts.length} of {products.length} products
          </p>
          <div className="flex items-center space-x-2">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              <RefreshCw className="w-3 h-3 inline mr-1" />
              Refresh
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              <Download className="w-3 h-3 inline mr-1" />
              Export Results
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  category: '',
                  subcategory: '',
                  priceRange: [0, 1000],
                  minRating: 0,
                  supplierLocation: [],
                  freeShipping: false,
                  verifiedSupplier: false,
                  inStock: true,
                  moqMax: 1000,
                  tags: []
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  viewMode === 'list' ? 'flex' : 'flex flex-col'
                } ${product.featured ? 'ring-2 ring-blue-500' : ''}`}
              >
                {/* Product Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'h-48'} bg-gray-100`}>
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    {product.featured && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                    {product.trending && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        Trending
                      </span>
                    )}
                    {product.shipping.freeShipping && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        <Truck className="w-3 h-3 inline mr-1" />
                        Free Shipping
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`absolute top-2 right-2 p-2 rounded-lg ${
                      wishlist.includes(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex-1 p-4">
                  {/* Supplier Info */}
                  <div className="flex items-center space-x-2 mb-2">
                    {product.supplier.isVerified && (
                      <Award className="w-3 h-3 text-blue-500" title="Verified Supplier" />
                    )}
                    <span className="text-xs text-gray-600">{product.supplier.name}</span>
                    <span className="text-xs text-gray-400">• {product.supplier.location.country}</span>
                  </div>

                  {/* Product Title */}
                  <h3 className={`font-medium text-gray-900 mb-2 ${
                    viewMode === 'list' ? 'text-lg' : 'text-sm line-clamp-2'
                  }`}>
                    {product.title}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      {getRatingStars(product.rating.average)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating.average} ({product.rating.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price.discounted, product.price.currency)}
                    </span>
                    {product.price.discounted < product.price.original && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.price.original, product.price.currency)}
                      </span>
                    )}
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {Math.round(((product.price.original - product.price.discounted) / product.price.original) * 100)}% OFF
                    </span>
                  </div>

                  {/* MOQ and Stock */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <span>MOQ: {product.moq} pieces</span>
                    <span>{product.stock.toLocaleString()} in stock</span>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center text-xs text-gray-600 mb-4">
                    <Truck className="w-3 h-3 mr-1" />
                    <span>{product.shipping.estimatedDelivery}</span>
                    {!product.shipping.freeShipping && (
                      <span className="ml-2">
                        +{formatPrice(product.shipping.cost, product.price.currency)} shipping
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addToCart(product, product.moq)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <ShoppingCart className="w-3 h-3 inline mr-1" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredProducts.length >= 12 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-center">
            <button
              onClick={() => setIsLoading(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Load More Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
};