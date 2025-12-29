import { ActionType, EligibilityDecision, PresenceState } from './ActionTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { evaluateActionEligibility } from './ActionPolicy';

export function isActionAllowed(
  action: ActionType,
  decision: DecisionOutcome,
  presenceState: PresenceState
): EligibilityDecision {
  return evaluateActionEligibility(action, decision, presenceState);
}

