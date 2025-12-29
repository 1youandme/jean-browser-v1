import { ModelCapability } from './ModelTypes';
import { WorkspaceType } from '../workspace/WorkspaceTypes';

function baseCapability(workspace: WorkspaceType): ModelCapability {
  if (workspace === 'code') return 'code';
  if (workspace === 'design') return 'image';
  if (workspace === 'document') return 'text';
  if (workspace === 'data') return 'data';
  if (workspace === '3d') return '3d';
  return 'video';
}

function taskCapability(task: string): ModelCapability | null {
  const t = task.toLowerCase();
  if (t.includes('code')) return 'code';
  if (t.includes('image') || t.includes('design')) return 'image';
  if (t.includes('video')) return 'video';
  if (t.includes('audio')) return 'audio';
  if (t.includes('data') || t.includes('chart') || t.includes('analy')) return 'data';
  if (t.includes('3d') || t.includes('mesh') || t.includes('model')) return '3d';
  if (t.includes('text') || t.includes('write') || t.includes('doc')) return 'text';
  return null;
}

export function routeTaskToModel(task: string, workspace: WorkspaceType): ModelCapability {
  const byTask = taskCapability(task);
  if (byTask) return byTask;
  return baseCapability(workspace);
}

