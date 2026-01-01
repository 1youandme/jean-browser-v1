import { NodeCapability, ExecutionConstraints } from '../graph/ExecutionGraph';

export type ExecutionMode = 'local_docker' | 'remote_api' | 'process_isolation';

export interface ResourceGrant {
  gpuAllocated: boolean;
  memoryMb: number;
  networkAccess: 'none' | 'internal' | 'full';
  timeoutMs: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  capabilities: NodeCapability[];
  supportedModels: string[]; // Explicit list of model IDs this worker can serve
  executionMode: ExecutionMode;
  
  resources: {
    hasGpu: boolean;
    maxMemoryMb: number;
    networkIsolated: boolean; // If true, can only do 'none' or 'internal'
    isLocal: boolean;
  };
  
  status: 'online' | 'busy' | 'offline' | 'draining';
  costPerMs?: number;
}

export interface ResolvedExecutionTarget {
  workerId: string;
  executionMode: ExecutionMode;
  resourceGrant: ResourceGrant;
  reasoning: string[]; // Audit trail for why this worker was chosen
}

export interface RoutingDecision {
  success: boolean;
  target?: ResolvedExecutionTarget;
  error?: RoutingError;
}

export type RoutingError = 
  | 'NO_CAPABILITY_MATCH' 
  | 'MODEL_NOT_SUPPORTED' 
  | 'CONSTRAINT_VIOLATION_GPU' 
  | 'CONSTRAINT_VIOLATION_MEMORY' 
  | 'CONSTRAINT_VIOLATION_NETWORK' 
  | 'CONSTRAINT_VIOLATION_LOCAL' 
  | 'AMBIGUOUS_ROUTING' 
  | 'NO_WORKERS_AVAILABLE';
