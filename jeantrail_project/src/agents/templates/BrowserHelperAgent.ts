import { AgentManifest } from '../AgentDefinition';

export const BrowserHelperAgent: AgentManifest = {
  id: 'template-browser-helper-agent',
  name: 'Browser Helper Agent',
  description: 'Assists with page summarization, link extraction, and highlighting.',
  version: '1.0.0',
  intentTypes: ['summarize_page', 'extract_links', 'highlight_terms'],
  requiredPermissions: ['network_access'],
  memoryScope: 'session'
};

