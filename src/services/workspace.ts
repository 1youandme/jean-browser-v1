import { Workspace, SplitLayout } from '../types';

export interface WorkspaceService {
  createWorkspace: (name: string, layout: SplitLayout) => Promise<Workspace>;
  getWorkspaces: () => Promise<Workspace[]>;
  getWorkspace: (id: string) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  saveCurrentLayout: (workspaceId: string, layout: SplitLayout) => Promise<void>;
  loadWorkspaceLayout: (workspaceId: string) => Promise<SplitLayout>;
}

class WorkspaceServiceImpl implements WorkspaceService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async createWorkspace(name: string, layout: SplitLayout): Promise<Workspace> {
    const response = await fetch(`${this.baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        layout_json: layout,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create workspace: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${this.baseUrl}/api/workspaces`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
    }

    return response.json();
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await fetch(`${this.baseUrl}/api/workspaces/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch workspace: ${response.statusText}`);
    }

    return response.json();
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const response = await fetch(`${this.baseUrl}/api/workspaces/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update workspace: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteWorkspace(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/workspaces/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workspace: ${response.statusText}`);
    }
  }

  async saveCurrentLayout(workspaceId: string, layout: SplitLayout): Promise<void> {
    await this.updateWorkspace(workspaceId, { layoutJson: layout });
  }

  async loadWorkspaceLayout(workspaceId: string): Promise<SplitLayout> {
    const workspace = await this.getWorkspace(workspaceId);
    return workspace.layoutJson;
  }
}

// Singleton instance
export const workspaceService = new WorkspaceServiceImpl();

// React hook
export const useWorkspaceService = (): WorkspaceService => {
  return workspaceService;
};