import { ActionType, EligibilityDecision } from '../action/ActionTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { ExecutionResult } from './ExecutorTypes';

export function executeAction(
  action: ActionType,
  decision: DecisionOutcome,
  eligibility: EligibilityDecision,
  mode: 'symbolic' | 'real' = 'symbolic'
): ExecutionResult {
  if (mode !== 'symbolic') return 'blocked';
  if (decision === DecisionOutcome.block) return 'blocked';
  if (eligibility !== 'allowed') return 'blocked';
  return 'blocked';
}
