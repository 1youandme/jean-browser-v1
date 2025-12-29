import { WorkspaceType } from './WorkspaceTypes';

function matchTaskType(taskType: string): WorkspaceType | null {
  const t = taskType.toLowerCase();
  if (t.includes('code')) return 'code';
  if (t.includes('design')) return 'design';
  if (t.includes('doc')) return 'document';
  if (t.includes('data')) return 'data';
  if (t.includes('3d')) return '3d';
  if (t.includes('video')) return 'video';
  return null;
}

function matchIntent(intent: string): WorkspaceType | null {
  const i = intent.toLowerCase();
  if (i.includes('code') || i.includes('build') || i.includes('create app')) return 'code';
  if (i.includes('design') || i.includes('draw') || i.includes('ui')) return 'design';
  if (i.includes('write') || i.includes('document') || i.includes('doc')) return 'document';
  if (i.includes('analy') || i.includes('data') || i.includes('chart')) return 'data';
  if (i.includes('3d') || i.includes('model') || i.includes('mesh')) return '3d';
  if (i.includes('video') || i.includes('edit') || i.includes('timeline')) return 'video';
  return null;
}

export function decideWorkspace(intent: string, taskType: string): WorkspaceType {
  const byTask = matchTaskType(taskType);
  if (byTask) return byTask;
  const byIntent = matchIntent(intent);
  if (byIntent) return byIntent;
  return 'document';
}

