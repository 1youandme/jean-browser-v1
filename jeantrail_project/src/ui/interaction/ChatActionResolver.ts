import { normalizeScope } from '../../privacy/DataScope';
import { ChatActionType, InteractionActionSuggestion, InteractionContext } from './InteractionActionTypes';

function scoreVoiceInput(message: string, ctx?: InteractionContext): number {
  const t = message.toLowerCase();
  const hints = ['voice', 'audio', 'speak', 'talk', 'dictate', 'microphone'];
  let s = 0;
  for (const h of hints) {
    if (t.includes(h)) s += 0.25;
  }
  if (ctx?.voiceAvailable) s += 0.2;
  if (s > 1) s = 1;
  return s;
}

function scoreScreenContext(message: string, ctx?: InteractionContext): number {
  const t = message.toLowerCase();
  const hints = ['on screen', 'this page', 'tab', 'window', 'panel', 'dashboard', 'viewer', 'screen'];
  let s = 0;
  for (const h of hints) {
    if (t.includes(h)) s += 0.2;
  }
  if (ctx?.screenAvailable) s += 0.2;
  if (s > 1) s = 1;
  return s;
}

function scoreClarifyIntent(message: string, ctx?: InteractionContext): number {
  const t = message.toLowerCase();
  let s = 0;
  if (t.length < 10) s += 0.4;
  const ambiguous = ['it', 'that', 'this', 'thing', 'stuff'];
  for (const a of ambiguous) {
    if (t.includes(a)) s += 0.2;
  }
  if (typeof ctx?.sessionConfidence === 'number' && ctx.sessionConfidence < 0.5) s += 0.3;
  if (s > 1) s = 1;
  return s;
}

function scoreSummarizeContext(message: string, ctx?: InteractionContext): number {
  const t = message.toLowerCase();
  let s = 0;
  if (t.length > 200) s += 0.5;
  if (ctx?.intentHints && ctx.intentHints.includes('summary')) s += 0.3;
  const hints = ['summarize', 'summary', 'condense', 'tl;dr'];
  for (const h of hints) {
    if (t.includes(h)) s += 0.3;
  }
  if (s > 1) s = 1;
  return s;
}

function scoreSwitchWorkspace(message: string): number {
  const t = message.toLowerCase();
  const hints = ['switch workspace', 'change workspace', 'move to', 'open workspace', 'project workspace', 'workspace'];
  let s = 0;
  for (const h of hints) {
    if (t.includes(h)) s += 0.2;
  }
  if (/\bworkspace\s+\w+/.test(t)) s += 0.3;
  if (s > 1) s = 1;
  return s;
}

export function resolveChatActions(message: string, ctx: InteractionContext): InteractionActionSuggestion[] {
  const threshold = typeof ctx.sessionConfidence === 'number' ? Math.max(0.5, Math.min(0.8, ctx.sessionConfidence)) : 0.6;
  const scope = normalizeScope(ctx.privacyScope);
  const candidates: InteractionActionSuggestion[] = [];

  const voiceScore = scoreVoiceInput(message, ctx);
  if (voiceScore >= threshold) {
    candidates.push({
      id: 'chat_voice_input',
      category: 'chat',
      action: ChatActionType.voice_input,
      confidence: voiceScore,
      reason: 'voice_input_intent',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const screenScore = scoreScreenContext(message, ctx);
  if (screenScore >= threshold) {
    candidates.push({
      id: 'chat_screen_context',
      category: 'chat',
      action: ChatActionType.screen_context,
      confidence: screenScore,
      reason: 'screen_context_relevant',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const clarifyScore = scoreClarifyIntent(message, ctx);
  if (clarifyScore >= threshold) {
    candidates.push({
      id: 'chat_clarify_intent',
      category: 'chat',
      action: ChatActionType.clarify_intent,
      confidence: clarifyScore,
      reason: 'ambiguity_detected',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const summarizeScore = scoreSummarizeContext(message, ctx);
  if (summarizeScore >= threshold) {
    candidates.push({
      id: 'chat_summarize_context',
      category: 'chat',
      action: ChatActionType.summarize_context,
      confidence: summarizeScore,
      reason: 'summary_suggested',
      scope,
      nonBlocking: true,
      dismissible: true,
      optional: true,
      visible: true
    });
  }

  const switchScore = scoreSwitchWorkspace(message);
  if (switchScore >= threshold) {
    candidates.push({
      id: 'chat_switch_workspace',
      category: 'chat',
      action: ChatActionType.switch_workspace,
      confidence: switchScore,
      reason: 'workspace_switch_intent',
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
