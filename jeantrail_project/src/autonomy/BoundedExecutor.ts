import { ActionType, EligibilityDecision } from '../action/ActionTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { executeAction } from '../executor/ControlledExecutor';
import { AutonomyMode, AutonomyResult } from './AutonomyTypes';
import { checkBudget } from './AutonomyBudget';

export function executeWithAutonomy(
  action: ActionType,
  decision: DecisionOutcome,
  eligibility: EligibilityDecision,
  autonomyMode: AutonomyMode,
  executionCount: number,
  executionLimit: number
): AutonomyResult {
  if (autonomyMode === 'disabled') return 'autonomy_disabled';
  if (autonomyMode === 'manual') return 'rejected';
  if (!checkBudget(executionCount, executionLimit)) return 'quota_exceeded';
  const r = executeAction(action, decision, eligibility);
  if (r === 'executed') return 'executed';
  return 'rejected';
}

