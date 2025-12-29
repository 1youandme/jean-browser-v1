export enum DecisionOutcome {
  allow = 'allow',
  hold = 'hold',
  block = 'block'
}

export interface DecisionInput {
  intent: string;
  thoughtsCount: number;
  avgConfidence: number;
  presenceState: 'idle' | 'observing' | 'responding';
}

