/**
 * useConfidenceCalibration (stub)
 *
 * Returns typed, readonly calibration outputs without logic.
 * TODO(v2): Implement calibration using kernel signals and verified citations.
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ConfidenceInput {
  citationCount: number;
  agreement: number;
}

export interface ConfidenceResult {
  score: number;
  level: ConfidenceLevel;
}

export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const result: Readonly<ConfidenceResult> = Object.freeze({ score: 0, level: 'low' });
  return result;
}

export function confidenceVariant(level: ConfidenceLevel): 'error' | 'warning' | 'success' | 'blue' {
  return 'warning';
}
