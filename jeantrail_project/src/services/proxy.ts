import { ProxyNode, ProxySession } from '../types';

export interface ProxyService {
  // Node management
  createNode: (host: string, port: number, protocol: string) => Promise<ProxyNode>;
  getNodes: () => Promise<ProxyNode[]>;
  getNode: (id: string) => Promise<ProxyNode>;
  updateNode: (id: string, updates: Partial<ProxyNode>) => Promise<ProxyNode>;
  deleteNode: (id: string) => Promise<void>;
  testNode: (id: string) => Promise<boolean>;
  
  // Session management
  startSession: (nodeId: string) => Promise<ProxySession>;
  getSessions: () => Promise<ProxySession[]>;
  stopSession: (sessionId: string) => Promise<void>;
  getSessionStats: (sessionId: string) => Promise<{ bytesUp: number; bytesDown: number }>;
  
  // Connection management
  connectToNode: (nodeId: string) => Promise<void>;
  disconnectFromNode: () => Promise<void>;
  getConnectionStatus: () => Promise<{ connected: boolean; nodeId?: string }>;
}

class ProxyServiceImpl implements ProxyService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async createNode(host: string, port: number, protocol: string): Promise<ProxyNode> {
    const response = await fetch(`${this.baseUrl}/api/proxy/nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host, port, protocol }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create proxy node: ${response.statusText}`);
    }

    return response.json();
  }

  async getNodes(): Promise<ProxyNode[]> {
    const response = await fetch(`${this.baseUrl}/api/proxy/nodes`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch proxy nodes: ${response.statusText}`);
    }

    return response.json();
  }

  async getNode(id: string): Promise<ProxyNode> {
    const response = await fetch(`${this.baseUrl}/api/proxy/nodes/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch proxy node: ${response.statusText}`);
    }

    return response.json();
  }

  async updateNode(id: string, updates: Partial<ProxyNode>): Promise<ProxyNode> {
    const response = await fetch(`${this.baseUrl}/api/proxy/nodes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update proxy node: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteNode(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/proxy/nodes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete proxy node: ${response.statusText}`);
    }
  }

  async testNode(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/proxy/nodes/${id}/test`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async startSession(nodeId: string): Promise<ProxySession> {
    const response = await fetch(`${this.baseUrl}/api/proxy/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ node_id: nodeId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start proxy session: ${response.statusText}`);
    }

    return response.json();
  }

  async getSessions(): Promise<ProxySession[]> {
    const response = await fetch(`${this.baseUrl}/api/proxy/sessions`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch proxy sessions: ${response.statusText}`);
    }

    return response.json();
  }

  async stopSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/proxy/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to stop proxy session: ${response.statusText}`);
    }
  }

  async getSessionStats(sessionId: string): Promise<{ bytesUp: number; bytesDown: number }> {
    const response = await fetch(`${this.baseUrl}/api/proxy/sessions/${sessionId}/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch session stats: ${response.statusText}`);
    }

    return response.json();
  }

  async connectToNode(nodeId: string): Promise<void> {
    await this.startSession(nodeId);
  }

  async disconnectFromNode(): Promise<void> {
    // Would stop active session
    console.log('Disconnecting from proxy node');
  }

  async getConnectionStatus(): Promise<{ connected: boolean; nodeId?: string }> {
    // Would check active session
    return { connected: false };
  }
}

// Singleton instance
export const proxyService = new ProxyServiceImpl();

// React hook
export const useProxyService = (): ProxyService => {
  return proxyService;
};