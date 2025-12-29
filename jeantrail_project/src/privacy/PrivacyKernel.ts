import { DataScope, isCrossScopeRead, normalizeScope, requiresPersistentOptIn } from './DataScope';
import { ConsentPurpose, SovereignConsentToken, hasConsent } from './SovereignConsent';
import { ExecutionContextId } from '../runtime/ExecutionContextTypes';
import { PrivacyAuditEvent, createAuditEvent } from './PrivacyAudit';

export interface PrivacyRequest {
  purpose: ConsentPurpose;
  fromScope: DataScope;
  targetScope: DataScope;
  contextId?: ExecutionContextId;
  persistentOptIn?: boolean;
}

export interface PrivacyDecision {
  allowed: boolean;
  reason?: string;
  audit: PrivacyAuditEvent;
}

export function evaluatePrivacy(request: PrivacyRequest, token: SovereignConsentToken | null): PrivacyDecision {
  const target = normalizeScope(request.targetScope);
  const from = normalizeScope(request.fromScope);
  const consentOk = hasConsent(token, request.purpose, { scope: target, contextId: request.contextId });
  if (!consentOk) {
    const audit = createAuditEvent('deny', request.purpose, target, request.contextId, 'consent_required');
    return { allowed: false, reason: 'consent_required', audit };
  }
  if (isCrossScopeRead(from, target)) {
    const audit = createAuditEvent('deny', request.purpose, target, request.contextId, 'cross_scope_read');
    return { allowed: false, reason: 'cross_scope_read', audit };
  }
  if (requiresPersistentOptIn(target, request.persistentOptIn === true)) {
    const audit = createAuditEvent('deny', request.purpose, target, request.contextId, 'persistent_opt_in_required');
    return { allowed: false, reason: 'persistent_opt_in_required', audit };
  }
  const audit = createAuditEvent('allow', request.purpose, target, request.contextId);
  return { allowed: true, audit };
}
