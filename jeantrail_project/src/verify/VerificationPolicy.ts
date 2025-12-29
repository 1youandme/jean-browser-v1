import { VerificationResult } from './VerificationTypes';

export type VerificationPolicyDecision = 'trust' | 'rework' | 'refuse';

export function applyVerificationPolicy(result: VerificationResult): VerificationPolicyDecision {
  if (result === 'pass') return 'trust';
  if (result === 'warn') return 'rework';
  return 'refuse';
}

