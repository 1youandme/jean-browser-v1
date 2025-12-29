export type AudioEnergyLevel = 'silent' | 'low' | 'medium' | 'high';
export interface AudioInputSignal {
  energy: number;
  frequencyHz?: number;
  durationMs: number;
}

