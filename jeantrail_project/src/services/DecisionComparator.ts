import { NinjaDecisionQuery, NinjaAdvisoryResponse, sendAdvisory } from './NinjaDecisionAdapter';
import { evaluateDecision } from './InternalCoreV0';

export interface DecisionDiff {
  context: string;
  decision_type: string;
  ninja_advisory: string;
  internal_advisory: string;
  equal: boolean;
  timestamp: string;
}

export async function compare(query: NinjaDecisionQuery): Promise<DecisionDiff> {
  const a: NinjaAdvisoryResponse = await sendAdvisory(query);
  const b: NinjaAdvisoryResponse = evaluateDecision(query);
  const equal = a.advisory === b.advisory;
  return {
    context: query.context,
    decision_type: query.decision_type,
    ninja_advisory: a.advisory,
    internal_advisory: b.advisory,
    equal,
    timestamp: new Date().toISOString()
  };
}
