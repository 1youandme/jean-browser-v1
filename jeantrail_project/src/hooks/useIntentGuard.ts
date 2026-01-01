/**
 * useIntentGuard
 *
 * Governance-first stub hook.
 * - Returns typed, readonly guard state without side effects.
 * - No business logic; does not override kernel authority.
 * - TODO(v2): Enforce policy outcomes and consent flows per intent.
 */
import { useKernelGovernance } from './useKernelGovernance';
import type { Intent } from '@/kernel/Intent';
import type { GovernanceState } from '@/domain/governance/types';

export interface IntentGuard {
  disabled: boolean;
  reason: string | null;
  status: 'locked' | 'restricted' | 'consent' | 'allowed';
}

function mapGovernanceStateToIntentStatus(state: GovernanceState): IntentGuard['status'] {
  if (state === 'HALTED' || state === 'DENIED') return 'locked';
  if (state === 'PAUSED') return 'restricted';
  if (state === 'REVIEW_PENDING') return 'consent';
  return 'allowed';
}

function mapGovernanceStateToReason(state: GovernanceState): string | null {
  if (state === 'HALTED') return 'Execution halted by governance';
  if (state === 'DENIED') return 'Execution denied by governance';
  if (state === 'PAUSED') return 'Execution paused';
  if (state === 'REVIEW_PENDING') return 'Approval required';
  if (state === 'IDLE') return 'Not approved';
  return null;
}

export function useIntentGuard(intent?: Intent): IntentGuard {
  const { state } = useKernelGovernance();
  const guard: Readonly<IntentGuard> = Object.freeze({
    disabled: mapGovernanceStateToIntentStatus(state as GovernanceState) !== 'allowed',
    reason: mapGovernanceStateToReason(state as GovernanceState),
    status: mapGovernanceStateToIntentStatus(state as GovernanceState)
  });
  return guard as IntentGuard;
}
