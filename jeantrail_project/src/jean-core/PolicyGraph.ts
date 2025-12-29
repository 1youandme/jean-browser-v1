export type CoreDecisionType = 'route' | 'policy' | 'explanation' | 'block' | 'consent';
export const POLICY_GRAPH: Record<CoreDecisionType, string> = {
  route: 'ui_explanation',
  policy: 'respect_freeze',
  explanation: 'explain_context',
  block: 'block_and_explain',
  consent: 'seek_consent_nonbinding'
};
export function evaluatePolicy(decision_type: CoreDecisionType, context: string): string {
  return POLICY_GRAPH[decision_type] ?? 'observe';
}
