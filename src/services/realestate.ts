// Real Estate Service Interface and Implementation
export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'villa' | 'land' | 'commercial';
  status: 'for_sale' | 'for_rent' | 'sold' | 'rented' | 'off_market';
  price: number;
  currency: string;
  pricingType: 'fixed' | 'auction' | 'rental';
  address: Address;
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
    country: string;
    neighborhood?: string;
  };
  features: PropertyFeatures;
  images: string[];
  videos?: string[];
  virtualTour?: string;
  floorPlan?: string;
  agent: Agent;
  listing: ListingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt?: number;
  parking: {
    spaces: number;
    type: 'garage' | 'carport' | 'street' | 'driveway';
  };
  amenities: string[];
  features: string[];
  utilities: string[];
  heating: string;
  cooling: string;
  foundation?: string;
  roof?: string;
  exterior: string;
  interior: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  agency: string;
  license: string;
  rating: number;
  reviews: number;
  languages: string[];
  specialties: string[];
}

export interface ListingInfo {
  listingId: string;
  mlsId?: string;
  listedAt: Date;
  views: number;
  saves: number;
  inquiries: number;
  openHouses: OpenHouse[];
  documents: PropertyDocument[];
}

export interface OpenHouse {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  description?: string;
  rsvpRequired: boolean;
  maxAttendees?: number;
  currentAttendees: number;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'disclosure' | 'inspection' | 'title' | 'lease' | 'other';
  url: string;
  uploadedAt: Date;
}

export interface PropertySearch {
  location?: string;
  type?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  squareFeetMin?: number;
  squareFeetMax?: number;
  amenities?: string[];
  features?: string[];
  keywords?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'bedrooms' | 'square_feet';
}

export interface RealEstateService {
  // Property search and browsing
  searchProperties: (search: PropertySearch) => Promise<Property[]>;
  getProperty: (id: string) => Promise<Property>;
  getFeaturedProperties: () => Promise<Property[]>;
  getSimilarProperties: (propertyId: string) => Promise<Property[]>;
  getRecentlyViewed: () => Promise<Property[]>;
  
  // User interactions
  saveProperty: (propertyId: string) => Promise<void>;
  unsaveProperty: (propertyId: string) => Promise<void>;
  getSavedProperties: () => Promise<Property[]>;
  scheduleViewing: (propertyId: string, date: Date, time: string) => Promise<Viewing>;
  getPropertyViewings: (propertyId: string) => Promise<Viewing[]>;
  
  // Agent communication
  contactAgent: (propertyId: string, message: string, contactInfo: ContactInfo) => Promise<void>;
  getAgentProperties: (agentId: string) => Promise<Property[]>;
  rateAgent: (agentId: string, rating: number, review: string) => Promise<void>;
  
  // Valuation and analytics
  getPropertyValuation: (address: Address) => Promise<PropertyValuation>;
  getMarketTrends: (location: string) => Promise<MarketTrends>;
  getNeighborhoodInfo: (location: string) => Promise<NeighborhoodInfo>;
  
  // Mortgage calculator
  calculateMortgage: (principal: number, rate: number, years: number, downPayment?: number) => Promise<MortgageCalculation>;
  
  // Virtual tours
  startVirtualTour: (propertyId: string) => Promise<string>;
  scheduleVirtualViewing: (propertyId: string, date: Date) => Promise<VirtualViewing>;
}

export interface Viewing {
  id: string;
  propertyId: string;
  date: Date;
  time: string;
  duration: number;
  type: 'in_person' | 'virtual';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  message: string;
  preferredContact: 'email' | 'phone';
}

export interface PropertyValuation {
  estimatedValue: number;
  confidence: number;
  comparableProperties: Property[];
  marketAnalysis: {
    pricePerSquareFoot: number;
    averageDaysOnMarket: number;
    priceTrend: 'rising' | 'stable' | 'declining';
  };
  lastUpdated: Date;
}

export interface MarketTrends {
  location: string;
  medianPrice: number;
  averagePricePerSquareFoot: number;
  inventory: number;
  daysOnMarket: number;
  priceTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  marketHeat: 'cold' | 'cool' | 'warm' | 'hot';
  lastUpdated: Date;
}

export interface NeighborhoodInfo {
  name: string;
  description: string;
  demographics: {
    population: number;
    medianIncome: number;
    medianAge: number;
  };
  amenities: {
    schools: School[];
    parks: string[];
    shopping: string[];
    restaurants: string[];
    hospitals: string[];
  };
  transportation: {
    publicTransit: boolean;
    highways: string[];
    airports: string[];
  };
  crime: {
    safetyRating: number;
    crimeRate: number;
  };
  walkScore: number;
  transitScore: number;
  bikeScore: number;
}

export interface School {
  name: string;
  type: 'elementary' | 'middle' | 'high' | 'private';
  rating: number;
  distance: number;
  grades: string[];
}

export interface MortgageCalculation {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortization: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface VirtualViewing {
  id: string;
  propertyId: string;
  date: Date;
  duration: number;
  meetingUrl: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participantLimit: number;
  currentParticipants: number;
}

class RealEstateServiceImpl implements RealEstateService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async searchProperties(search: PropertySearch): Promise<Property[]> {
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/search?${params}`);
    if (!response.ok) throw new Error('Failed to search properties');
    return response.json();
  }

  async getProperty(id: string): Promise<Property> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${id}`);
    if (!response.ok) throw new Error('Failed to get property');
    return response.json();
  }

  async getFeaturedProperties(): Promise<Property[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/featured`);
    if (!response.ok) throw new Error('Failed to get featured properties');
    return response.json();
  }

  async getSimilarProperties(propertyId: string): Promise<Property[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/similar`);
    if (!response.ok) throw new Error('Failed to get similar properties');
    return response.json();
  }

  async getRecentlyViewed(): Promise<Property[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/recently-viewed`);
    if (!response.ok) throw new Error('Failed to get recently viewed properties');
    return response.json();
  }

  async saveProperty(propertyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/save`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to save property');
  }

  async unsaveProperty(propertyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/save`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unsave property');
  }

  async getSavedProperties(): Promise<Property[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/saved`);
    if (!response.ok) throw new Error('Failed to get saved properties');
    return response.json();
  }

  async scheduleViewing(propertyId: string, date: Date, time: string): Promise<Viewing> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/viewings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time }),
    });
    if (!response.ok) throw new Error('Failed to schedule viewing');
    return response.json();
  }

  async getPropertyViewings(propertyId: string): Promise<Viewing[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/viewings`);
    if (!response.ok) throw new Error('Failed to get property viewings');
    return response.json();
  }

  async contactAgent(propertyId: string, message: string, contactInfo: ContactInfo): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, contactInfo }),
    });
    if (!response.ok) throw new Error('Failed to contact agent');
  }

  async getAgentProperties(agentId: string): Promise<Property[]> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/agents/${agentId}/properties`);
    if (!response.ok) throw new Error('Failed to get agent properties');
    return response.json();
  }

  async rateAgent(agentId: string, rating: number, review: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/agents/${agentId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    });
    if (!response.ok) throw new Error('Failed to rate agent');
  }

  async getPropertyValuation(address: Address): Promise<PropertyValuation> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/valuation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) throw new Error('Failed to get property valuation');
    return response.json();
  }

  async getMarketTrends(location: string): Promise<MarketTrends> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/market-trends/${encodeURIComponent(location)}`);
    if (!response.ok) throw new Error('Failed to get market trends');
    return response.json();
  }

  async getNeighborhoodInfo(location: string): Promise<NeighborhoodInfo> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/neighborhood/${encodeURIComponent(location)}`);
    if (!response.ok) throw new Error('Failed to get neighborhood info');
    return response.json();
  }

  async calculateMortgage(principal: number, rate: number, years: number, downPayment?: number): Promise<MortgageCalculation> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/mortgage-calculator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principal, rate, years, downPayment }),
    });
    if (!response.ok) throw new Error('Failed to calculate mortgage');
    return response.json();
  }

  async startVirtualTour(propertyId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/virtual-tour`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start virtual tour');
    const result = await response.json();
    return result.tourUrl;
  }

  async scheduleVirtualViewing(propertyId: string, date: Date): Promise<VirtualViewing> {
    const response = await fetch(`${this.baseUrl}/api/real-estate/properties/${propertyId}/virtual-viewings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    if (!response.ok) throw new Error('Failed to schedule virtual viewing');
    return response.json();
  }
}

export const realEstateService = new RealEstateServiceImpl();
export const useRealEstateService = () => realEstateService;