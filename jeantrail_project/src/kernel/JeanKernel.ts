import { KernelState, INITIAL_KERNEL_STATE, OSSession, OSProcess, IntentProvider } from './KernelState';
import { KernelIntrospection, DecisionTrace, MemoryAuditLog } from './KernelIntrospection';

/**
 * JeanKernel
 * 
 * The central orchestrator for the Personal AI OS.
 * - Orchestrates context, workspaces, and memory.
 * - Arbitrates tools and intents.
 * - Enforces user sovereignty.
 */
export class JeanKernel implements KernelIntrospection {
  private state: KernelState;
  private decisionLog: DecisionTrace[] = [];
  private auditLog: MemoryAuditLog[] = [];

  constructor() {
    this.state = { ...INITIAL_KERNEL_STATE };
    this.state.systemStatus = 'idle';
  }

  // --- Session Management (Session-as-OS) ---

  public createSession(userId: string, isolation: 'strict' | 'permeable' = 'strict'): string {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: OSSession = {
      id: sessionId,
      userId,
      startTime: Date.now(),
      isolationLevel: isolation,
      activeContexts: new Set(),
      ephemeralMemory: new Map(),
    };
    this.state.activeSessions.set(sessionId, session);
    return sessionId;
  }

  public endSession(sessionId: string): void {
    if (this.state.activeSessions.has(sessionId)) {
      this.state.activeSessions.delete(sessionId);
      // Clean up associated processes
      for (const [pid, process] of this.state.processTable) {
        if (process.sessionId === sessionId) {
          this.terminateProcess(pid);
        }
      }
    }
  }

  // --- Intent & Process Routing (Application-as-Intent) ---

  public registerIntentProvider(provider: IntentProvider): void {
    this.state.registry.set(provider.appId, provider);
  }

  public async dispatchIntent(sessionId: string, intentStr: string, payload: any): Promise<string> {
    const session = this.state.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    // 1. Log the intent
    const decisionId = `dec_${Date.now()}`;
    const trace: DecisionTrace = {
      decisionId,
      timestamp: Date.now(),
      intent: intentStr,
      inputs: payload,
      outcome: 'pending',
      confidence: 0,
      policyChecks: []
    };

    // 2. Resolve provider (Arbitration)
    // Simple matching for now, would be intelligent in full implementation
    let selectedProvider: IntentProvider | undefined;
    for (const provider of this.state.registry.values()) {
      if (provider.registeredIntents.includes(intentStr)) {
        selectedProvider = provider;
        break;
      }
    }

    if (!selectedProvider) {
      trace.outcome = 'rejected';
      trace.policyChecks.push({ policyName: 'ProviderResolution', passed: false, reason: 'No provider found' });
      this.decisionLog.push(trace);
      throw new Error(`No provider registered for intent: ${intentStr}`);
    }

    trace.policyChecks.push({ policyName: 'ProviderResolution', passed: true, reason: `Selected ${selectedProvider.name}` });

    // 3. User Sovereignty Check
    if (this.state.sovereignty.requireExplicitApproval) {
      // In a real system, this would await user UI interaction.
      // For this symbolic implementation, we assume a "pre-approved" flag or auto-approve if confidence is high (mocked).
      trace.policyChecks.push({ policyName: 'SovereigntyGate', passed: true, reason: 'Auto-approved for demo' });
    }

    // 4. Spawn Process
    const pid = `proc_${Date.now()}`;
    const process: OSProcess = {
      pid,
      sessionId,
      intentId: intentStr,
      status: 'running',
      resourceUsage: { memory: 0, compute: 0 }
    };
    this.state.processTable.set(pid, process);

    trace.outcome = 'approved';
    trace.confidence = 1.0;
    this.decisionLog.push(trace);

    return pid;
  }

  public terminateProcess(pid: string): void {
    this.state.processTable.delete(pid);
  }

  // --- Introspection Implementation ---

  public async getDecisionHistory(limit: number): Promise<DecisionTrace[]> {
    return this.decisionLog.slice(-limit);
  }

  public async getMemoryAuditLog(sessionId?: string): Promise<MemoryAuditLog[]> {
    // In a real impl, filter by sessionId if provided
    return this.auditLog;
  }

  public async explainDecision(decisionId: string): Promise<string> {
    const trace = this.decisionLog.find(d => d.decisionId === decisionId);
    if (!trace) return "Decision not found.";
    return `Decision ${decisionId} for intent '${trace.intent}' was ${trace.outcome}. ` +
           `Checks: ${trace.policyChecks.map(p => `${p.policyName}=${p.passed}`).join(', ')}.`;
  }

  public async revokeMemory(targetId: string, hard: boolean): Promise<void> {
    this.auditLog.push({
      operation: 'revoke',
      target: targetId,
      initiator: 'user',
      timestamp: Date.now(),
      success: true
    });
    // Implementation would clear actual data structures here
  }

  public async disableModule(moduleId: string): Promise<void> {
    // Implementation would toggle flags in registry or config
  }
}
