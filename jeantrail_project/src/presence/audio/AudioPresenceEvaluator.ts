import { AudioEnergyLevel, AudioInputSignal } from './AudioPresenceTypes';

export function evaluateAudioPresence(signal: AudioInputSignal): AudioEnergyLevel {
  const e = Math.max(0, Math.min(1, signal.energy));
  if (e <= 0.01) return 'silent';
  if (e < 0.3) return 'low';
  if (e < 0.6) return 'medium';
  return 'high';
}

