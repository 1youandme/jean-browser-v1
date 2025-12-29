// Transport / Delivery Pilot Service Interface and Implementation
export interface DeliveryDriver {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType: string;
  vehiclePlate?: string;
  licenseNumber?: string;
  isActive: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  rating?: number;
  totalDeliveries: number;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type DriverStatus = 'available' | 'busy' | 'offline' | 'on_break';

export interface DeliveryVehicle {
  id: string;
  driverId: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  vehicleType: string;
  capacityKg?: number;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRoute {
  id: string;
  driverId: string;
  name?: string;
  waypoints: RouteWaypoint[];
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  status: RouteStatus;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  address: string;
  estimatedTime: number;
  waypointType: 'pickup' | 'delivery' | 'break' | 'fuel';
}

export type RouteStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface DeliveryTelemetry {
  id: string;
  driverId: string;
  routeId?: string;
  deliveryId?: string;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  speedKmh?: number;
  headingDegrees?: number;
  eventType?: string;
  eventData?: Record<string, any>;
  createdAt: Date;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  activeDrivers: number;
  averageDeliveryTimeMinutes: number;
  totalDistanceKm: number;
  fuelEfficiencyLPer100Km: number;
  driverPerformance: Array<{
    driverId: string;
    name: string;
    deliveriesToday: number;
    averageTimeMinutes: number;
    rating: number;
    distanceKm: number;
  }>;
  dailyStats: Array<{
    date: string;
    deliveries: number;
    revenue: number;
  }>;
  vehicleUtilization: Record<string, {
    active: number;
    total: number;
    utilizationPercent: number;
  }>;
}

export interface DriverPerformance {
  driverId: string;
  period: {
    from: Date;
    to: Date;
  };
  metrics: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    completionRate: number;
    averageDeliveryTimeMinutes: number;
    totalDistanceKm: number;
    fuelConsumedLiters: number;
    revenueEarned: number;
    averageRating: number;
    onTimeDeliveryRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    deliveries: number;
    revenue: number;
    timeMinutes: number;
  }>;
  routeEfficiency: {
    plannedVsActualDistance: number;
    plannedVsActualTime: number;
    idleTimePercentage: number;
  };
}

export interface DriverDashboard {
  driverId: string;
  status: string;
  currentRoute: any;
  todaySummary: {
    deliveriesCompleted: number;
    deliveriesRemaining: number;
    revenueEarned: number;
    distanceTravelledKm: number;
    timeOnRoadMinutes: number;
  };
  nextDelivery?: {
    id: string;
    pickupAddress: string;
    deliveryAddress: string;
    estimatedTimeMinutes: number;
    customerName: string;
    phone: string;
  };
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  vehicleInfo: {
    type: string;
    licensePlate: string;
    fuelLevelPercent: number;
    lastMaintenanceDate: string;
  };
}

export interface CreateDriverRequest {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType: string;
  vehiclePlate?: string;
  licenseNumber?: string;
}

export interface CreateVehicleRequest {
  driverId: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  licensePlate?: string;
  vehicleType: string;
  capacityKg?: number;
  insuranceExpiry?: Date;
  registrationExpiry?: Date;
}

export interface CreateRouteRequest {
  driverId: string;
  name?: string;
  waypoints: RouteWaypoint[];
}

export interface UpdateDriverStatusRequest {
  status: DriverStatus;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface RecordTelemetryRequest {
  driverId: string;
  routeId?: string;
  deliveryId?: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  speedKmh?: number;
  headingDegrees?: number;
  eventType?: string;
  eventData?: Record<string, any>;
}

export interface ListDriversQuery {
  isActive?: boolean;
  status?: DriverStatus;
  vehicleType?: string;
  minRating?: number;
}

export interface GetTelemetryQuery {
  driverId?: string;
  routeId?: string;
  deliveryId?: string;
  fromTime?: Date;
  toTime?: Date;
  eventType?: string;
  limit?: number;
}

export interface PerformanceQuery {
  fromDate?: Date;
  toDate?: Date;
}

export interface TransportService {
  // Driver management
  getDrivers: (query?: ListDriversQuery) => Promise<DeliveryDriver[]>;
  getDriver: (id: string) => Promise<DeliveryDriver>;
  createDriver: (request: CreateDriverRequest) => Promise<DeliveryDriver>;
  updateDriverStatus: (id: string, request: UpdateDriverStatusRequest) => Promise<DeliveryDriver>;
  
  // Vehicle management
  createVehicle: (request: CreateVehicleRequest) => Promise<DeliveryVehicle>;
  getDriverVehicles: (driverId: string) => Promise<DeliveryVehicle[]>;
  
  // Route management
  createRoute: (request: CreateRouteRequest) => Promise<DeliveryRoute>;
  startRoute: (id: string) => Promise<{ success: boolean; startedAt: string }>;
  completeRoute: (id: string) => Promise<{ success: boolean; completedAt: string }>;
  
  // Telemetry
  recordTelemetry: (request: RecordTelemetryRequest) => Promise<{
    success: boolean;
    telemetryId: string;
  }>;
  getTelemetryData: (query?: GetTelemetryQuery) => Promise<DeliveryTelemetry[]>;
  
  // Analytics
  getDeliveryAnalytics: () => Promise<DeliveryAnalytics>;
  getDriverPerformance: (driverId: string, query?: PerformanceQuery) => Promise<DriverPerformance>;
  
  // Driver dashboard (PWA interface)
  getDriverDashboard: (driverId: string) => Promise<DriverDashboard>;
  getAvailableDeliveries: (driverId: string) => Promise<{
    availableDeliveries: Array<{
      id: string;
      pickupAddress: string;
      deliveryAddress: string;
      estimatedDistanceKm: number;
      estimatedTimeMinutes: number;
      paymentAmount: number;
      packageType: string;
      priority: string;
      customerNotes: string;
    }>;
  }>;
}

class TransportServiceImpl implements TransportService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getDrivers(query?: ListDriversQuery): Promise<DeliveryDriver[]> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) params.append('is_active', query.isActive.toString());
    if (query?.status) params.append('status', query.status);
    if (query?.vehicleType) params.append('vehicle_type', query.vehicleType);
    if (query?.minRating) params.append('min_rating', query.minRating.toString());

    const response = await fetch(`${this.baseUrl}/api/transport/drivers?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch drivers: ${response.statusText}`);
    return response.json();
  }

  async getDriver(id: string): Promise<DeliveryDriver> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch driver: ${response.statusText}`);
    return response.json();
  }

  async createDriver(request: CreateDriverRequest): Promise<DeliveryDriver> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create driver: ${response.statusText}`);
    return response.json();
  }

  async updateDriverStatus(id: string, request: UpdateDriverStatusRequest): Promise<DeliveryDriver> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update driver status: ${response.statusText}`);
    return response.json();
  }

  async createVehicle(request: CreateVehicleRequest): Promise<DeliveryVehicle> {
    const response = await fetch(`${this.baseUrl}/api/transport/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create vehicle: ${response.statusText}`);
    return response.json();
  }

  async getDriverVehicles(driverId: string): Promise<DeliveryVehicle[]> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${driverId}/vehicles`);
    if (!response.ok) throw new Error(`Failed to fetch driver vehicles: ${response.statusText}`);
    return response.json();
  }

  async createRoute(request: CreateRouteRequest): Promise<DeliveryRoute> {
    const response = await fetch(`${this.baseUrl}/api/transport/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create route: ${response.statusText}`);
    return response.json();
  }

  async startRoute(id: string): Promise<{ success: boolean; startedAt: string }> {
    const response = await fetch(`${this.baseUrl}/api/transport/routes/${id}/start`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to start route: ${response.statusText}`);
    return response.json();
  }

  async completeRoute(id: string): Promise<{ success: boolean; completedAt: string }> {
    const response = await fetch(`${this.baseUrl}/api/transport/routes/${id}/complete`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to complete route: ${response.statusText}`);
    return response.json();
  }

  async recordTelemetry(request: RecordTelemetryRequest): Promise<{
    success: boolean;
    telemetryId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/transport/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to record telemetry: ${response.statusText}`);
    return response.json();
  }

  async getTelemetryData(query?: GetTelemetryQuery): Promise<DeliveryTelemetry[]> {
    const params = new URLSearchParams();
    if (query?.driverId) params.append('driver_id', query.driverId);
    if (query?.routeId) params.append('route_id', query.routeId);
    if (query?.deliveryId) params.append('delivery_id', query.deliveryId);
    if (query?.fromTime) params.append('from_time', query.fromTime.toISOString());
    if (query?.toTime) params.append('to_time', query.toTime.toISOString());
    if (query?.eventType) params.append('event_type', query.eventType);
    if (query?.limit) params.append('limit', query.limit.toString());

    const response = await fetch(`${this.baseUrl}/api/transport/telemetry?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch telemetry data: ${response.statusText}`);
    return response.json();
  }

  async getDeliveryAnalytics(): Promise<DeliveryAnalytics> {
    const response = await fetch(`${this.baseUrl}/api/transport/analytics`);
    if (!response.ok) throw new Error(`Failed to fetch delivery analytics: ${response.statusText}`);
    return response.json();
  }

  async getDriverPerformance(driverId: string, query?: PerformanceQuery): Promise<DriverPerformance> {
    const params = new URLSearchParams();
    if (query?.fromDate) params.append('from_date', query.fromDate.toISOString());
    if (query?.toDate) params.append('to_date', query.toDate.toISOString());

    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${driverId}/performance?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch driver performance: ${response.statusText}`);
    return response.json();
  }

  async getDriverDashboard(driverId: string): Promise<DriverDashboard> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${driverId}/dashboard`);
    if (!response.ok) throw new Error(`Failed to fetch driver dashboard: ${response.statusText}`);
    return response.json();
  }

  async getAvailableDeliveries(driverId: string): Promise<{
    availableDeliveries: Array<{
      id: string;
      pickupAddress: string;
      deliveryAddress: string;
      estimatedDistanceKm: number;
      estimatedTimeMinutes: number;
      paymentAmount: number;
      packageType: string;
      priority: string;
      customerNotes: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/transport/drivers/${driverId}/deliveries`);
    if (!response.ok) throw new Error(`Failed to fetch available deliveries: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const transportService = new TransportServiceImpl();

// React hook
export const useTransportService = (): TransportService => {
  return transportService;
};

// Helper functions
export function calculateRouteDistance(waypoints: RouteWaypoint[]): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = haversineDistance(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng
    );
    totalDistance += dist;
  }

  return totalDistance;
}

export function calculateRouteDuration(waypoints: RouteWaypoint[]): number {
  const distanceKm = calculateRouteDistance(waypoints);
  const avgSpeedKmh = 40; // Average city speed
  
  return (distanceKm / avgSpeedKmh) * 60; // Convert to minutes
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function estimateDeliveryFee(
  distanceKm: number,
  vehicleType: string,
  priority: 'normal' | 'express' | 'urgent' = 'normal'
): number {
  const baseRates: Record<string, number> = {
    motorcycle: 2.5,
    car: 3.5,
    van: 5.0,
    truck: 8.0,
  };

  const baseRate = baseRates[vehicleType] || 3.5;
  const priorityMultiplier = {
    normal: 1.0,
    express: 1.5,
    urgent: 2.0,
  };

  return baseRate * distanceKm * priorityMultiplier[priority];
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  
  return `${Math.round(km)} km`;
}

export function getDriverStatusColor(status: DriverStatus): string {
  const colors = {
    available: 'text-green-600',
    busy: 'text-blue-600',
    offline: 'text-gray-600',
    on_break: 'text-yellow-600',
  };

  return colors[status] || 'text-gray-600';
}

export function getDriverStatusIcon(status: DriverStatus): string {
  const icons = {
    available: '✅',
    busy: '🚚',
    offline: '⚫',
    on_break: '⏸️',
  };

  return icons[status] || '❓';
}

export function calculateEfficiencyRating(
  plannedDistance: number,
  actualDistance: number,
  plannedTime: number,
  actualTime: number
): {
  distanceEfficiency: number;
  timeEfficiency: number;
  overallEfficiency: number;
} {
  const distanceEfficiency = Math.min(100, (plannedDistance / actualDistance) * 100);
  const timeEfficiency = Math.min(100, (plannedTime / actualTime) * 100);
  const overallEfficiency = (distanceEfficiency + timeEfficiency) / 2;

  return {
    distanceEfficiency: Math.round(distanceEfficiency),
    timeEfficiency: Math.round(timeEfficiency),
    overallEfficiency: Math.round(overallEfficiency),
  };
}

// Telemetry helpers
export function createTelemetryEvent(
  eventType: string,
  driverId: string,
  location: { lat: number; lng: number },
  additionalData?: Record<string, any>
): RecordTelemetryRequest {
  return {
    driverId,
    location: {
      ...location,
      accuracy: 10, // Default GPS accuracy
    },
    eventType,
    eventData: additionalData,
  };
}

export function createPickupEvent(
  driverId: string,
  deliveryId: string,
  location: { lat: number; lng: number }
): RecordTelemetryRequest {
  return createTelemetryEvent('pickup', driverId, location, {
    deliveryId,
    timestamp: new Date().toISOString(),
  });
}

export function createDeliveryEvent(
  driverId: string,
  deliveryId: string,
  location: { lat: number; lng: number },
  customerRating?: number
): RecordTelemetryRequest {
  return createTelemetryEvent('delivery', driverId, location, {
    deliveryId,
    timestamp: new Date().toISOString(),
    customerRating,
  });
}

// Route optimization helper (simplified)
export function optimizeRoute(waypoints: RouteWaypoint[]): RouteWaypoint[] {
  if (waypoints.length <= 2) {
    return waypoints;
  }

  // Simple nearest neighbor optimization
  // In production, use proper routing algorithms like OR-Tools
  const optimized: RouteWaypoint[] = [waypoints[0]];
  const remaining = [...waypoints.slice(1)];

  let currentLocation = waypoints[0];

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((waypoint, index) => {
      const distance = haversineDistance(
        currentLocation.lat, currentLocation.lng,
        waypoint.lat, waypoint.lng
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const nextWaypoint = remaining.splice(nearestIndex, 1)[0];
    optimized.push(nextWaypoint);
    currentLocation = nextWaypoint;
  }

  return optimized;
}