import { ActionType, EligibilityDecision } from '../action/ActionTypes';
import { AutonomyMode, AutonomyResult } from '../autonomy/AutonomyTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { IntentType } from '../intent/IntentTypes';

export type KernelPresence = 'idle' | 'observing' | 'responding';

export interface KernelSignals {
  presenceState: KernelPresence;
  audioEnergyLevel: number;
  silenceDurationMs: number;
  spikeFrequencyHz: number;
}

export interface KernelInput {
  signals: KernelSignals;
  thoughtsCount: number;
  avgConfidence: number;
  action: ActionType;
  autonomyMode: AutonomyMode;
  executionCount: number;
  executionLimit: number;
}

export interface KernelOutput {
  intent: IntentType;
  decision: DecisionOutcome;
  eligibility: EligibilityDecision;
  executionResult: AutonomyResult;
}

