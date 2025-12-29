import { normalizeScope } from '../../privacy/DataScope';
import { InteractionActionSuggestion, InteractionContext, SearchActionType } from './InteractionActionTypes';

function scoreImageIntent(input: string): number {
  const t = input.toLowerCase();
  const hints = ['image', 'photo', 'picture', 'icon', 'logo', 'screenshot', 'png', 'jpg', 'jpeg', 'gif', 'svg'];
  let s = 0;
  for (const h of hints) {
    if (t.includes(h)) s += 0.2;
  }
  if (/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif|svg)\b/i.test(input)) s += 0.6;
  if (s > 1) s = 1;
  return s;
}

function scoreVoiceIntent(input: string, ctx?: InteractionContext): number {
  const t = input.toLowerCase();
  const hints = ['voice', 'audio', 'speak', 'talk', 'dictate', 'microphone'];
  let s = 0;
  for (const h of hints) {
    if (t.includes(h)) s += 0.25;
  }
  if (ctx?.voiceAvailable) s += 0.2;
  if (s > 1) s = 1;
  return s;
}

function scoreSpellCheck(input: string): number {
  const t = input.toLowerCase();
  let s = 0;
  const common = ['recieve', 'definately', 'seperate', 'occured', 'accomodate', 'publically', 'wich', 'adress', 'enviroment'];
  for (const w of common) {
    if (t.includes(w)) s += 0.5;
  }
  if (/(.)\1{2,}/.test(t)) s += 0.3;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const longWeird = words.filter(w => w.length > 14);
    if (longWeird.length > 0) s += 0.2;
  }
  if (s > 1) s = 1;
  return s;
}

export function resolveSearchActions(input: string, ctx: InteractionContext): InteractionActionSuggestion[] {
  const threshold = typeof ctx.sessionConfidence === 'number' ? Math.max(0.5, Math.min(0.8, ctx.sessionConfidence)) : 0.6;
  const scope = normalizeScope(ctx.privacyScope);
  const candidates: InteractionActionSuggestion[] = [];

  const imageScore = scoreImageIntent(input);
  if (imageScore >= threshold) {
    candidates.push({
      id: 'search_image',
      category: 'search',
      action: SearchActionType.image_search,
      confidence: imageScore,
      reason: 'visual_intent_detected',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const voiceScore = scoreVoiceIntent(input, ctx);
  if (voiceScore >= threshold) {
    candidates.push({
      id: 'search_voice',
      category: 'search',
      action: SearchActionType.voice_search,
      confidence: voiceScore,
      reason: 'voice_intent_detected',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const spellScore = scoreSpellCheck(input);
  if (spellScore >= threshold) {
    candidates.push({
      id: 'search_spell',
      category: 'search',
      action: SearchActionType.spell_check,
      confidence: spellScore,
      reason: 'possible_spelling_issues',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates.slice(0, 3);
}
