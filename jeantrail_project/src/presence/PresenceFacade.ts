import { AudioInputSignal } from './audio/AudioPresenceTypes';
import { evaluateAudioPresence } from './audio/AudioPresenceEvaluator';
import { planSpeech } from '../voice/VoicePlanner';
import { mapTextToPhonemes } from '../avatar/phoneme/PhonemeMapper';
import { resolveEmotion } from '../emotion/EmotionResolver';
import { DecisionOutcome } from '../decision/DecisionTypes';

export function buildPresence(intent: string, signal: AudioInputSignal, text: string) {
  const audioLevel = evaluateAudioPresence(signal);
  const speechPlan = planSpeech(text, intent);
  const phonemes = mapTextToPhonemes(text);
  const emotion = resolveEmotion(intent, DecisionOutcome.allow);
  return { audioLevel, speechPlan, phonemes, emotion };
}

