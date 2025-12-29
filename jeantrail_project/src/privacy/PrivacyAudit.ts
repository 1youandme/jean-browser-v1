import { DataScope } from './DataScope';
import { ConsentPurpose } from './SovereignConsent';
import { ExecutionContextId } from '../runtime/ExecutionContextTypes';

export interface PrivacyAuditEvent {
  id: string;
  timestamp: string;
  decision: 'allow' | 'deny';
  purpose: ConsentPurpose;
  scope: DataScope;
  contextId?: ExecutionContextId;
  reason?: string;
}

export interface PrivacyAuditReport {
  id: string;
  timestamp: string;
  events: PrivacyAuditEvent[];
  summary: {
    allowed: number;
    denied: number;
  };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createAuditEvent(
  decision: 'allow' | 'deny',
  purpose: ConsentPurpose,
  scope: DataScope,
  contextId?: ExecutionContextId,
  reason?: string
): PrivacyAuditEvent {
  return {
    id: newId('audit'),
    timestamp: nowIso(),
    decision,
    purpose,
    scope,
    contextId,
    reason
  };
}

export function createAuditReport(events: PrivacyAuditEvent[]): PrivacyAuditReport {
  const allowed = events.filter(e => e.decision === 'allow').length;
  const denied = events.length - allowed;
  return {
    id: newId('report'),
    timestamp: nowIso(),
    events: events.slice(),
    summary: { allowed, denied }
  };
}
