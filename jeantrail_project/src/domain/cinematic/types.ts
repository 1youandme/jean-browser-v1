/**
 * Cinematic AI Pipeline - Data Schemas
 * Defines the data structures flowing between nodes in the execution graph.
 */

import { Uuid } from '../../types/common';

// ==========================================
// 1. Script → Narrative Graph
// ==========================================

export interface ScriptInput {
  rawText: string;
  metadata?: {
    genre?: string;
    targetDuration?: number; // seconds
    aspectRatio?: string; // "16:9", "9:16"
  };
}

export interface Character {
  id: string;
  name: string;
  archetype: string;
  visualTraits: string[];
  voiceRef?: string;
}

export interface Location {
  id: string;
  name: string;
  visualStyle: string;
  timeOfDay: 'day' | 'night' | 'dusk' | 'dawn';
}

export interface PlotPoint {
  id: string;
  description: string;
  intensity: number; // 0-10
}

export interface NarrativeGraph {
  characters: Character[];
  locations: Location[];
  plotPoints: PlotPoint[];
  edges: {
    from: string;
    to: string;
    relation: string; // "interacts_with", "occurs_at", "leads_to"
  }[];
}

// ==========================================
// 2. Narrative Graph → Scene Graph
// ==========================================

export interface SceneNode {
  id: string;
  sequenceIndex: number;
  locationId: string;
  characterIds: string[];
  actionDescription: string;
  mood: string;
  estimatedDuration: number; // seconds
}

export interface SceneGraph {
  scenes: SceneNode[];
  globalPacing: 'slow' | 'moderate' | 'fast' | 'chaotic';
  totalEstimatedDuration: number;
}

// ==========================================
// 3. Scene Graph → Camera Plan
// ==========================================

export type ShotType = 'wide' | 'medium' | 'close-up' | 'extreme-close-up';
export type CameraMovement = 'static' | 'pan' | 'tilt' | 'dolly' | 'truck' | 'crane';

export interface ShotSpec {
  id: string;
  sceneId: string;
  duration: number; // Max 12s (Hard Constraint)
  shotType: ShotType;
  cameraMovement: CameraMovement;
  angle: string; // "eye-level", "low-angle", "high-angle"
  focalLength: string; // "35mm", "85mm"
  focusTarget?: string; // Character ID or object
  description: string;
}

export interface CameraPlan {
  sceneId: string;
  shots: ShotSpec[];
}

// ==========================================
// 4. Camera Plan → Asset Requests
// ==========================================

export interface AssetRequest {
  id: string;
  shotId: string;
  
  // Generation Parameters
  positivePrompt: string;
  negativePrompt: string;
  imageReferencePaths?: string[]; // For consistency (IP-Adapter)
  
  // Technicals
  width: number;
  height: number;
  steps: number;
  seed?: number;
  cfgScale: number;
  
  // Control Signals
  controlNet?: {
    type: 'depth' | 'canny' | 'openpose';
    imagePath: string;
    strength: number;
  }[];
  
  loraReferences: {
    path: string;
    strength: number;
  }[];
}

// ==========================================
// 5. Asset Requests → Video Generation
// ==========================================

export interface VideoSegment {
  id: string;
  assetRequestId: string;
  filePath: string;
  duration: number;
  fps: number;
  resolution: string;
  
  generationMetadata: {
    model: string;
    seed: number;
    renderTimeMs: number;
  };
}

// ==========================================
// 6. Scene Validation
// ==========================================

export interface ValidationReport {
  segmentId: string;
  passed: boolean;
  score: number; // 0-1
  issues: string[]; // "flickering", "distortion", "bad_anatomy"
  artifactsDetected: boolean;
  coherenceScore: number;
}

// ==========================================
// 7. Stitching
// ==========================================

export interface StitchingInput {
  segments: VideoSegment[]; // Ordered list
  transitions: {
    atIndex: number;
    type: 'cut' | 'fade' | 'dissolve';
    duration: number;
  }[];
}

export interface RoughCut {
  id: string;
  filePath: string;
  totalDuration: number;
  segmentsIncluded: number;
}

// ==========================================
// 8. Final Consistency Pass
// ==========================================

export interface FinalMaster {
  id: string;
  filePath: string;
  format: string; // "mp4", "mov"
  fileSizeMb: number;
  finalDuration: number;
  exportTimestamp: number;
}
