export type MemoryScope = 'session' | 'workspace' | 'none';

export type AgentPermission = 
  | 'read_files'
  | 'write_files'
  | 'network_access'
  | 'execute_commands'
  | 'access_secrets';

export interface AgentManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  intentTypes: string[]; // e.g. ["refactor_code", "generate_docs"]
  requiredPermissions: AgentPermission[];
  memoryScope: MemoryScope;
}

export interface AgentNode {
  id: string;
  type: 'agent' | 'input' | 'output' | 'router';
  data: {
    agentId?: string; // If type is 'agent'
    config?: Record<string, any>;
    label?: string;
  };
  position: { x: number; y: number }; // For visual builder
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string; // Simple expression for routing
}

export interface AgentGraph {
  id: string;
  name: string;
  description?: string;
  nodes: AgentNode[];
  edges: AgentEdge[];
  version: string;
}
