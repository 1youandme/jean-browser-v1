import { ThoughtSlot, ThoughtStatus } from './ThoughtTypes';

export class ThoughtManager {
  private thoughts: ThoughtSlot[] = [];

  addThought(slot: ThoughtSlot): void {
    this.thoughts.push(slot);
  }

  getActiveThoughts(): ThoughtSlot[] {
    return this.thoughts.filter(s => s.status === 'pending');
  }

  expireOldThoughts(now: number): void {
    this.thoughts = this.thoughts.map(s => {
      if (s.status === 'pending' && s.expiresAt < now) {
        return { ...s, status: 'expired' as ThoughtStatus };
      }
      return s;
    });
  }
}

