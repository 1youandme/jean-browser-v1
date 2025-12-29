export interface AgentSpec {
  agentId: string;
  role: string;
  permissions: string[];
  lifecycleState: 'CREATED' | 'DISABLED' | 'ARCHIVED';
}
