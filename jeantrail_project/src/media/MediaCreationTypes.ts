export type MediaType = 'image' | 'video' | 'audio';

export interface Resolution {
  width: number;
  height: number;
}

export interface MediaCreationRequest {
  type: MediaType;
  intent: string;
  style?: string;
  qualityProfileId: string;
}

export interface TargetSpecs {
  resolution?: Resolution;
  aspectRatio?: string;
  fps?: number;
  sampleRateHz?: number;
  bitDepth?: number;
}

export interface CreationPlan {
  type: MediaType;
  intent: string;
  style?: string;
  qualityProfileId: string;
  target: TargetSpecs;
  constraints: string[];
  flags: string[];
}

export interface QualityValidationResult {
  valid: boolean;
  issues: string[];
}
