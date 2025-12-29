import { Phoneme } from './PhonemeTypes';

function mapChar(c: string): Phoneme | null {
  const ch = c.toLowerCase();
  if (ch === 'a') return 'A';
  if (ch === 'e') return 'E';
  if (ch === 'i') return 'I';
  if (ch === 'o') return 'O';
  if (ch === 'u') return 'U';
  if (ch === 'b') return 'B';
  if (ch === 'm') return 'M';
  if (ch === 'f') return 'F';
  if (ch === 's') return 'S';
  if (ch.trim() === '') return 'silence';
  return null;
}

export function mapTextToPhonemes(text: string): Phoneme[] {
  const out: Phoneme[] = [];
  let last: Phoneme | null = null;
  for (const c of text) {
    const p = mapChar(c);
    if (p) {
      if (p === 'silence') {
        if (last !== 'silence') out.push(p);
        last = 'silence';
\t    continue;
      }
      out.push(p);
      last = p;
    }
  }
  return out;
}

