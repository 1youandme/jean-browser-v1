import { AgentManifest } from '../AgentDefinition';

export const ResearchAgent: AgentManifest = {
  id: 'template-research-agent',
  name: 'Research Agent',
  description: 'Assists with web research, source collection, and synthesis.',
  version: '1.0.0',
  intentTypes: ['web_research', 'collect_sources', 'synthesize_findings'],
  requiredPermissions: ['network_access'],
  memoryScope: 'workspace'
};

