import React from 'react';
import { ShoppingBag, Search, Filter, ShoppingCart, Heart, Star } from 'lucide-react';

export const EcommercePage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            JeanTrail E-commerce
          </h1>
          <p className="text-gray-600 mt-2">
            Discover amazing products from trusted merchants worldwide
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for products, brands, or categories..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <ShoppingCart className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Shopping</h3>
          <p className="text-gray-600">
            AI-powered recommendations based on your preferences and browsing history
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <Heart className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wishlist Management</h3>
          <p className="text-gray-600">
            Save items for later and get notified about price drops and special offers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <Star className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Trusted Reviews</h3>
          <p className="text-gray-600">
            Verified reviews and ratings from the JeanTrail community
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            'Electronics', 'Fashion', 'Home & Garden', 'Sports', 
            'Books', 'Toys', 'Beauty', 'Automotive', 'Food', 'Health'
          ].map((category) => (
            <div
              key={category}
              className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-2xl mb-2">🛍️</div>
              <div className="text-sm font-medium text-gray-900">{category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Products</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">E-commerce Integration Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            This service will include product listings, shopping cart, order management, 
            and integration with major e-commerce platforms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">Product Catalog</div>
              <div className="text-sm text-gray-600">Browse millions of products</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">Secure Checkout</div>
              <div className="text-sm text-gray-600">Multiple payment options</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="font-medium text-gray-900">Order Tracking</div>
              <div className="text-sm text-gray-600">Real-time delivery updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};