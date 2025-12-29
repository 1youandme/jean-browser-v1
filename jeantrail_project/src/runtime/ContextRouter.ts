import { ConsentToken, ContextAuditEvent, ContextSwitch, ExecutionContextId, ExecutionRequest, ExecutionRouteResult } from './ExecutionContextTypes';
import { getContextDescriptor } from './ContextCapabilities';

function nowIso(): string {
  return new Date().toISOString();
}

function newAuditId(): string {
  return `ctx-${Date.now().toString(36)}`;
}

export function routeExecution(request: ExecutionRequest, consent: ConsentToken | null): ExecutionRouteResult {
  const descriptor = getContextDescriptor(request.contextId);
  const hasConsent = !!consent && consent.contextId === request.contextId && !!consent.token;
  const crossMemoryOrigin = request.payload && typeof request.payload['memoryOrigin'] === 'string' ? (request.payload['memoryOrigin'] as string) : null;
  const crossMemoryViolation = !!crossMemoryOrigin && crossMemoryOrigin !== request.contextId;
  if (!hasConsent) {
    const audit: ContextAuditEvent = {
      id: newAuditId(),
      timestamp: nowIso(),
      event: 'route_rejected',
      contextId: request.contextId,
      details: { reason: 'consent_required' }
    };
    return { accepted: false, reason: 'consent_required', contextId: request.contextId, mode: 'symbolic', audit };
  }
  if (crossMemoryViolation) {
    const audit: ContextAuditEvent = {
      id: newAuditId(),
      timestamp: nowIso(),
      event: 'route_rejected',
      contextId: request.contextId,
      details: { reason: 'cross_context_memory' }
    };
    return { accepted: false, reason: 'cross_context_memory', contextId: request.contextId, mode: 'symbolic', audit };
  }
  const audit: ContextAuditEvent = {
    id: newAuditId(),
    timestamp: nowIso(),
    event: 'route_accepted',
    contextId: request.contextId,
    details: {
      capabilities: descriptor.capabilities.slice(),
      restrictions: descriptor.restrictions.slice(),
      auditBoundaries: descriptor.auditBoundaries.slice(),
      action: request.action
    }
  };
  return { accepted: true, reason: undefined, contextId: request.contextId, mode: 'symbolic', audit };
}

export function switchContext(from: ExecutionContextId, to: ExecutionContextId, consentToken?: string): ContextSwitch {
  const hasConsent = !!consentToken;
  const audit: ContextAuditEvent = {
    id: newAuditId(),
    timestamp: nowIso(),
    event: hasConsent ? 'switch_accepted' : 'switch_rejected',
    contextId: to,
    details: { from, to, consentProvided: hasConsent }
  };
  return { from, to, consentToken, audit };
}
