import { VerificationResult } from '../verify/VerificationTypes';
import { AutonomyMode } from '../autonomy/AutonomyTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { EligibilityDecision } from '../action/ActionTypes';
import { allowWiring } from './WiringPolicy';

export interface ExecutionReadinessState {
  verification: VerificationResult;
  autonomy: AutonomyMode;
  decision: DecisionOutcome;
  eligibility: EligibilityDecision;
  budgetOk?: boolean;
}

export function isReadyForExecution(state: ExecutionReadinessState): boolean {
  if (!allowWiring(state.verification, state.autonomy)) return false;
  if (state.decision !== DecisionOutcome.allow) return false;
  if (state.eligibility !== 'allowed') return false;
  if (state.budgetOk === false) return false;
  return true;
}

