import { PolicyOutcome, PolicyReasonCode } from '../PolicyOutcome';

export interface KernelSnapshot {
  timestamp: number;
  activePolicies: string[];
  lastDecision: KernelDecision | null;
  metrics: {
    decisionsCount: number;
    blocksCount: number;
  };
}

export interface KernelDecision {
  id: string;
  intent: string;
  outcome: PolicyOutcome;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface KernelExplanation {
  decisionId: string;
  reason: string;
  code: PolicyReasonCode;
  contributingPolicies: string[];
}

export class KernelIntrospectionEngine {
  private decisions: KernelDecision[] = [];
  private activePolicies: Set<string> = new Set();
  private maxHistory = 100;
  private listeners: Set<(snapshot: KernelSnapshot) => void> = new Set();

  constructor() {
    // Initialize with core policies
    this.activePolicies.add('GOVERNANCE_LOCK');
    this.activePolicies.add('CONSENT_REQUIRED');
  }

  public subscribe(callback: (snapshot: KernelSnapshot) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const snapshot = this.getKernelSnapshot();
    this.listeners.forEach(listener => listener(snapshot));
  }

  public recordDecision(intent: string, outcome: PolicyOutcome, context?: Record<string, unknown>): void {
    const decision: KernelDecision = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      intent,
      outcome,
      timestamp: Date.now(),
      context
    };

    this.decisions.unshift(decision);
    if (this.decisions.length > this.maxHistory) {
      this.decisions.pop();
    }
    
    this.notifyListeners();
  }

  public getKernelSnapshot(): KernelSnapshot {
    return {
      timestamp: Date.now(),
      activePolicies: Array.from(this.activePolicies),
      lastDecision: this.decisions[0] || null,
      metrics: {
        decisionsCount: this.decisions.length,
        blocksCount: this.decisions.filter(d => d.outcome.kind === 'DENY' || d.outcome.kind === 'HALT').length
      }
    };
  }

  public explainLastDecision(): KernelExplanation | null {
    const last = this.decisions[0];
    if (!last) return null;

    return {
      decisionId: last.id,
      reason: last.outcome.reason,
      code: last.outcome.code,
      contributingPolicies: Array.from(this.activePolicies) // Simplified for now
    };
  }

  public getDecisions(): ReadonlyArray<KernelDecision> {
    return [...this.decisions]; // Return copy to prevent mutation
  }
}

export const kernelIntrospection = new KernelIntrospectionEngine();
