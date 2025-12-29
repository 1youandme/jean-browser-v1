import { VideoTask, VideoResult, VideoOperation } from './VideoToolTypes';

export function runVideoTool(task: VideoTask): VideoResult {
  const ops: VideoOperation[] = Array.from(new Set(task.timeline.map(t => t.op)));
  const longForm = task.durationMs >= 600000;
  return {
    title: task.title,
    resolution: task.resolution,
    durationMs: task.durationMs,
    style: task.style,
    timeline: task.timeline,
    metadata: { mode: 'symbolic', longForm, operations: ops }
  };
}

