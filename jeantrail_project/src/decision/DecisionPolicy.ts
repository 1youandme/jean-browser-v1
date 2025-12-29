import { DecisionOutcome, DecisionInput } from './DecisionTypes';

export function evaluatePolicy(input: DecisionInput): DecisionOutcome {
  if (input.presenceState === 'idle') return DecisionOutcome.hold;
  if (input.thoughtsCount === 0) return DecisionOutcome.hold;
  if (input.avgConfidence < 0.4) return DecisionOutcome.hold;
  if (input.intent === 'background_noise') return DecisionOutcome.block;
  return DecisionOutcome.allow;
}

