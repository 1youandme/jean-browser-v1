export type VoiceActionType = 'call' | 'search' | 'open' | 'play' | 'control';
export type VoiceTargetType = 'app' | 'system' | 'web' | 'contact' | 'service';
export type VoiceScope = 'local' | 'web' | 'device';

export interface ParsedVoiceCommand {
  actionType: VoiceActionType;
  target: VoiceTargetType;
  scope: VoiceScope;
  confidence: number;
  reason: string;
  text: string;
}

function scoreAction(text: string, keywords: string[], base = 0.4): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const k of keywords) {
    if (t.includes(k)) s += base;
  }
  if (s > 1) s = 1;
  return s;
}

function detectActionType(text: string): { actionType: VoiceActionType; confidence: number; reason: string } {
  const candidates: Array<{ type: VoiceActionType; score: number; reason: string }> = [
    { type: 'call', score: scoreAction(text, ['call', 'dial', 'ring']), reason: 'call_keywords' },
    { type: 'search', score: scoreAction(text, ['search', 'find', 'lookup', 'query'], 0.35), reason: 'search_keywords' },
    { type: 'open', score: scoreAction(text, ['open', 'launch', 'start']), reason: 'open_keywords' },
    { type: 'play', score: scoreAction(text, ['play', 'listen', 'watch'], 0.35), reason: 'play_keywords' },
    { type: 'control', score: scoreAction(text, ['turn on', 'turn off', 'increase', 'decrease', 'set']), reason: 'control_keywords' }
  ];
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  return { actionType: top.type, confidence: top.score, reason: top.reason };
}

function detectTarget(text: string): { target: VoiceTargetType; confidence: number; reason: string } {
  const t = text.toLowerCase();
  const targetCandidates: Array<{ target: VoiceTargetType; score: number; reason: string }> = [
    { target: 'app', score: scoreAction(t, ['app', 'application', 'spotify', 'youtube', 'browser'], 0.3), reason: 'app_keywords' },
    { target: 'system', score: scoreAction(t, ['settings', 'brightness', 'volume', 'wifi', 'bluetooth', 'system'], 0.3), reason: 'system_keywords' },
    { target: 'web', score: scoreAction(t, ['website', 'web', 'http', 'https', 'open google', 'search web'], 0.3), reason: 'web_keywords' },
    { target: 'contact', score: scoreAction(t, ['call mom', 'call dad', 'message john', 'contact'], 0.3), reason: 'contact_keywords' },
    { target: 'service', score: scoreAction(t, ['service', 'assistant', 'api', 'provider'], 0.3), reason: 'service_keywords' }
  ];
  targetCandidates.sort((a, b) => b.score - a.score);
  const top = targetCandidates[0];
  return { target: top.target, confidence: top.score, reason: top.reason };
}

function detectScope(text: string): { scope: VoiceScope; confidence: number; reason: string } {
  const t = text.toLowerCase();
  const candidates: Array<{ scope: VoiceScope; score: number; reason: string }> = [
    { scope: 'local', score: scoreAction(t, ['settings', 'volume', 'brightness', 'app', 'open'], 0.25), reason: 'local_signals' },
    { scope: 'web', score: scoreAction(t, ['website', 'search', 'browser', 'web', 'http', 'https'], 0.25), reason: 'web_signals' },
    { scope: 'device', score: scoreAction(t, ['bluetooth', 'wifi', 'dial', 'ring', 'camera'], 0.25), reason: 'device_signals' }
  ];
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  return { scope: top.scope, confidence: top.score, reason: top.reason };
}

export function parseVoiceIntent(transcript: string): ParsedVoiceCommand[] {
  const action = detectActionType(transcript);
  const target = detectTarget(transcript);
  const scope = detectScope(transcript);
  const combinedConfidence = Math.min(1, (action.confidence + target.confidence + scope.confidence) / 3);
  const suggestion: ParsedVoiceCommand = {
    actionType: action.actionType,
    target: target.target,
    scope: scope.scope,
    confidence: combinedConfidence,
    reason: `${action.reason}|${target.reason}|${scope.reason}`,
    text: transcript
  };
  return [suggestion];
}
