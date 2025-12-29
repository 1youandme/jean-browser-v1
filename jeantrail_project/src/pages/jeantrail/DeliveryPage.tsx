import React from 'react';
import { Truck, Package, MapPin, Clock, Star, Utensils } from 'lucide-react';

export const DeliveryPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600" />
            JeanTrail Delivery
          </h1>
          <p className="text-gray-600 mt-2">
            Fast, reliable delivery services for food, packages, groceries, and more
          </p>
        </div>
      </div>

      {/* Service Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border-2 border-blue-500 cursor-pointer">
          <Utensils className="w-12 h-12 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Food Delivery</h3>
          <p className="text-sm text-gray-600">Order from your favorite restaurants</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors">
          <Package className="w-12 h-12 text-gray-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Package Delivery</h3>
          <p className="text-sm text-gray-600">Send packages anywhere, anytime</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors">
          <div className="text-2xl mb-3">🛒</div>
          <h3 className="font-semibold text-gray-900 mb-2">Grocery Delivery</h3>
          <p className="text-sm text-gray-600">Fresh groceries delivered to your door</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-500 cursor-pointer transition-colors">
          <div className="text-2xl mb-3">💊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Pharmacy Delivery</h3>
          <p className="text-sm text-gray-600">Prescription and OTC medications</p>
        </div>
      </div>

      {/* Quick Order Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Delivery Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter pickup address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter delivery address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Get Instant Quote
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <Clock className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Tracking</h3>
          <p className="text-gray-600">
            Track your delivery in real-time from pickup to delivery with live GPS updates
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <Star className="w-12 h-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Couriers</h3>
          <p className="text-gray-600">
            All couriers are background-checked and highly rated for your safety and peace of mind
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <Truck className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Vehicles</h3>
          <p className="text-gray-600">
            Choose from cars, motorcycles, bicycles, or trucks based on your delivery needs
          </p>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Restaurants</h3>
          <div className="space-y-3">
            {[
              { name: 'Burger Palace', rating: 4.8, time: '20-30 min', fee: '$2.99' },
              { name: 'Pizza Heaven', rating: 4.7, time: '25-35 min', fee: '$1.99' },
              { name: 'Sushi Express', rating: 4.9, time: '30-40 min', fee: '$3.99' },
              { name: 'Taco Fiesta', rating: 4.6, time: '15-25 min', fee: '$1.99' }
            ].map((restaurant) => (
              <div key={restaurant.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{restaurant.name}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {restaurant.rating}
                    <Clock className="w-4 h-4" />
                    {restaurant.time}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">{restaurant.fee} delivery</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Delivery Time</span>
              <span className="font-semibold text-gray-900">28 minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Couriers</span>
              <span className="font-semibold text-gray-900">234</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Deliveries Today</span>
              <span className="font-semibold text-gray-900">1,567</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Customer Satisfaction</span>
              <span className="font-semibold text-gray-900">98.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Areas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Areas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            'Downtown', 'Midtown', 'Uptown', 'Westside',
            'Eastside', 'North District', 'South Bay', 'Central',
            'Harbor', 'Airport', 'University', 'Tech Hub'
          ].map((area) => (
            <div
              key={area}
              className="bg-white rounded-lg p-3 text-center border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">{area}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Delivery Features</h3>
          <p className="text-gray-600 mb-6">
            Full delivery platform coming soon including scheduled deliveries, 
            subscription services, corporate accounts, and international shipping.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <Package className="w-8 h-8 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">Package Protection</div>
              <div className="text-sm text-gray-600">Insurance for valuable items</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Clock className="w-8 h-8 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Scheduled Delivery</div>
              <div className="text-sm text-gray-600">Book deliveries in advance</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <Star className="w-8 h-8 text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Loyalty Program</div>
              <div className="text-sm text-gray-600">Earn rewards on every order</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};