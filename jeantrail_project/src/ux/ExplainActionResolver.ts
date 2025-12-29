import { KernelIntrospection, DecisionTrace } from '../kernel/KernelIntrospection';
import { OSExecutionAuditEvent } from '../os/ExecutionAudit';

export interface ExplainResolution {
  action: OSExecutionAuditEvent;
  decision?: DecisionTrace;
  explanation: string;
  matched: boolean;
}

function closestPriorDecision(decisions: DecisionTrace[], ts: number): DecisionTrace | undefined {
  const priors = decisions.filter(d => d.timestamp <= ts && d.outcome !== 'rejected');
  priors.sort((a, b) => b.timestamp - a.timestamp);
  return priors[0];
}

export async function explainByAudit(
  introspection: KernelIntrospection,
  action: OSExecutionAuditEvent,
  searchLimit = 100
): Promise<ExplainResolution> {
  const history = await introspection.getDecisionHistory(searchLimit);
  const candidate = closestPriorDecision(history, Date.parse(action.timestamp));
  if (!candidate) {
    return {
      action,
      explanation: 'No matching decision found prior to this action.',
      matched: false
    };
  }
  const text = await introspection.explainDecision(candidate.decisionId);
  return {
    action,
    decision: candidate,
    explanation: text,
    matched: true
  };
}

export async function explainByDecisionId(
  introspection: KernelIntrospection,
  decisionId: string,
  action: OSExecutionAuditEvent
): Promise<ExplainResolution> {
  const text = await introspection.explainDecision(decisionId);
  const history = await introspection.getDecisionHistory(200);
  const decision = history.find(d => d.decisionId === decisionId);
  return {
    action,
    decision,
    explanation: text,
    matched: !!decision
  };
}
