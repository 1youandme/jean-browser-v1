export type GovernanceState = 
  | 'IDLE' 
  | 'REVIEW_PENDING' 
  | 'APPROVED' 
  | 'EXECUTING' 
  | 'PAUSED' 
  | 'HALTED' 
  | 'COMPLETED' 
  | 'DENIED';

export type UserRole = 'VIEWER' | 'OPERATOR' | 'ADMIN';

export interface GovernancePermission {
  canApprove: boolean;
  canPause: boolean;
  canHalt: boolean;
  canViewSensitiveData: boolean;
}

export interface GovernanceContext {
  graphId?: string;
  activeNodeId?: string;
  pendingDecisions: number;
  securityAlerts: string[];
}

export interface ApprovalRequest {
  id: string;
  type: 'EXECUTION_START' | 'SENSITIVE_ACCESS' | 'NETWORK_CALL';
  description: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface GovernanceEvent {
  type: 'STATE_CHANGE' | 'DECISION' | 'ALERT';
  payload: any;
  actor: string;
  timestamp: number;
}
