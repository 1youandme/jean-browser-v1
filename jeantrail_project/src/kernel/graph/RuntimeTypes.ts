import { Uuid, DateTime } from '../../types/common';

/**
 * Node Runtime State
 * The lifecycle of a node during execution
 */
export type NodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';

export interface NodeRuntimeState {
  nodeId: Uuid;
  status: NodeStatus;
  attempts: number;
  startTime?: number;
  endTime?: number;
  outputData?: Record<string, any>; // The actual results produced
  error?: string;
  logs: string[];
}

/**
 * Execution Context
 * Global context for a specific run of a graph
 */
export interface ExecutionContext {
  runId: Uuid;
  workspaceId: Uuid;
  graphId: Uuid;
  startTime: number;
  userId?: Uuid;
  
  // Determinism & Replay
  isReplay: boolean;
  seed: number; // For PRNG
  
  // Runtime configuration
  dryRun: boolean;
}

/**
 * Execution Snapshot
 * complete state of an execution at a point in time
 */
export interface ExecutionSnapshot {
  context: ExecutionContext;
  nodeStates: Record<Uuid, NodeRuntimeState>;
  globalData: Record<string, any>; // Shared/Global memory if needed
  updatedAt: number;
}
