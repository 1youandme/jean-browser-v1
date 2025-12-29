import { JeanPresenceState } from '../jean-runtime/state/JeanPresenceStateMachine';

export enum IntentType {
  user_calling = 'user_calling',
  user_waiting = 'user_waiting',
  interruption = 'interruption',
  background_noise = 'background_noise'
}

export interface IntentSignals {
  presenceState: JeanPresenceState;
  audioEnergyLevel: number; // 0.0 .. 1.0
  silenceDurationMs: number;
  spikeFrequencyHz: number;
}
