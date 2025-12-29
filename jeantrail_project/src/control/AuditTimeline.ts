import { OSExecutionAuditEvent, ExecutionStatus } from '../os/ExecutionAudit';
import { DecisionTrace, MemoryAuditLog } from '../kernel/KernelIntrospection';

export type AuditEventType = 'decision' | 'execution' | 'block' | 'revocation';
export type AuditEventSource = 'kernel' | 'os' | 'memory';

export interface AuditTimelineEvent {
  id: string;
  type: AuditEventType;
  source: AuditEventSource;
  timestamp: number;
  details: Record<string, unknown>;
}

function ts(v: string | number): number {
  if (typeof v === 'number') return v;
  const n = Date.parse(v);
  return Number.isNaN(n) ? Date.now() : n;
}

function mapExecution(e: OSExecutionAuditEvent): AuditTimelineEvent {
  const type: AuditEventType = e.status === 'success' ? 'execution' : 'block';
  return {
    id: e.id,
    type,
    source: 'os',
    timestamp: ts(e.timestamp),
    details: {
      action: e.action,
      target: e.target,
      status: e.status,
      contextId: e.contextId,
      metadata: e.metadata
    }
  };
}

function mapDecision(d: DecisionTrace): AuditTimelineEvent {
  const type: AuditEventType = d.outcome === 'blocked' ? 'block' : 'decision';
  return {
    id: d.decisionId,
    type,
    source: 'kernel',
    timestamp: d.timestamp,
    details: {
      intent: d.intent,
      outcome: d.outcome,
      confidence: d.confidence,
      policyChecks: d.policyChecks
    }
  };
}

function mapRevocation(m: MemoryAuditLog, idx: number): AuditTimelineEvent | null {
  if (m.operation !== 'revoke') return null;
  return {
    id: `revoke-${idx}-${m.timestamp}`,
    type: 'revocation',
    source: 'memory',
    timestamp: m.timestamp,
    details: {
      target: m.target,
      initiator: m.initiator,
      success: m.success
    }
  };
}

export interface BuildTimelineInput {
  decisions: DecisionTrace[];
  executions: OSExecutionAuditEvent[];
  memoryAudits: MemoryAuditLog[];
}

export function buildAuditTimeline(input: BuildTimelineInput): AuditTimelineEvent[] {
  const a = input.executions.map(mapExecution);
  const b = input.decisions.map(mapDecision);
  const c = input.memoryAudits
    .map((m, i) => mapRevocation(m, i))
    .filter((x): x is AuditTimelineEvent => !!x);
  return [...a, ...b, ...c].sort((x, y) => x.timestamp - y.timestamp);
}

export function filterTimelineByType(events: AuditTimelineEvent[], types: AuditEventType[]): AuditTimelineEvent[] {
  const set = new Set(types);
  return events.filter(e => set.has(e.type));
}

export function sliceTimelineByRange(events: AuditTimelineEvent[], from: number, to: number): AuditTimelineEvent[] {
  return events.filter(e => e.timestamp >= from && e.timestamp <= to);
}

export interface TimelineStats {
  decisions: number;
  executions: number;
  blocks: number;
  revocations: number;
}

export function summarizeTimeline(events: AuditTimelineEvent[]): TimelineStats {
  let decisions = 0;
  let executions = 0;
  let blocks = 0;
  let revocations = 0;
  for (const e of events) {
    if (e.type === 'decision') decisions++;
    else if (e.type === 'execution') executions++;
    else if (e.type === 'block') blocks++;
    else if (e.type === 'revocation') revocations++;
  }
  return { decisions, executions, blocks, revocations };
}

