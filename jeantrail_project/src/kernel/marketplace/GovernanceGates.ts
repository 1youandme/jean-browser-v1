import { allow, deny, requireConsent, PolicyReasonCode, type ImmutablePolicyOutcome } from '../PolicyOutcome';
import type { MarketplaceModel } from './Manifest';
import type { PermissionName } from '../Intent';

export interface InstallConsent {
  accepted: boolean;
  acceptedPermissions: ReadonlyArray<PermissionName>;
}

export function evaluateInstall(model: MarketplaceModel, consent: InstallConsent): ImmutablePolicyOutcome {
  if (!consent.accepted) return requireConsent('Explicit consent required for model installation');
  const needed = model.requiredPermissions || [];
  const acceptedSet = new Set(consent.acceptedPermissions || []);
  const missing = needed.filter(p => !acceptedSet.has(p));
  if (missing.length > 0) return deny(PolicyReasonCode.MISSING_PERMISSION, `Missing permissions: ${missing.join(', ')}`);
  if (model.isDefault !== false) return deny(PolicyReasonCode.GOVERNANCE_LOCK, 'Default models are not permitted');
  return allow('Model installation approved');
}

export function evaluateSetDefaultAttempt(): ImmutablePolicyOutcome {
  return deny(PolicyReasonCode.GOVERNANCE_LOCK, 'Setting default models is prohibited');
}

