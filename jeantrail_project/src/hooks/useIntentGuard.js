/**
 * useIntentGuard
 *
 * Governance-first stub hook.
 * - Returns typed, readonly guard state without side effects.
 * - No business logic; does not override kernel authority.
 * - TODO(v2): Enforce policy outcomes and consent flows per intent.
 */
import { useKernelGovernance } from './useKernelGovernance';
function mapGovernanceStateToIntentStatus(state) {
    if (state === 'HALTED' || state === 'DENIED')
        return 'locked';
    if (state === 'PAUSED')
        return 'restricted';
    if (state === 'REVIEW_PENDING')
        return 'consent';
    return 'allowed';
}
function mapGovernanceStateToReason(state) {
    if (state === 'HALTED')
        return 'Execution halted by governance';
    if (state === 'DENIED')
        return 'Execution denied by governance';
    if (state === 'PAUSED')
        return 'Execution paused';
    if (state === 'REVIEW_PENDING')
        return 'Approval required';
    if (state === 'IDLE')
        return 'Not approved';
    return null;
}
export function useIntentGuard(intent) {
    const { state } = useKernelGovernance();
    const guard = Object.freeze({
        disabled: mapGovernanceStateToIntentStatus(state) !== 'allowed',
        reason: mapGovernanceStateToReason(state),
        status: mapGovernanceStateToIntentStatus(state)
    });
    return guard;
}
