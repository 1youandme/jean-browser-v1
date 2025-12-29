import { AgentPermissionScope, KNOWN_SCOPES } from '../agents/AgentPermissions';

export type OnboardingStepType = 'info' | 'consent' | 'review';

export interface ConsentToggle {
  scope: AgentPermissionScope;
  label: string;
  defaultEnabled: false;
}

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  content: string[];
  requiresAcknowledge?: boolean;
  consentOptions?: ConsentToggle[];
}

export interface OnboardingFlow {
  steps: OnboardingStep[];
}

export interface ConsentSelection {
  selections: Record<AgentPermissionScope, boolean>;
}

export interface ConsentSummary {
  optedInScopes: AgentPermissionScope[];
  declinedScopes: AgentPermissionScope[];
}

export function buildPermissionOptions(): ConsentToggle[] {
  return KNOWN_SCOPES.map(s => ({
    scope: s,
    label: s.replace(/_/g, ' '),
    defaultEnabled: false
  }));
}

export function getDefaultOnboardingFlow(): OnboardingFlow {
  const sovereignty: OnboardingStep = {
    id: 'sovereignty',
    type: 'info',
    title: 'Your Sovereignty',
    content: [
      'You are the root authority.',
      'No background execution.',
      'Tabs are sovereign and isolated.'
    ],
    requiresAcknowledge: true
  };
  const permissions: OnboardingStep = {
    id: 'permissions',
    type: 'consent',
    title: 'Permissions',
    content: [
      'Permissions are requested and revocable.',
      'No permission inheritance.',
      'Nothing is enabled by default.'
    ],
    consentOptions: buildPermissionOptions()
  };
  const transparency: OnboardingStep = {
    id: 'transparency',
    type: 'review',
    title: 'Transparency',
    content: [
      'You will see explanations for suggestions and actions.',
      'What data was used and not used is clearly stated.',
      'You can dismiss overlays at any time.'
    ]
  };
  return { steps: [sovereignty, permissions, transparency] };
}

export function summarizeConsent(selection: ConsentSelection): ConsentSummary {
  const optedInScopes: AgentPermissionScope[] = [];
  const declinedScopes: AgentPermissionScope[] = [];
  for (const scope of KNOWN_SCOPES) {
    const v = selection.selections[scope] === true;
    if (v) optedInScopes.push(scope);
    else declinedScopes.push(scope);
  }
  return { optedInScopes, declinedScopes };
}

