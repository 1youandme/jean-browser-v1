// E-commerce Service Interface and Implementation
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  rating: number;
  reviews: number;
  seller: {
    id: string;
    name: string;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem extends Product {
  quantity: number;
  addedAt: Date;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EcommerceService {
  // Product management
  searchProducts: (query: string, category?: string) => Promise<Product[]>;
  getProduct: (id: string) => Promise<Product>;
  getProductsByCategory: (category: string) => Promise<Product[]>;
  getFeaturedProducts: () => Promise<Product[]>;
  
  // Cart management
  getCart: () => Promise<CartItem[]>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Order management
  createOrder: (shippingAddress: Address, paymentMethod: string) => Promise<Order>;
  getOrders: () => Promise<Order[]>;
  getOrder: (id: string) => Promise<Order>;
  cancelOrder: (id: string) => Promise<void>;
  trackOrder: (id: string) => Promise<{ status: string; estimatedDelivery?: Date }>;
  
  // Reviews
  getProductReviews: (productId: string) => Promise<Review[]>;
  submitReview: (productId: string, rating: number, comment: string) => Promise<void>;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

class EcommerceServiceImpl implements EcommerceService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async searchProducts(query: string, category?: string): Promise<Product[]> {
    const params = new URLSearchParams({ query });
    if (category) params.append('category', category);
    
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products/search?${params}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  }

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products/${id}`);
    if (!response.ok) throw new Error('Failed to get product');
    return response.json();
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products?category=${category}`);
    if (!response.ok) throw new Error('Failed to get products by category');
    return response.json();
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products/featured`);
    if (!response.ok) throw new Error('Failed to get featured products');
    return response.json();
  }

  async getCart(): Promise<CartItem[]> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/cart`);
    if (!response.ok) throw new Error('Failed to get cart');
    return response.json();
  }

  async addToCart(productId: string, quantity: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add to cart');
  }

  async removeFromCart(productId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/cart/${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
  }

  async updateCartQuantity(productId: string, quantity: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/cart/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart quantity');
  }

  async clearCart(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/cart`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear cart');
  }

  async createOrder(shippingAddress: Address, paymentMethod: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingAddress, paymentMethod }),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  }

  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/orders`);
    if (!response.ok) throw new Error('Failed to get orders');
    return response.json();
  }

  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/orders/${id}`);
    if (!response.ok) throw new Error('Failed to get order');
    return response.json();
  }

  async cancelOrder(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/orders/${id}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to cancel order');
  }

  async trackOrder(id: string): Promise<{ status: string; estimatedDelivery?: Date }> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/orders/${id}/track`);
    if (!response.ok) throw new Error('Failed to track order');
    return response.json();
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products/${productId}/reviews`);
    if (!response.ok) throw new Error('Failed to get product reviews');
    return response.json();
  }

  async submitReview(productId: string, rating: number, comment: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/ecommerce/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    if (!response.ok) throw new Error('Failed to submit review');
  }
}

export const ecommerceService = new EcommerceServiceImpl();
export const useEcommerceService = () => ecommerceService;