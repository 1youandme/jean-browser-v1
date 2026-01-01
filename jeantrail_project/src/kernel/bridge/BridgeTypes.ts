import { ExecutionGraph } from '../graph/ExecutionGraph';

/**
 * Bridge Message Types
 */
export type MessageType = 
  | 'HANDSHAKE_INIT'
  | 'HANDSHAKE_ACK'
  | 'GRAPH_SUBMISSION'
  | 'GRAPH_ACCEPTED'
  | 'GRAPH_REJECTED'
  | 'EXECUTION_START'
  | 'EXECUTION_UPDATE'
  | 'EXECUTION_COMPLETE'
  | 'AUDIT_LOG_REQUEST'
  | 'AUDIT_LOG_RESPONSE'
  | 'ERROR';

/**
 * Base Message Structure
 */
export interface BridgeMessage<T = any> {
  id: string;
  type: MessageType;
  timestamp: number;
  payload: T;
}

/**
 * Signed Message Wrapper
 * Enforces integrity and non-repudiation
 */
export interface SignedMessage<T = any> {
  message: BridgeMessage<T>;
  signature: string; // HMAC or RSA signature of the message content
  senderPublicKey?: string; // For verification
}

// ==========================================
// Payload Definitions
// ==========================================

export interface HandshakePayload {
  clientId: string;
  clientVersion: string;
  requestedCapabilities: string[]; // e.g., ['submit_graph', 'read_logs']
  nonce: string;
}

export interface HandshakeAckPayload {
  sessionId: string;
  grantedCapabilities: string[];
  serverTime: number;
}

export interface GraphSubmissionPayload {
  graph: ExecutionGraph;
  userIntent: string; // Text description of what the user wants to achieve
  dryRun?: boolean;
}

export interface ExecutionUpdatePayload {
  graphId: string;
  nodeId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number; // 0-100
  logs?: string[];
  outputRef?: string; // Reference to output artifact
}

export interface AuditLogRequestPayload {
  graphId: string;
  filter?: {
    level?: 'info' | 'warn' | 'error';
    since?: number;
  };
}

export interface BridgeErrorPayload {
  code: string;
  message: string;
  details?: any;
}

/**
 * Capability Definitions
 */
export type BridgeCapability = 
  | 'SUBMIT_GRAPH'
  | 'READ_LOGS'
  | 'CANCEL_EXECUTION'
  | 'ADMIN_OVERRIDE';
