export interface ResolutionRule {
  min?: { width: number; height: number };
  max?: { width: number; height: number };
  targetAspect?: '1:1' | '4:3' | '16:9' | '9:16' | '21:9';
}

export interface VideoQuality {
  minFps?: number;
  maxFps?: number;
  stableFraming: boolean;
  stableMotion: boolean;
}

export interface AudioQuality {
  minSampleRateHz?: number;
  maxSampleRateHz?: number;
  targetBitDepth?: number;
  stableDynamicRange: boolean;
}

export interface ArtifactPrevention {
  noAliasing: boolean;
  noBanding: boolean;
  noCompressionArtifacts: boolean;
}

export interface ConsistencyConstraints {
  paletteStable: boolean;
  lightingNeutral: boolean;
  noImplicitShadows: boolean;
}

export interface QualityAssuranceProfile {
  id: string;
  image: {
    resolution: ResolutionRule;
    artifacts: ArtifactPrevention;
    consistency: ConsistencyConstraints;
  };
  video: {
    resolution: ResolutionRule;
    quality: VideoQuality;
    artifacts: ArtifactPrevention;
    consistency: ConsistencyConstraints;
  };
  audio: {
    quality: AudioQuality;
    artifacts: ArtifactPrevention;
    consistency: ConsistencyConstraints;
  };
}

function clamp(n: number, min?: number, max?: number): number {
  const a = typeof min === 'number' ? Math.max(min, n) : n;
  const b = typeof max === 'number' ? Math.min(max, a) : a;
  return b;
}

export function suggestResolution(rule: ResolutionRule, base: { width: number; height: number }): { width: number; height: number; aspect?: string } {
  const w = clamp(base.width, rule.min?.width, rule.max?.width);
  const h = clamp(base.height, rule.min?.height, rule.max?.height);
  const aspect = rule.targetAspect;
  return { width: w, height: h, aspect };
}

export function checkArtifacts(flags: ArtifactPrevention): string[] {
  const issues: string[] = [];
  if (!flags.noAliasing) issues.push('aliasing');
  if (!flags.noBanding) issues.push('banding');
  if (!flags.noCompressionArtifacts) issues.push('compression_artifacts');
  return issues;
}

export function checkConsistency(consistency: ConsistencyConstraints): string[] {
  const issues: string[] = [];
  if (!consistency.paletteStable) issues.push('palette_inconsistent');
  if (!consistency.lightingNeutral) issues.push('lighting_non_neutral');
  if (!consistency.noImplicitShadows) issues.push('implicit_shadows');
  return issues;
}
