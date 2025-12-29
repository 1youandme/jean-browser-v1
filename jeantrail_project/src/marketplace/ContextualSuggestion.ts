import { MarketplaceItem, Suggestion, SuggestionMemory } from './MarketplaceTypes';

function normalizeIntent(intent: string): string[] {
  const i = (intent || '').toLowerCase();
  return i.split(/[^a-z0-9]+/).filter(Boolean);
}

function relevanceScore(tokens: string[], capability: string[], useCases: string[]): number {
  const caps = new Set(capability.map(c => c.toLowerCase()));
  const cases = new Set(useCases.map(c => c.toLowerCase()));
  let score = 0;
  for (const t of tokens) {
    if (caps.has(t)) score += 2;
    if (cases.has(t)) score += 1;
  }
  return score;
}

function reasonFor(item: MarketplaceItem, tokens: string[], score: number): string {
  if (score <= 0) return 'no_match';
  const matchedCaps = item.capability.filter(c => tokens.includes(c.toLowerCase()));
  const matchedCases = item.useCases.filter(u => tokens.includes(u.toLowerCase()));
  const parts: string[] = [];
  if (matchedCaps.length) parts.push(`capabilities: ${matchedCaps.join(', ')}`);
  if (matchedCases.length) parts.push(`useCases: ${matchedCases.join(', ')}`);
  return parts.length ? parts.join(' | ') : 'relevant';
}

function benefitText(item: MarketplaceItem): string | undefined {
  if (!item.benefits) return undefined;
  const b = item.benefits;
  const parts: string[] = [];
  if (typeof b.discountPercentage === 'number' && b.discountPercentage > 0) parts.push(`${b.discountPercentage}% discount`);
  if (typeof b.trialDays === 'number' && b.trialDays > 0) parts.push(`${b.trialDays} day trial`);
  if (b.notes) parts.push(b.notes);
  return parts.length ? parts.join(' + ') : undefined;
}

function contextKey(tokens: string[]): string {
  return tokens.slice(0, 5).join('|') || 'none';
}

export function suggest(items: MarketplaceItem[], intent: string, memory?: SuggestionMemory): { suggestions: Suggestion[]; memory: SuggestionMemory } {
  const tokens = normalizeIntent(intent);
  const key = contextKey(tokens);
  const dismissed = new Set(memory?.dismissedIds || []);
  const lastKey = memory?.lastContextKey;
  const allowRepeat = !lastKey || lastKey !== key;

  const scored = items.map(item => {
    const score = relevanceScore(tokens, item.capability, item.useCases);
    const reason = reasonFor(item, tokens, score);
    const benefit = benefitText(item);
    return { item, score, reason, benefit };
  }).filter(entry => entry.score > 0);

  const filtered = scored.filter(entry => allowRepeat ? true : !dismissed.has(entry.item.id));

  const suggestions: Suggestion[] = filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(entry => ({
      itemId: entry.item.id,
      itemType: entry.item.type,
      reason: entry.reason,
      relevanceScore: entry.score,
      optional: true,
      dismissible: true,
      benefit: entry.benefit
    }));

  return { suggestions, memory: { dismissedIds: Array.from(dismissed), lastContextKey: key } };
}

export function dismiss(memory: SuggestionMemory, suggestionId: string): SuggestionMemory {
  const set = new Set(memory.dismissedIds || []);
  set.add(suggestionId);
  return { ...memory, dismissedIds: Array.from(set) };
}
