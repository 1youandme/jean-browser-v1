import { WorkspaceType } from '../workspace/WorkspaceTypes';
import { CanvasLayout } from './CanvasTypes';

function layout(panels: Array<{ id: string; kind: string; x: number; y: number; width: number; height: number }>): CanvasLayout {
  return { panels: panels.map(p => ({ id: p.id, kind: p.kind, x: p.x, y: p.y, width: p.width, height: p.height })) };
}

export function mapWorkspaceToCanvas(workspaceType: WorkspaceType): CanvasLayout {
  if (workspaceType === 'code') {
    return layout([
      { id: 'editor', kind: 'editor', x: 0, y: 0, width: 70, height: 70 },
      { id: 'console', kind: 'console', x: 0, y: 70, width: 70, height: 30 },
      { id: 'files', kind: 'file_tree', x: 70, y: 0, width: 30, height: 100 }
    ]);
  }
  if (workspaceType === 'design') {
    return layout([
      { id: 'canvas', kind: 'design_canvas', x: 0, y: 0, width: 70, height: 100 },
      { id: 'layers', kind: 'layers', x: 70, y: 0, width: 30, height: 50 },
      { id: 'props', kind: 'properties', x: 70, y: 50, width: 30, height: 50 }
    ]);
  }
  if (workspaceType === 'document') {
    return layout([
      { id: 'doc_editor', kind: 'doc_editor', x: 0, y: 0, width: 70, height: 100 },
      { id: 'outline', kind: 'outline', x: 70, y: 0, width: 30, height: 50 },
      { id: 'preview', kind: 'preview', x: 70, y: 50, width: 30, height: 50 }
    ]);
  }
  if (workspaceType === 'data') {
    return layout([
      { id: 'table', kind: 'data_table', x: 0, y: 0, width: 60, height: 60 },
      { id: 'chart', kind: 'chart', x: 60, y: 0, width: 40, height: 60 },
      { id: 'query', kind: 'query', x: 0, y: 60, width: 100, height: 40 }
    ]);
  }
  if (workspaceType === '3d') {
    return layout([
      { id: 'viewport', kind: 'viewport', x: 0, y: 0, width: 70, height: 100 },
      { id: 'hierarchy', kind: 'hierarchy', x: 70, y: 0, width: 30, height: 50 },
      { id: 'inspector', kind: 'inspector', x: 70, y: 50, width: 30, height: 50 }
    ]);
  }
  return layout([
    { id: 'timeline', kind: 'timeline', x: 0, y: 70, width: 100, height: 30 },
    { id: 'preview', kind: 'preview', x: 0, y: 0, width: 70, height: 70 },
    { id: 'assets', kind: 'assets', x: 70, y: 0, width: 30, height: 70 }
  ]);
}

