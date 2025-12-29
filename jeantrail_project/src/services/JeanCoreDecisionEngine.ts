import { CoreDecisionType, evaluatePolicy } from '../jean-core/PolicyGraph';
import { AdvisoryEntry, createMemoryView } from '../jean-core/MemorySchema_v1';
export interface CoreDecisionQuery {
  context: string;
  decision_type: CoreDecisionType;
  payload?: Record<string, unknown>;
}
export interface CoreDecision {
  timestamp: string;
  context: string;
  decision_type: CoreDecisionType;
  decision: string;
}
export function evaluateCore(query: CoreDecisionQuery, reference?: AdvisoryEntry[]): CoreDecision {
  const decision = evaluatePolicy(query.decision_type, query.context);
  if (reference) {
    createMemoryView(reference);
  }
  return {
    timestamp: new Date().toISOString(),
    context: query.context,
    decision_type: query.decision_type,
    decision
  };
}
