import { GovernanceTag } from '../../types';

/**
 * 1. PRICING TRANSPARENCY MODEL
 * 
 * Every price must be broken down.
 * "Total" is the only large number shown; components are audit trails.
 */
export interface PriceComponent {
  label: string;
  amount: number;
  currency: string;
  type: 'base_fare' | 'tax' | 'service_fee' | 'resort_fee' | 'fuel_surcharge' | 'insurance';
  isMandatory: boolean; // If true, MUST be included in the displayed total
  recipient?: string; // Who gets this money? (e.g. "Government", "Airline", "Platform")
}

export interface TransparentPrice {
  total: number;
  currency: string;
  breakdown: PriceComponent[];
  isLocked: boolean; // If true, price cannot change during checkout
  lockExpiration?: string;
}

/**
 * 2. GOVERNANCE TAGS FOR TRAVEL
 * 
 * Specific tags to enforce safety and honesty.
 */
export type TravelGovernanceTag = 
  | 'verified_price'     // Price guaranteed by cryptographic signature
  | 'strict_cancellation'// No refund (Warning label)
  | 'flexible_refund'    // 100% refund up to X days
  | 'data_minimized'     // Only sends name/passport, no behavioral data
  | 'direct_booking'     // No intermediary aggregators
  | 'dark_pattern_free'; // Audited to have no urgency countdowns

/**
 * 3. DOMAIN MODELS
 */

export type TravelProviderType = 'airline' | 'hotel' | 'resort_chain' | 'independent_host';

export interface TravelProvider {
  id: string;
  name: string;
  type: TravelProviderType;
  reputationScore: number;
  governanceCompliance: {
    noDarkPatterns: boolean;
    transparentPricing: boolean;
  };
}

export interface TravelItem {
  id: string;
  providerId: string;
  name: string; // "Flight AA123" or "Grand Hotel"
  description: string;
  
  // Pricing
  price: TransparentPrice;
  
  // Governance
  tags: (GovernanceTag | TravelGovernanceTag)[];
  
  // Availability (Snapshot)
  availableSeatsOrRooms: number;
  
  // The "Truth" Source
  sourceDataHash: string; // SHA-256 of the raw provider API response
}

export interface Flight extends TravelItem {
  type: 'flight';
  segments: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    flightNumber: string;
    aircraft: string;
  }[];
}

export interface Hotel extends TravelItem {
  type: 'hotel';
  location: string;
  amenities: string[];
  checkIn: string;
  checkOut: string;
}

/**
 * 4. BOOKING FLOW MODELS
 */

export interface BookingProposal {
  id: string;
  items: TravelItem[];
  totalPrice: TransparentPrice;
  status: 'draft' | 'pipeline_ready' | 'executed' | 'failed';
  passengerDataHash: string; // We don't store PII in the proposal, just the hash
}

export interface BookingPipelineStep {
  stepId: string;
  action: 'verify_identity' | 'payment_hold' | 'provider_confirm' | 'payment_capture';
  status: 'pending' | 'completed' | 'failed';
  txHash?: string; // For audit
}
