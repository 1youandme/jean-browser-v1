export interface ImageTask {
  prompt: string;
  resolution: { width: number; height: number };
  style?: string;
}

export interface ImageResult {
  prompt: string;
  resolution: { width: number; height: number };
  style?: string;
  metadata: { mode: 'symbolic' };
}

