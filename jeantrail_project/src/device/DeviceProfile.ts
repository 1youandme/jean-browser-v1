import { VoiceActionType } from './VoiceCommandTypes';

export type DeviceType = 'phone' | 'desktop' | 'tablet' | 'unknown';

export interface DeviceProfile {
  type: DeviceType;
  supportedActions: VoiceActionType[];
  restrictedActions: VoiceActionType[];
}

export function getDefaultDeviceProfile(): DeviceProfile {
  return {
    type: 'unknown',
    supportedActions: [],
    restrictedActions: []
  };
}

export function isActionSupported(profile: DeviceProfile, action: VoiceActionType): boolean {
  if (!profile || profile.type === 'unknown') return false;
  if (profile.restrictedActions.includes(action)) return false;
  return profile.supportedActions.includes(action);
}

export function isActionRestricted(profile: DeviceProfile, action: VoiceActionType): boolean {
  if (!profile) return true;
  return profile.restrictedActions.includes(action);
}
