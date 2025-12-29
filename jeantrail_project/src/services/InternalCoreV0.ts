import { NinjaDecisionType, NinjaAdvisoryResponse, NinjaDecisionQuery } from './NinjaDecisionAdapter';

function mapDecision(type: NinjaDecisionType): string {
  if (type === 'route') return 'ui_explanation';
  if (type === 'policy') return 'respect_freeze';
  if (type === 'explanation') return 'explain_context';
  if (type === 'block') return 'block_and_explain';
  if (type === 'consent') return 'seek_consent_nonbinding';
  return 'observe';
}

export function evaluateDecision(query: NinjaDecisionQuery): NinjaAdvisoryResponse {
  const now = new Date().toISOString();
  return {
    timestamp: now,
    context: query.context,
    decision_type: query.decision_type,
    advisory: mapDecision(query.decision_type),
    advisory_id: 'internal-' + Buffer.from(query.context + '|' + query.decision_type).toString('base64').slice(0, 8)
  };
}
