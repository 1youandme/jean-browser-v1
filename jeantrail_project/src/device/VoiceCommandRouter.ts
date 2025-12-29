import { ParsedVoiceCommand, VoiceScope } from './VoiceCommandTypes';
import { DeviceProfile, isActionSupported, isActionRestricted, getDefaultDeviceProfile } from './DeviceProfile';
import { evaluatePrivacy, PrivacyDecision } from '../privacy/PrivacyKernel';
import { SovereignConsentToken } from '../privacy/SovereignConsent';
import { DataScope, normalizeScope } from '../privacy/DataScope';
import { ExecutionContextId, ExecutionRouteResult, ContextAuditEvent } from '../runtime/ExecutionContextTypes';

export interface VoiceRouteOptions {
  fromScope?: DataScope;
  targetScope?: DataScope;
  contextId?: ExecutionContextId;
  consentToken?: SovereignConsentToken | null;
  persistentOptIn?: boolean;
}

function mapScopeToContext(scope: VoiceScope): ExecutionContextId {
  if (scope === 'web') return 'web';
  if (scope === 'local') return 'local';
  return 'emulator';
}

function createAudit(event: string, contextId: ExecutionContextId, details?: Record<string, unknown>): ContextAuditEvent {
  const id = 'audit_' + Math.random().toString(36).slice(2);
  return { id, timestamp: new Date().toISOString(), event, contextId, details };
}

export interface VoiceRouteSuggestion {
  accepted: boolean;
  reason?: string;
  route: ExecutionRouteResult;
  command: ParsedVoiceCommand;
  privacy: PrivacyDecision;
  serviceHint?: string;
  apiHint?: string;
}

export function routeVoiceCommand(
  command: ParsedVoiceCommand,
  profile?: DeviceProfile,
  options?: VoiceRouteOptions
): VoiceRouteSuggestion {
  const device = profile ?? getDefaultDeviceProfile();
  const from = normalizeScope(options?.fromScope);
  const target = normalizeScope(options?.targetScope ?? 'ephemeral');
  const intendedContext = mapScopeToContext(command.scope);
  const contextId = options?.contextId ?? intendedContext;

  const privacy = evaluatePrivacy(
    {
      purpose: 'execution',
      fromScope: from,
      targetScope: target,
      contextId,
      persistentOptIn: options?.persistentOptIn
    },
    options?.consentToken ?? null
  );

  if (!options?.consentToken || !options.consentToken.explicit) {
    const audit = createAudit('deny_no_consent', contextId, { reason: 'explicit_consent_required' });
    return {
      accepted: false,
      reason: 'explicit_consent_required',
      route: { accepted: false, reason: 'explicit_consent_required', contextId, mode: 'symbolic', audit },
      command,
      privacy
    };
  }

  if (contextId !== intendedContext) {
    const audit = createAudit('deny_context_mismatch', contextId, { intendedContext, providedContext: contextId });
    return {
      accepted: false,
      reason: 'context_mismatch',
      route: { accepted: false, reason: 'context_mismatch', contextId, mode: 'symbolic', audit },
      command,
      privacy
    };
  }

  if (!privacy.allowed) {
    const audit = createAudit('deny_privacy', contextId, { privacyReason: privacy.reason });
    return {
      accepted: false,
      reason: privacy.reason ?? 'privacy_denied',
      route: { accepted: false, reason: privacy.reason, contextId, mode: 'symbolic', audit },
      command,
      privacy
    };
  }

  if (isActionRestricted(device, command.actionType)) {
    const audit = createAudit('deny_restricted', contextId, { action: command.actionType });
    return {
      accepted: false,
      reason: 'action_restricted',
      route: { accepted: false, reason: 'action_restricted', contextId, mode: 'symbolic', audit },
      command,
      privacy
    };
  }

  if (!isActionSupported(device, command.actionType)) {
    const audit = createAudit('deny_unsupported', contextId, { action: command.actionType, deviceType: device.type });
    return {
      accepted: false,
      reason: 'unsupported_action_or_unknown_device',
      route: { accepted: false, reason: 'unsupported_action_or_unknown_device', contextId, mode: 'symbolic', audit },
      command,
      privacy
    };
  }

  const audit = createAudit('allow_symbolic_route', contextId, {
    action: command.actionType,
    target: command.target,
    scope: command.scope,
    confidence: command.confidence
  });

  return {
    accepted: true,
    route: { accepted: true, contextId, mode: 'symbolic', audit },
    command,
    privacy,
    serviceHint: 'compatible_with_future_services',
    apiHint: 'no_hard_dependencies'
  };
}
