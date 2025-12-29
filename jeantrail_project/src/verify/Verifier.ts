import { VerificationResult } from './VerificationTypes';
import { WorkspaceType } from '../workspace/WorkspaceTypes';

function kw(s: string): string {
  return (s || '').toLowerCase();
}

function intentWorkspace(intent: string): WorkspaceType | null {
  const i = kw(intent);
  if (i.includes('code')) return 'code';
  if (i.includes('design')) return 'design';
  if (i.includes('doc') || i.includes('write')) return 'document';
  if (i.includes('data') || i.includes('analy') || i.includes('chart')) return 'data';
  if (i.includes('3d') || i.includes('model') || i.includes('mesh')) return '3d';
  if (i.includes('video') || i.includes('edit') || i.includes('timeline')) return 'video';
  return null;
}

function workspaceKeywords(w: WorkspaceType): string[] {
  if (w === 'code') return ['function', 'class', 'import', 'export', 'code'];
  if (w === 'design') return ['design', 'layout', 'style', 'color'];
  if (w === 'document') return ['title', 'section', 'summary', 'document', 'content'];
  if (w === 'data') return ['data', 'table', 'chart', 'json', 'csv'];
  if (w === '3d') return ['3d', 'mesh', 'model', 'vertex', 'shader'];
  return ['video', 'timeline', 'frame', 'clip'];
}

export function verifyOutput(output: string, intent: string, workspace: WorkspaceType): VerificationResult {
  const text = kw(output).trim();
  if (!text) return 'fail';
  const expected = workspaceKeywords(workspace);
  const hasExpected = expected.some(k => text.includes(k));
  const inferred = intentWorkspace(intent);
  if (!hasExpected) return 'warn';
  if (inferred && inferred !== workspace) return 'warn';
  return 'pass';
}

