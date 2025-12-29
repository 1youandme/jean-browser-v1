// Delivery Service Interface and Implementation
export interface DeliveryOrder {
  id: string;
  orderType: 'food' | 'package' | 'grocery' | 'medicine';
  items: DeliveryItem[];
  pickup: Address;
  delivery: Address;
  status: 'pending' | 'accepted' | 'picking_up' | 'in_transit' | 'delivered' | 'cancelled';
  courier?: Courier;
  estimatedTime?: Date;
  actualTime?: Date;
  price: {
    base: number;
    tax: number;
    tip: number;
    total: number;
    currency: string;
  };
  paymentMethod: string;
  instructions?: string;
  trackingCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  vehicle: {
    type: 'car' | 'motorcycle' | 'bicycle' | 'truck';
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  rating: number;
  deliveriesCompleted: number;
}

export interface DeliveryService {
  // Order management
  createOrder: (order: Omit<DeliveryOrder, 'id' | 'status' | 'trackingCode' | 'createdAt' | 'updatedAt'>) => Promise<DeliveryOrder>;
  getOrders: () => Promise<DeliveryOrder[]>;
  getOrder: (id: string) => Promise<DeliveryOrder>;
  cancelOrder: (id: string, reason?: string) => Promise<void>;
  updateOrder: (id: string, updates: Partial<DeliveryOrder>) => Promise<void>;
  
  // Tracking
  trackOrder: (trackingCode: string) => Promise<DeliveryOrder>;
  getOrderHistory: (limit?: number) => Promise<DeliveryOrder[]>;
  
  // Restaurant/Store management (for food delivery)
  getRestaurants: (location?: Address) => Promise<Restaurant[]>;
  getRestaurant: (id: string) => Promise<Restaurant>;
  getRestaurantMenu: (restaurantId: string) => Promise<MenuItem[]>;
  
  // Package delivery
  getShippingRates: (pickup: Address, delivery: Address, packageInfo: PackageInfo) => Promise<ShippingRate[]>;
  schedulePickup: (pickupInfo: PickupInfo) => Promise<DeliveryOrder>;
  
  // Real-time updates
  subscribeToOrderUpdates: (orderId: string, callback: (order: DeliveryOrder) => void) => () => void;
  getCurrentLocation: () => Promise<{ lat: number; lng: number }>;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  address: Address;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  deliveryTime: {
    min: number;
    max: number;
  };
  deliveryFee: {
    min: number;
    max: number;
  };
  imageUrl?: string;
  isOpen: boolean;
  hours: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients: string[];
  allergens: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface PackageInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  type: 'document' | 'package' | 'furniture' | 'electronics' | 'other';
  value?: number;
  insurance?: boolean;
}

export interface ShippingRate {
  provider: string;
  service: string;
  price: number;
  currency: string;
  estimatedDelivery: Date;
  tracking: boolean;
}

export interface PickupInfo {
  packageInfo: PackageInfo;
  pickup: Address;
  delivery: Address;
  preferredTime?: Date;
  instructions?: string;
}

class DeliveryServiceImpl implements DeliveryService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async createOrder(order: Omit<DeliveryOrder, 'id' | 'status' | 'trackingCode' | 'createdAt' | 'updatedAt'>): Promise<DeliveryOrder> {
    const response = await fetch(`${this.baseUrl}/api/delivery/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create delivery order');
    return response.json();
  }

  async getOrders(): Promise<DeliveryOrder[]> {
    const response = await fetch(`${this.baseUrl}/api/delivery/orders`);
    if (!response.ok) throw new Error('Failed to get delivery orders');
    return response.json();
  }

  async getOrder(id: string): Promise<DeliveryOrder> {
    const response = await fetch(`${this.baseUrl}/api/delivery/orders/${id}`);
    if (!response.ok) throw new Error('Failed to get delivery order');
    return response.json();
  }

  async cancelOrder(id: string, reason?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delivery/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to cancel delivery order');
  }

  async updateOrder(id: string, updates: Partial<DeliveryOrder>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delivery/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update delivery order');
  }

  async trackOrder(trackingCode: string): Promise<DeliveryOrder> {
    const response = await fetch(`${this.baseUrl}/api/delivery/track/${trackingCode}`);
    if (!response.ok) throw new Error('Failed to track delivery order');
    return response.json();
  }

  async getOrderHistory(limit?: number): Promise<DeliveryOrder[]> {
    const url = limit ? `${this.baseUrl}/api/delivery/orders/history?limit=${limit}` : `${this.baseUrl}/api/delivery/orders/history`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get order history');
    return response.json();
  }

  async getRestaurants(location?: Address): Promise<Restaurant[]> {
    const params = location ? new URLSearchParams({
      lat: location.coordinates?.lat.toString(),
      lng: location.coordinates?.lng.toString(),
    }) : '';

    const response = await fetch(`${this.baseUrl}/api/delivery/restaurants?${params}`);
    if (!response.ok) throw new Error('Failed to get restaurants');
    return response.json();
  }

  async getRestaurant(id: string): Promise<Restaurant> {
    const response = await fetch(`${this.baseUrl}/api/delivery/restaurants/${id}`);
    if (!response.ok) throw new Error('Failed to get restaurant');
    return response.json();
  }

  async getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
    const response = await fetch(`${this.baseUrl}/api/delivery/restaurants/${restaurantId}/menu`);
    if (!response.ok) throw new Error('Failed to get restaurant menu');
    return response.json();
  }

  async getShippingRates(pickup: Address, delivery: Address, packageInfo: PackageInfo): Promise<ShippingRate[]> {
    const response = await fetch(`${this.baseUrl}/api/delivery/shipping-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup, delivery, packageInfo }),
    });
    if (!response.ok) throw new Error('Failed to get shipping rates');
    return response.json();
  }

  async schedulePickup(pickupInfo: PickupInfo): Promise<DeliveryOrder> {
    const response = await fetch(`${this.baseUrl}/api/delivery/pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pickupInfo),
    });
    if (!response.ok) throw new Error('Failed to schedule pickup');
    return response.json();
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: DeliveryOrder) => void): () => void {
    // Would implement WebSocket connection for real-time updates
    console.log('Subscribing to order updates for:', orderId);
    
    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from order updates for:', orderId);
    };
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    // Would use browser's geolocation API
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
        reject
      );
    });
  }
}

export const deliveryService = new DeliveryServiceImpl();
export const useDeliveryService = () => deliveryService;