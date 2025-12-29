import { IntentType } from '../intent/IntentTypes';

export type ThoughtIntent = IntentType;
export type ThoughtStatus = 'pending' | 'expired' | 'resolved';

export interface ThoughtSlot {
  id: string;
  intent: ThoughtIntent;
  confidence: number;
  createdAt: number;
  expiresAt: number;
  status: ThoughtStatus;
}

