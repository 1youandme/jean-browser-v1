import { AgentManifest } from '../AgentDefinition';

export const CodeAssistantAgent: AgentManifest = {
  id: 'template-code-assistant-agent',
  name: 'Code Assistant Agent',
  description: 'Supports code explanation, refactoring, and test generation.',
  version: '1.0.0',
  intentTypes: ['explain_code', 'refactor_code', 'generate_tests'],
  requiredPermissions: ['read_files', 'write_files'],
  memoryScope: 'workspace'
};

