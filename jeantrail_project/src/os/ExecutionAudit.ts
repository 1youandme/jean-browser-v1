import { OSActionType } from './OSActionTypes';

export type ExecutionStatus = 'success' | 'failure' | 'cancelled';

export interface ExecutionResult {
  status: ExecutionStatus;
  output?: unknown;
  error?: string;
  reversibleHint?: string;
  auditTrailId: string;
  timestamp: string;
  contractId?: string;
  contextId?: string;
  reason?: string;
}

export interface OSExecutionAuditEvent {
  id: string;
  timestamp: string;
  action: OSActionType;
  target: string;
  status: ExecutionStatus;
  userId?: string;
  contextId: string;
  metadata?: Record<string, unknown>;
}

export function createExecutionAudit(
  action: OSActionType,
  target: string,
  status: ExecutionStatus,
  contextId: string,
  userId?: string,
  metadata?: Record<string, unknown>
): OSExecutionAuditEvent {
  return {
    id: `exec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    target,
    status,
    userId,
    contextId,
    metadata
  };
}
