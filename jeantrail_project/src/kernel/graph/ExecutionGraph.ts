import { Uuid } from '../../types/common';

/**
 * Capability Categories matching the Open-Source Power Stack
 */
export enum NodeCapability {
  /** Deep reasoning and chain-of-thought */
  REASONING = 'reasoning',
  /** Planning, decomposition, and task structuring */
  PLANNING = 'planning',
  /** Video generation and refinement */
  VIDEO_GEN = 'video_gen',
  /** Visual understanding and analysis */
  VISION_ANALYSIS = 'vision_analysis',
  /** 3D scene operations and asset manipulation */
  SCENE_3D = 'scene_3d',
  /** Code generation and transformation */
  CODE_GEN = 'code_gen',
  /** Output verification, guardrails, and evals */
  VERIFICATION = 'verification',
  /** Control flow and orchestration */
  ORCHESTRATION = 'orchestration',
}

/**
 * Execution Constraints for Governance
 */
export interface ExecutionConstraints {
  localOnly: boolean;          // Must run in local Docker
  maxDurationMs?: number;      // Timeout
  requiresGpu?: boolean;       // Hardware requirement
  allowedModels?: string[];    // Whitelist
  networkAccess?: 'none' | 'internal' | 'full'; // Sandbox level
  memoryLimitMb?: number;
}

/**
 * Input/Output Data Types
 */
export type DataType = 'text' | 'json' | 'image_path' | 'video_path' | '3d_asset_path' | 'code_blob';

export interface DataSlot {
  name: string;
  type: DataType;
  description?: string;
  required: boolean;
}

/**
 * Node Specification
 * Represents a single step in the DAG
 */
export interface NodeSpec {
  id: Uuid;
  name: string;
  capability: NodeCapability;
  model: string; // Specific model identifier
  
  inputs: Record<string, {
    sourceNodeId?: Uuid; // If linked from another node
    sourceOutputName?: string;
    staticValue?: any;   // If constant
  }>;
  
  outputs: DataSlot[];
  
  constraints: ExecutionConstraints;
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Graph Edge
 * Explicit connection for visualization and validation
 */
export interface GraphEdge {
  fromNode: Uuid;
  fromOutput: string;
  toNode: Uuid;
  toInput: string;
}

/**
 * The Execution Graph (DAG)
 */
export interface ExecutionGraph {
  id: Uuid;
  intentId: string;
  timestamp: number;
  nodes: Map<string, NodeSpec>; // Keyed by Node ID
  edges: GraphEdge[];
  
  metadata: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    estimatedCost?: number;
    tags: string[];
  };
  
  status: 'draft' | 'validated' | 'executing' | 'completed' | 'failed';
}

export interface GraphValidationResult {
  isValid: boolean;
  errors: string[];
  cyclesDetected?: string[][];
}
