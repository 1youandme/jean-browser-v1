/**
 * PolicyOutcome contracts
 *
 * Governance-first outcome model:
 * - kinds are closed: ALLOW | DENY | HALT | REQUIRE_CONSENT
 * - codes are closed: see PolicyReasonCode
 * - outcomes are immutable once issued
 */
export enum PolicyReasonCode {
  OK = 'OK',
  GOVERNANCE_LOCK = 'GOVERNANCE_LOCK',
  EXPLICIT_CONSENT_REQUIRED = 'EXPLICIT_CONSENT_REQUIRED',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  INVALID_ISOLATION = 'INVALID_ISOLATION',
  MISSING_PERMISSION = 'MISSING_PERMISSION'
}

export type PolicyOutcomeKind = 'ALLOW' | 'DENY' | 'HALT' | 'REQUIRE_CONSENT';

export interface PolicyOutcome {
  kind: PolicyOutcomeKind;
  code: PolicyReasonCode;
  reason: string;
}

export type ImmutablePolicyOutcome = Readonly<PolicyOutcome>;

export function allow(reason = 'Allowed by policy'): ImmutablePolicyOutcome {
  return Object.freeze({ kind: 'ALLOW', code: PolicyReasonCode.OK, reason });
}

export function deny(code: PolicyReasonCode, reason: string): ImmutablePolicyOutcome {
  return Object.freeze({ kind: 'DENY', code, reason });
}

export function halt(code: PolicyReasonCode, reason: string): ImmutablePolicyOutcome {
  return Object.freeze({ kind: 'HALT', code, reason });
}

export function requireConsent(reason = 'Explicit consent required'): ImmutablePolicyOutcome {
  return Object.freeze({ kind: 'REQUIRE_CONSENT', code: PolicyReasonCode.EXPLICIT_CONSENT_REQUIRED, reason });
}
