import { SpeechOutput, VoiceTone } from './VoiceTypes';

function selectTone(intent: string): VoiceTone {
  const i = (intent || '').toLowerCase();
  if (i.includes('interruption') || i.includes('urgent') || i.includes('alert') || i.includes('warning')) return 'serious';
  if (i.includes('user_waiting') || i.includes('wait') || i.includes('calm')) return 'calm';
  if (i.includes('celebrat') || i.includes('success') || i.includes('win') || i.includes('achievement')) return 'excited';
  return 'neutral';
}

export function planSpeech(text: string, intent: string): SpeechOutput {
  const tone = selectTone(intent);
  return { text, tone, language: 'en' };
}

