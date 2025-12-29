import { JeanPresenceState } from '../jean-runtime/state/JeanPresenceStateMachine';
import { IntentSignals, IntentType } from './IntentTypes';

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function detectIntent(signals: IntentSignals): IntentType {
  const energy = clamp01(signals.audioEnergyLevel);
  const silence = Math.max(0, Math.floor(signals.silenceDurationMs));
  const spikes = Math.max(0, signals.spikeFrequencyHz);
  const presence = signals.presenceState;

  // Deterministic thresholds
  const HIGH_ENERGY = 0.6;
  const MID_ENERGY = 0.4;
  const LOW_ENERGY = 0.2;
  const SHORT_SILENCE_MS = 400;
  const LONG_SILENCE_MS = 1500;
  const HIGH_SPIKES_HZ = 4.0;
  const MID_SPIKES_HZ = 3.0;

  // Priority order is deterministic
  if (presence === JeanPresenceState.RESPONDING) {
    if (energy >= HIGH_ENERGY && silence < SHORT_SILENCE_MS) return IntentType.user_calling;
    if (spikes >= HIGH_SPIKES_HZ) return IntentType.interruption;
    return IntentType.user_calling;
  }

  if (presence === JeanPresenceState.OBSERVING) {
    if (spikes >= MID_SPIKES_HZ && energy >= MID_ENERGY) return IntentType.interruption;
    if (silence >= LONG_SILENCE_MS && energy <= LOW_ENERGY) return IntentType.user_waiting;
    return IntentType.user_waiting;
  }

  // presence === IDLE
  if (energy >= HIGH_ENERGY || spikes >= HIGH_SPIKES_HZ) return IntentType.background_noise;
  if (silence >= LONG_SILENCE_MS && energy <= LOW_ENERGY) return IntentType.background_noise;
  return IntentType.background_noise;
}
