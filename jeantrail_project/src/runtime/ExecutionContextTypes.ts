export type ExecutionContextId = 'web' | 'proxy' | 'local' | 'emulator';

export interface ContextDescriptor {
  id: ExecutionContextId;
  capabilities: string[];
  restrictions: string[];
  auditBoundaries: string[];
}

export interface ContextAuditEvent {
  id: string;
  timestamp: string;
  event: string;
  contextId: ExecutionContextId;
  details?: Record<string, unknown>;
}

export interface ExecutionRequest {
  contextId: ExecutionContextId;
  action: string;
  payload?: Record<string, unknown>;
}

export interface ExecutionRouteResult {
  accepted: boolean;
  reason?: string;
  contextId: ExecutionContextId;
  mode: 'symbolic';
  audit: ContextAuditEvent;
}

export interface ConsentToken {
  contextId: ExecutionContextId;
  token: string;
}

export interface ContextSwitch {
  from: ExecutionContextId;
  to: ExecutionContextId;
  consentToken?: string;
  audit: ContextAuditEvent;
}

export interface ResourceLimits {
  cpu?: number;
  io?: number;
  memoryMB?: number;
  steps?: number;
}

export interface TimeBounds {
  start: string;
  end: string;
}

export interface DelegationSpec {
  delegatorAgentId: string;
  delegateAgentId: string;
  allowedActions: string[];
  resourceLimits?: ResourceLimits;
  timeBounds: TimeBounds;
}

export interface ExecutionContract {
  id: string;
  contextId: ExecutionContextId;
  scopes: string[];
  allowedActions: string[];
  resourceLimits?: ResourceLimits;
  timeBounds: TimeBounds;
  revoked?: boolean;
  delegation?: DelegationSpec;
}
