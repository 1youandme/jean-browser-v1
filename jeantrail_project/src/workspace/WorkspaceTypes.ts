export type WorkspaceType = 'code' | 'design' | 'document' | 'data' | '3d' | 'video';
export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  createdAt: number;
}

