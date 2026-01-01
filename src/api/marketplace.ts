import api from './index';
import { Product, CartItem, Order, ApiResponse, PaginatedResponse } from '../types';

export const marketplaceApi = {
  // Products
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Product>>> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // Cart (localStorage based for now, but API ready)
  getCart: async (): Promise<ApiResponse<CartItem[]>> => {
    // For Phase 1, use localStorage
    const cart = localStorage.getItem('marketplace-cart');
    return {
      success: true,
      data: cart ? JSON.parse(cart) : []
    };
  },

  addToCart: async (productId: string, quantity: number = 1): Promise<ApiResponse<CartItem[]>> => {
    // For Phase 1, use localStorage
    const cart = localStorage.getItem('marketplace-cart');
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    
    // This is simplified - in real app, we'd fetch product details first
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      // Add to cart (simplified)
      cartItems.push({
        id: productId,
        name: 'Product Name', // Would be fetched from API
        price: 0, // Would be fetched from API
        image: '',
        category: '',
        rating: 0,
        description: '',
        inStock: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        quantity,
        addedAt: new Date()
      });
    }
    
    localStorage.setItem('marketplace-cart', JSON.stringify(cartItems));
    
    return {
      success: true,
      data: cartItems
    };
  },

  removeFromCart: async (productId: string): Promise<ApiResponse<CartItem[]>> => {
    const cart = localStorage.getItem('marketplace-cart');
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    
    const updatedCart = cartItems.filter(item => item.id !== productId);
    localStorage.setItem('marketplace-cart', JSON.stringify(updatedCart));
    
    return {
      success: true,
      data: updatedCart
    };
  },

  updateCartQuantity: async (productId: string, quantity: number): Promise<ApiResponse<CartItem[]>> => {
    const cart = localStorage.getItem('marketplace-cart');
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    
    if (quantity <= 0) {
      return marketplaceApi.removeFromCart(productId);
    }
    
    const updatedCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    
    localStorage.setItem('marketplace-cart', JSON.stringify(updatedCart));
    
    return {
      success: true,
      data: updatedCart
    };
  },

  clearCart: async (): Promise<ApiResponse<void>> => {
    localStorage.removeItem('marketplace-cart');
    return {
      success: true
    };
  },

  // Orders
  createOrder: async (orderData: {
    items: CartItem[];
    shippingAddress: string;
    paymentMethod: string;
  }): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<ApiResponse<Order>> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  }
};