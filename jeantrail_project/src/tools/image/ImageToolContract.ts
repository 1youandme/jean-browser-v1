import { ImageTask, ImageResult } from './ImageToolTypes';

export function runImageTool(task: ImageTask): ImageResult {
  return {
    prompt: task.prompt,
    resolution: task.resolution,
    style: task.style,
    metadata: { mode: 'symbolic' }
  };
}

