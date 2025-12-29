import { AgentManifest } from './AgentDefinition';
import { AgentPermissionGrant, AgentPermissionScope } from './AgentPermissions';
import { OSExecutionAuditEvent, ExecutionStatus } from '../os/ExecutionAudit';
import { MemoryAuditLog, DecisionTrace } from '../kernel/KernelIntrospection';

export interface ActiveAgent {
  manifest: AgentManifest;
  sessionId?: string;
  pid?: string;
}

export interface ActionAttempt {
  id: string;
  action: string;
  target: string;
  status: ExecutionStatus;
  timestamp: string;
  auditTrailId?: string;
}

export interface AuditReference {
  id: string;
  timestamp: string;
  type: 'os_execution' | 'memory' | 'decision';
  contextId?: string;
  details?: Record<string, unknown>;
}

export interface AgentRuntimeSource {
  listActiveAgents(): Promise<ActiveAgent[]>;
  listPermissionGrants(): Promise<AgentPermissionGrant[]>;
  listOSAuditEvents(limit: number): Promise<OSExecutionAuditEvent[]>;
  listMemoryAuditEvents(limit: number): Promise<MemoryAuditLog[]>;
  listDecisionTraces(limit: number): Promise<DecisionTrace[]>;
}

/**
 * AgentRuntimeInspector
 *
 * Read-only observational layer over the agent runtime state.
 * Exposes: active agents, granted permissions, last actions attempted, audit references.
 * Does not mutate or control underlying systems.
 */
export class AgentRuntimeInspector {
  private source: AgentRuntimeSource;

  constructor(source: AgentRuntimeSource) {
    this.source = source;
  }

  public async getActiveAgents(): Promise<ActiveAgent[]> {
    const agents = await this.source.listActiveAgents();
    return agents.map(a => ({ manifest: { ...a.manifest }, sessionId: a.sessionId, pid: a.pid }));
  }

  public async getPermissions(): Promise<Array<{ agentId: string; granted: AgentPermissionScope[] }>> {
    const grants = await this.source.listPermissionGrants();
    return grants.map(g => ({ agentId: g.agentId, granted: [...g.granted] }));
  }

  public async getLastActions(limit: number): Promise<ActionAttempt[]> {
    const events = await this.source.listOSAuditEvents(limit);
    return events.map(ev => ({
      id: ev.id,
      action: String(ev.action),
      target: ev.target,
      status: ev.status,
      timestamp: ev.timestamp,
      auditTrailId: ev.id
    }));
  }

  public async getAuditReferences(limit: number): Promise<AuditReference[]> {
    const [osEvents, memEvents, decisions] = await Promise.all([
      this.source.listOSAuditEvents(limit),
      this.source.listMemoryAuditEvents(limit),
      this.source.listDecisionTraces(limit)
    ]);

    const osRefs: AuditReference[] = osEvents.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      type: 'os_execution',
      contextId: e.contextId,
      details: e.metadata
    }));

    const memRefs: AuditReference[] = memEvents.map((m, idx) => ({
      id: `mem-${idx}-${m.timestamp}`,
      timestamp: String(m.timestamp),
      type: 'memory',
      details: { operation: m.operation, target: m.target, initiator: m.initiator, success: m.success }
    }));

    const decisionRefs: AuditReference[] = decisions.map(d => ({
      id: d.decisionId,
      timestamp: String(d.timestamp),
      type: 'decision',
      details: { intent: d.intent, outcome: d.outcome, confidence: d.confidence }
    }));

    return [...osRefs, ...memRefs, ...decisionRefs];
  }
}

