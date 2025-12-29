export type VoiceTone = 'neutral' | 'calm' | 'excited' | 'serious';
export interface SpeechOutput {
  text: string;
  tone: VoiceTone;
  language: string;
}

