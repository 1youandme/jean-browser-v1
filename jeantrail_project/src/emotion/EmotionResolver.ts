import { Emotion } from './EmotionTypes';
import { DecisionOutcome } from '../decision/DecisionTypes';
import { IntentType } from '../intent/IntentTypes';

function normalizeIntent(i: IntentType | string): string {
  return String(i).toLowerCase();
}

export function resolveEmotion(intent: IntentType | string, decision: DecisionOutcome): Emotion {
  if (decision === DecisionOutcome.block) return 'concerned';
  if (decision === DecisionOutcome.hold) return 'focused';
  const t = normalizeIntent(intent);
  if (t.includes('interruption')) return 'concerned';
  if (t.includes('background_noise')) return 'neutral';
  if (t.includes('user_waiting')) return 'focused';
  if (t.includes('user_calling')) return 'happy';
  return 'neutral';
}

