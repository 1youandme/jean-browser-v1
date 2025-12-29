import { AgentManifest } from '../agents/AgentDefinition';
import { AgentPermissionScope, AgentPermissionGrant } from '../agents/AgentPermissions';
import { OSActionType } from '../os/OSActionTypes';
import { RunningExtension, ExtensionCapability } from '../browser/ExtensionSandbox';

export interface AgentPermissionView {
  agentId: string;
  name: string;
  intentTypes: string[];
  memoryScope: AgentManifest['memoryScope'];
  granted: AgentPermissionScope[];
}

export interface OSPermissionView {
  contextId: 'local' | 'web' | 'proxy' | 'emulator';
  allowedActions: OSActionType[];
}

export interface ExtensionPermissionView {
  extensionId: string;
  name: string;
  version: string;
  grantedCapabilities: ExtensionCapability[];
  status: 'active' | 'suspended' | 'terminated';
}

export interface ToolPermissionGrant {
  toolId: string;
  name: string;
  category: 'code' | 'image' | 'video' | 'custom';
  grantedOperations: string[]; // Declarative operations permitted for the tool
}

export type ToolPermissionView = ToolPermissionGrant;

export interface PermissionSourceSnapshot {
  agents: AgentPermissionView[];
  os: OSPermissionView[];
  extensions: ExtensionPermissionView[];
  tools: ToolPermissionView[];
}

export interface PermissionSummary {
  agentCount: number;
  osContexts: number;
  extensionCount: number;
  toolCount: number;
}

export interface UnifiedPermissionSnapshot {
  sources: PermissionSourceSnapshot;
  summary: PermissionSummary;
}

export function makeSummary(sources: PermissionSourceSnapshot): PermissionSummary {
  return {
    agentCount: sources.agents.length,
    osContexts: sources.os.length,
    extensionCount: sources.extensions.length,
    toolCount: sources.tools.length
  };
}

export function fromAgentManifests(
  manifests: AgentManifest[],
  grants: AgentPermissionGrant[]
): AgentPermissionView[] {
  const grantMap = new Map<string, AgentPermissionGrant>();
  grants.forEach(g => grantMap.set(g.agentId, g));
  return manifests.map(m => ({
    agentId: m.id,
    name: m.name,
    intentTypes: [...m.intentTypes],
    memoryScope: m.memoryScope,
    granted: [...(grantMap.get(m.id)?.granted || [])]
  }));
}

export function fromExtensions(exts: RunningExtension[]): ExtensionPermissionView[] {
  return exts.map(e => ({
    extensionId: e.manifest.id,
    name: e.manifest.name,
    version: e.manifest.version,
    grantedCapabilities: Array.from(e.grantedCapabilities),
    status: e.status
  }));
}
