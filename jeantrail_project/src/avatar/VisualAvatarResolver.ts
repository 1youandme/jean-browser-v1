import { Emotion } from '../emotion/EmotionTypes';
import { AudioEnergyLevel } from '../presence/audio/AudioPresenceTypes';
import { SpeechOutput } from '../voice/VoiceTypes';
import { ColorProfile, LightingProfile, PresenceVisualState, VisualAvatarModel, VisualIdentity, ExpressionState } from './VisualAvatarTypes';

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function neutralColor(): ColorProfile {
  return {
    colorBalance: { r: 1, g: 1, b: 1 },
    exposure: 1,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    whitePoint: 1,
    blackPoint: 0
  };
}

function neutralLighting(): LightingProfile {
  return {
    ambient: 0.5,
    key: 0.5,
    fill: 0.5,
    rim: 0,
    shadowsEnabled: false
  };
}

function expressionForEmotion(e: Emotion): ExpressionState {
  if (e === 'happy') return 'smile';
  if (e === 'focused') return 'attentive';
  if (e === 'concerned') return 'concern';
  return 'neutral';
}

function brightnessFrom(audio: AudioEnergyLevel): number {
  if (audio === 'silent') return 0.5;
  if (audio === 'low') return clamp(0.55, 0.4, 0.7);
  if (audio === 'medium') return clamp(0.6, 0.4, 0.7);
  return clamp(0.65, 0.4, 0.7);
}

export function derivePresenceVisualState(emotion: Emotion, audioEnergyLevel: AudioEnergyLevel, speechPlan: SpeechOutput): PresenceVisualState {
  const expression = expressionForEmotion(emotion);
  const brightness = brightnessFrom(audioEnergyLevel);
  return { emotion, audioEnergyLevel, speechPlan, expression, brightness };
}

export function buildVisualAvatarModel(identity: VisualIdentity, emotion: Emotion): VisualAvatarModel {
  const colorProfile = neutralColor();
  const lightingProfile = neutralLighting();
  const expressionState = expressionForEmotion(emotion);
  return { identity, colorProfile, lightingProfile, expressionState };
}
