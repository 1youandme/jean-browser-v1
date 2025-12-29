import { CreationPlan, MediaCreationRequest, MediaType, QualityValidationResult } from './MediaCreationTypes';
import { QualityAssuranceProfile, suggestResolution, checkArtifacts, checkConsistency } from './QualityProfile';

function baseFor(type: MediaType): { width?: number; height?: number; fps?: number; sampleRateHz?: number; bitDepth?: number } {
  if (type === 'image') return { width: 1024, height: 1024 };
  if (type === 'video') return { width: 1920, height: 1080, fps: 30 };
  return { sampleRateHz: 48000, bitDepth: 24 };
}

export function validateQuality(type: MediaType, profile: QualityAssuranceProfile): QualityValidationResult {
  const issues: string[] = [];
  if (type === 'image') {
    issues.push(...checkArtifacts(profile.image.artifacts));
    issues.push(...checkConsistency(profile.image.consistency));
  } else if (type === 'video') {
    issues.push(...checkArtifacts(profile.video.artifacts));
    issues.push(...checkConsistency(profile.video.consistency));
    if (profile.video.quality.minFps && profile.video.quality.minFps < 12) issues.push('min_fps_too_low');
  } else {
    issues.push(...checkArtifacts(profile.audio.artifacts));
    issues.push(...checkConsistency(profile.audio.consistency));
    if (profile.audio.quality.minSampleRateHz && profile.audio.quality.minSampleRateHz < 16000) issues.push('min_sample_rate_low');
  }
  return { valid: issues.length === 0, issues };
}

export function planCreation(request: MediaCreationRequest, profile: QualityAssuranceProfile): CreationPlan {
  const base = baseFor(request.type);
  let target = {};
  const constraints: string[] = [];
  const flags: string[] = [];
  if (request.type === 'image') {
    const res = suggestResolution(profile.image.resolution, { width: base.width as number, height: base.height as number });
    target = { resolution: { width: res.width, height: res.height }, aspectRatio: res.aspect };
    constraints.push('no_implicit_shadows', 'lighting_neutral', 'palette_stable');
    flags.push('artifact_prevention');
  } else if (request.type === 'video') {
    const res = suggestResolution(profile.video.resolution, { width: base.width as number, height: base.height as number });
    const fps = base.fps as number;
    target = { resolution: { width: res.width, height: res.height }, aspectRatio: res.aspect, fps };
    constraints.push('framing_stable', 'motion_stable', 'palette_stable', 'lighting_neutral');
    flags.push('artifact_prevention');
  } else {
    const sr = base.sampleRateHz as number;
    const bd = base.bitDepth as number;
    target = { sampleRateHz: sr, bitDepth: bd };
    constraints.push('dynamic_range_stable');
    flags.push('artifact_prevention');
  }
  return {
    type: request.type,
    intent: request.intent,
    style: request.style,
    qualityProfileId: request.qualityProfileId,
    target: target as any,
    constraints,
    flags
  };
}
