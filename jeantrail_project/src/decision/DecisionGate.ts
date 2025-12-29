import { DecisionOutcome, DecisionInput } from './DecisionTypes';
import { evaluatePolicy } from './DecisionPolicy';

export function decide(input: DecisionInput): DecisionOutcome {
  return evaluatePolicy(input);
}

