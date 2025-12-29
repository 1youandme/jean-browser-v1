import { ActionType, EligibilityDecision, PresenceState } from './ActionTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';

export function evaluateActionEligibility(
  action: ActionType,
  decision: DecisionOutcome,
  presenceState: PresenceState
): EligibilityDecision {
  if (decision === DecisionOutcome.block) return 'denied';
  if (decision === DecisionOutcome.hold && action === ActionType.speak) return 'denied';
  if (decision === DecisionOutcome.allow) return 'allowed';
  return 'denied';
}

