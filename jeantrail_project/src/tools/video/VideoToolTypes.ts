export type VideoOperation = 'cut' | 'merge' | 'overlay' | 'transition' | 'text' | 'audio';
export interface TimelineEvent {
  startMs: number;
  endMs: number;
  op: VideoOperation;
  details?: string;
}
export interface VideoTask {
  title: string;
  resolution: { width: number; height: number };
  durationMs: number;
  style?: string;
  timeline: TimelineEvent[];
}
export interface VideoResult {
  title: string;
  resolution: { width: number; height: number };
  durationMs: number;
  style?: string;
  timeline: TimelineEvent[];
  metadata: { mode: 'symbolic'; longForm: boolean; operations: VideoOperation[] };
}

