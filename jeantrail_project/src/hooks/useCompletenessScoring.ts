/**
 * useCompletenessScoring (stub)
 *
 * Returns typed, readonly completeness outputs without logic.
 * TODO(v2): Compute completeness based on verified citations per key point.
 */
export interface CompletenessInput {
  totalPoints: number;
  citedPoints: number;
}

export interface CompletenessResult {
  score: number;
  incomplete: boolean;
}

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const result: Readonly<CompletenessResult> = Object.freeze({ score: 0, incomplete: true });
  return result;
}

export function completenessVariant(incomplete: boolean): 'error' | 'success' {
  return 'error';
}
