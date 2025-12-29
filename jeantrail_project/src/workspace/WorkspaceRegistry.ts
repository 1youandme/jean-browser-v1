import { Workspace } from './WorkspaceTypes';

export interface WorkspaceRegistry {
  items: Workspace[];
  activeId?: string;
}

export function registerWorkspace(state: WorkspaceRegistry, workspace: Workspace): WorkspaceRegistry {
  const exists = state.items.some(w => w.id === workspace.id);
  const items = exists ? state.items.map(w => (w.id === workspace.id ? workspace : w)) : [...state.items, workspace];
  return { items, activeId: state.activeId };
}

export function listWorkspaces(state: WorkspaceRegistry): Workspace[] {
  return state.items.slice();
}

export function getActiveWorkspace(state: WorkspaceRegistry): Workspace | null {
  if (!state.activeId) return null;
  const w = state.items.find(x => x.id === state.activeId);
  return w || null;
}

