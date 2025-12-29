/**
 * KernelIntrospection.ts
 * 
 * Provides mechanisms for the user to inspect and control the Kernel's decisions.
 * "OS intelligence must be inspectable."
 */

export interface DecisionTrace {
  decisionId: string;
  timestamp: number;
  intent: string;
  inputs: Record<string, any>;
  outcome: string;
  confidence: number;
  policyChecks: {
    policyName: string;
    passed: boolean;
    reason?: string;
  }[];
}

export interface MemoryAuditLog {
  operation: 'read' | 'write' | 'delete' | 'revoke';
  target: string; // Memory ID or scope
  initiator: string; // PID or 'user'
  timestamp: number;
  success: boolean;
}

export interface KernelIntrospection {
  /**
   * Returns the trace of the last N decisions made by the kernel.
   */
  getDecisionHistory(limit: number): Promise<DecisionTrace[]>;

  /**
   * Returns an audit log of memory operations.
   */
  getMemoryAuditLog(sessionId?: string): Promise<MemoryAuditLog[]>;

  /**
   * Forces the kernel to explain a specific decision in natural language.
   */
  explainDecision(decisionId: string): Promise<string>;

  /**
   * Revokes access to a specific memory scope or item.
   * If 'hard' is true, the data is physically deleted.
   */
  revokeMemory(targetId: string, hard: boolean): Promise<void>;
  
  /**
   * Disables a specific kernel module or capability.
   */
  disableModule(moduleId: string): Promise<void>;
}
