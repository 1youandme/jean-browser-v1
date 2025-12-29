import { ThoughtSlot, ThoughtIntent, ThoughtStatus } from './ThoughtTypes';

let counter = 0;

function makeId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function createThoughtSlot(intent: ThoughtIntent, confidence: number): ThoughtSlot {
  const now = Date.now();
  const clamped = Math.max(0, Math.min(1, confidence));
  return {
    id: makeId(),
    intent,
    confidence: clamped,
    createdAt: now,
    expiresAt: now + 30000,
    status: 'pending' as ThoughtStatus
  };
}

