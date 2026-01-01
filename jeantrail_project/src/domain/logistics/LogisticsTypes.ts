import { Uuid } from '../../types/common';
import { GovernanceTag } from '../../types';

/**
 * Logistics-specific Node Capabilities
 */
export type LogisticsCapability = 
  | 'transport_leg'      // Moving goods
  | 'storage'            // Warehousing
  | 'customs_clearance'  // Regulatory check
  | 'handover'           // Custody transfer
  | 'last_mile';         // Final delivery

/**
 * Status of a specific leg in the logistics chain
 */
export type LogisticsLegStatus = 
  | 'draft'              // AI proposed
  | 'awaiting_approval'  // User needs to sign off
  | 'approved'           // User signed off, waiting for provider
  | 'in_transit'         // Active
  | 'completed'          // Done
  | 'failed'             // Exception occurred
  | 'cancelled';         // User or provider cancelled

/**
 * Represents a physical or legal entity in the chain
 */
export interface LogisticsProvider {
  id: string;
  name: string;
  type: 'driver' | 'shipping_line' | 'airline' | 'warehouse' | 'customs_broker';
  governanceRating: number; // 0-100 score based on past performance
  verificationProof?: string; // DID or certificate
}

/**
 * A single node in the Logistics Execution Graph
 */
export interface LogisticsNode {
  id: Uuid;
  name: string;
  capability: LogisticsCapability;
  
  // The independent entity performing this action
  provider: LogisticsProvider;
  
  // Execution details
  origin?: string;
  destination?: string;
  estimatedCost: number;
  estimatedDurationMinutes: number;
  
  // Governance & Control
  approvalStatus: LogisticsLegStatus;
  governanceTags: GovernanceTag[];
  
  // Data for the next leg (e.g. tracking numbers, receipts)
  outputArtifacts?: Record<string, any>;
  
  // Dependencies
  requiredDocuments: string[]; // e.g., ["Commercial Invoice", "Bill of Lading"]
}

/**
 * The full Logistics Execution Graph
 */
export interface LogisticsExecutionGraph {
  id: Uuid;
  shipmentId: string;
  createdAt: string;
  
  nodes: Map<Uuid, LogisticsNode>;
  edges: { from: Uuid; to: Uuid }[];
  
  // Global constraints
  totalBudgetLimit?: number;
  maxDeliveryDate?: string;
  
  status: 'planning' | 'active' | 'completed' | 'halted';
}

/**
 * Failure modes for governance checks
 */
export enum GovernanceFailureMode {
  PROVIDER_UNVERIFIED = 'PROVIDER_UNVERIFIED',
  COST_EXCEEDS_LIMIT = 'COST_EXCEEDS_LIMIT',
  ROUTE_RISK_HIGH = 'ROUTE_RISK_HIGH',
  MISSING_APPROVAL = 'MISSING_APPROVAL',
  DOCUMENT_MISMATCH = 'DOCUMENT_MISMATCH'
}
