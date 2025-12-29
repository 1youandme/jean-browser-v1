import { Emotion } from '../emotion/EmotionTypes';
import { AudioEnergyLevel } from '../presence/audio/AudioPresenceTypes';
import { SpeechOutput } from '../voice/VoiceTypes';

export type ExpressionState = 'neutral' | 'smile' | 'attentive' | 'concern';

export interface ColorProfile {
  colorBalance: { r: number; g: number; b: number };
  exposure: number;
  contrast: number;
  saturation: number;
  gamma: number;
  whitePoint: number;
  blackPoint: number;
}

export interface LightingProfile {
  ambient: number;
  key: number;
  fill: number;
  rim: number;
  shadowsEnabled: boolean;
}

export interface VisualIdentity {
  id: string;
  name: string;
}

export interface VisualAvatarModel {
  identity: VisualIdentity;
  colorProfile: ColorProfile;
  lightingProfile: LightingProfile;
  expressionState: ExpressionState;
}

export interface PresenceVisualState {
  emotion: Emotion;
  audioEnergyLevel: AudioEnergyLevel;
  speechPlan: SpeechOutput;
  expression: ExpressionState;
  brightness: number;
}
