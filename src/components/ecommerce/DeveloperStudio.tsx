import React, { useState, useEffect } from 'react';
import { Package, DollarSign, TrendingUp, Settings, Eye, Edit, Check, X, AlertCircle, BarChart3, Users, Truck } from 'lucide-react';
import { ecommerceService } from '../../services/ecommerce/products';
import { pricingService } from '../../services/ecommerce/pricing';
import { suppliersService } from '../../services/ecommerce/suppliers';

interface Product {
  id: string;
  title: string;
  category: string;
  supplierPrice: number;
  sellingPrice?: number;
  margin?: number;
  supplier?: Supplier;
  shippingOptions?: ShippingOption[];
  competitorPricing?: CompetitorPricing;
  aibuyData?: AIBuyData;
  aiInsights?: AIInsights;
  status: 'pending' | 'analyzing' | 'priced' | 'active' | 'inactive';
  isNew?: boolean;
  promoCode?: string;
  promotionEndDate?: string;
}

interface Supplier {
  id: string;
  name: string;
  companyName: string;
  rating: { rating: number; reviews: number };
  responseRate?: number;
  yearsOnPlatform?: number;
  verified: boolean;
  location: string;
}

interface ShippingOption {
  name: string;
  carrier: string;
  type: string;
  estimatedDays: { min: number; max: number };
  cost: number;
}

interface CompetitorPricing {
  amazon: { price?: number; currency: string };
  aliexpress: { price?: number; currency: string };
}

interface AIBuyData {
  price: number;
  insights: any;
  confidence: number;
}

interface AIInsights {
  demandScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  qualityScore: number;
  marketFit: number;
  recommendations: string[];
}

interface DeveloperStudioProps {
  userId: string;
}

export const DeveloperStudio: React.FC<DeveloperStudioProps> = ({ userId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [pricingAnalysis, setPricingAnalysis] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filter = activeTab === 'pending' ? 'pending' : activeTab;
      const productList = await ecommerceService.getProducts({ status: filter });
      setProducts(productList);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeProduct = async (productId: string) => {
    try {
      const analysis = await pricingService.analyzeProduct(productId);
      setPricingAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze product:', error);
    }
  };

  const approveProduct = async (product: Product) => {
    try {
      await ecommerceService.approveProduct(product.id, {
        sellingPrice: product.sellingPrice,
        margin: product.margin,
        status: 'active'
      });
      
      loadProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to approve product:', error);
    }
  };

  const rejectProduct = async (productId: string) => {
    try {
      await ecommerceService.rejectProduct(productId);
      loadProducts();
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to reject product:', error);
    }
  };

  const calculateSmartPrice = async (productId: string) => {
    try {
      const pricing = await pricingService.calculateSmartPrice(productId);
      
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, sellingPrice: pricing.price, margin: pricing.margin }
          : p
      ));
    } catch (error) {
      console.error('Failed to calculate smart price:', error);
    }
  };

  const updateCustomPrice = (productId: string) => {
    const price = parseFloat(customPrice);
    if (!isNaN(price) && price > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        const margin = ((price - product.supplierPrice) / product.supplierPrice) * 100;
        
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, sellingPrice: price, margin }
            : p
        ));
      }
    }
    
    setEditingPrice(null);
    setCustomPrice('');
  };

  const getCompetitorAnalysis = (product: Product) => {
    if (!product.competitorPricing) return null;
    
    const { amazon, aliexpress } = product.competitorPricing;
    const ourPrice = product.sellingPrice;
    
    let analysis = { status: 'unknown', message: '' };
    
    if (amazon.price && ourPrice) {
      if (ourPrice > amazon.price * 1.1) {
        analysis = { status: 'high', message: `Price is ${Math.round(((ourPrice - amazon.price) / amazon.price) * 100)}% above Amazon` };
      } else if (ourPrice < amazon.price * 0.9) {
        analysis = { status: 'low', message: `Price is ${Math.round(((amazon.price - ourPrice) / amazon.price) * 100)}% below Amazon` };
      } else {
        analysis = { status: 'competitive', message: 'Price is competitive with Amazon' };
      }
    }
    
    return analysis;
  };

  const getQualityIndicator = (score: number) => {
    if (score >= 0.8) return { color: 'text-green-600', icon: '🟢', label: 'High' };
    if (score >= 0.6) return { color: 'text-yellow-600', icon: '🟡', label: 'Medium' };
    return { color: 'text-red-600', icon: '🔴', label: 'Low' };
  };

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: products.filter(p => p.status === 'pending').length },
    { id: 'analyzing', label: 'Analyzing', count: products.filter(p => p.status === 'analyzing').length },
    { id: 'priced', label: 'Priced', count: products.filter(p => p.status === 'priced').length },
    { id: 'active', label: 'Active', count: products.filter(p => p.status === 'active').length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Developer Studio</h2>
          <p className="text-gray-600 mt-1">Review and manage product pricing and launch</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{products.length}</span> products total
          </div>
          <button
            onClick={() => loadProducts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Products</h3>
          
          {products.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No products in this category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`p-4 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedProduct?.id === product.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-2">{product.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                        <span>Cost: ${product.supplierPrice}</span>
                        {product.sellingPrice && (
                          <span className="font-medium">Price: ${product.sellingPrice}</span>
                        )}
                        {product.margin && (
                          <span className={`font-medium ${
                            product.margin >= 40 ? 'text-green-600' : 
                            product.margin >= 20 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {product.margin.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      
                      {product.isNew && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded mt-2">
                          New Product
                        </span>
                      )}
                    </div>
                    
                    <div className="ml-2">
                      {product.aiInsights && (
                        <div className="flex items-center space-x-1">
                          {getQualityIndicator(product.aiInsights.qualityScore).icon}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <div className="space-y-6">
              {/* Product Header */}
              <div className="bg-white rounded-lg p-6 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedProduct.title}</h3>
                    <p className="text-gray-600 mt-1">{selectedProduct.category}</p>
                    
                    {selectedProduct.isNew && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          New Product - Promo Active
                        </span>
                        {selectedProduct.promoCode && (
                          <span className="text-sm text-gray-600">
                            Promo: {selectedProduct.promoCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => analyzeProduct(selectedProduct.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Analyze pricing"
                    >
                      <BarChart3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => calculateSmartPrice(selectedProduct.id)}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Calculate smart price"
                    >
                      <DollarSign className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white rounded-lg p-6 border">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing Analysis</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Cost
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      ${selectedProduct.supplierPrice}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price
                    </label>
                    {editingPrice === selectedProduct.id ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          placeholder={selectedProduct.sellingPrice?.toString()}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => updateCustomPrice(selectedProduct.id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingPrice(null)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">
                          ${selectedProduct.sellingPrice || 'Not set'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingPrice(selectedProduct.id);
                            setCustomPrice(selectedProduct.sellingPrice?.toString() || '');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margin
                    </label>
                    <div className={`text-lg font-semibold ${
                      selectedProduct.margin && selectedProduct.margin >= 40 ? 'text-green-600' :
                      selectedProduct.margin && selectedProduct.margin >= 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedProduct.margin ? `${selectedProduct.margin.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profit per Unit
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      ${selectedProduct.sellingPrice ? (selectedProduct.sellingPrice - selectedProduct.supplierPrice).toFixed(2) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Competitor Analysis */}
                {selectedProduct.competitorPricing && (
                  <div className="mt-6 pt-6 border-t">
                    <h5 className="font-medium text-gray-900 mb-3">Competitor Pricing</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Amazon</span>
                        <span className="text-sm">
                          {selectedProduct.competitorPricing.amazon.price 
                            ? `$${selectedProduct.competitorPricing.amazon.price}` 
                            : 'Not found'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">AliExpress</span>
                        <span className="text-sm">
                          {selectedProduct.competitorPricing.aliexpress.price 
                            ? `$${selectedProduct.competitorPricing.aliexpress.price}` 
                            : 'Not found'}
                        </span>
                      </div>
                    </div>
                    
                    {getCompetitorAnalysis(selectedProduct) && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        getCompetitorAnalysis(selectedProduct)?.status === 'competitive' ? 'bg-green-50 text-green-800' :
                        getCompetitorAnalysis(selectedProduct)?.status === 'high' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        <p className="text-sm">
                          {getCompetitorAnalysis(selectedProduct)?.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplier Information */}
              {selectedProduct.supplier && (
                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Supplier Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900">{selectedProduct.supplier.name}</h5>
                      <p className="text-gray-600">{selectedProduct.supplier.companyName}</p>
                      <p className="text-sm text-gray-500 mt-1">{selectedProduct.supplier.location}</p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">★</span>
                          <span>{selectedProduct.supplier.rating.rating}</span>
                          <span className="text-gray-500">({selectedProduct.supplier.rating.reviews})</span>
                        </div>
                        
                        {selectedProduct.supplier.verified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {selectedProduct.supplier.responseRate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Response Rate:</span>
                          <span className="font-medium">{selectedProduct.supplier.responseRate}%</span>
                        </div>
                      )}
                      {selectedProduct.supplier.yearsOnPlatform && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Years on Platform:</span>
                          <span className="font-medium">{selectedProduct.supplier.yearsOnPlatform}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Contact Supplier
                    </button>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {selectedProduct.aiInsights && (
                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">AI Insights</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Demand Score
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedProduct.aiInsights.demandScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(selectedProduct.aiInsights.demandScore * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality Score
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${selectedProduct.aiInsights.qualityScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(selectedProduct.aiInsights.qualityScore * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competition Level
                      </label>
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${
                        selectedProduct.aiInsights.competitionLevel === 'low' ? 'bg-green-100 text-green-800' :
                        selectedProduct.aiInsights.competitionLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProduct.aiInsights.competitionLevel}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Market Fit
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${selectedProduct.aiInsights.marketFit * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(selectedProduct.aiInsights.marketFit * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.aiInsights.recommendations.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h5 className="font-medium text-gray-900 mb-3">Recommendations</h5>
                      <ul className="space-y-2">
                        {selectedProduct.aiInsights.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => approveProduct(selectedProduct)}
                  disabled={!selectedProduct.sellingPrice}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Approve & Launch
                </button>
                <button
                  onClick={() => rejectProduct(selectedProduct.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center border">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Product</h3>
              <p className="text-gray-500">
                Choose a product from the list to view details and manage pricing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Analysis Modal */}
      {pricingAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Analysis</h3>
            
            <div className="space-y-4">
              {/* Analysis content would go here */}
              <p>Pricing analysis results...</p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setPricingAnalysis(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};