import { AgentManifest } from '../agents/AgentDefinition';
import { AgentPermissionGrant } from '../agents/AgentPermissions';
import { OSActionType } from '../os/OSActionTypes';
import { RunningExtension } from '../browser/ExtensionSandbox';
import {
  PermissionSourceSnapshot,
  UnifiedPermissionSnapshot,
  makeSummary,
  fromAgentManifests,
  fromExtensions,
  OSPermissionView,
  ToolPermissionView,
  ToolPermissionGrant
} from './PermissionSnapshot';

export interface OSPermissionGrant {
  contextId: OSPermissionView['contextId'];
  allowedActions: OSActionType[];
}

export function aggregatePermissions(
  params: {
    agents: { manifests: AgentManifest[]; grants: AgentPermissionGrant[] };
    os: { grants: OSPermissionGrant[] };
    extensions: { running: RunningExtension[] };
    tools: { grants: ToolPermissionGrant[] };
  }
): UnifiedPermissionSnapshot {
  const agentViews = fromAgentManifests(params.agents.manifests, params.agents.grants);
  const osViews: OSPermissionView[] = params.os.grants.map(g => ({
    contextId: g.contextId,
    allowedActions: [...g.allowedActions]
  }));
  const extViews = fromExtensions(params.extensions.running);
  const toolViews: ToolPermissionView[] = params.tools.grants.map(g => ({
    toolId: g.toolId,
    name: g.name,
    category: g.category,
    grantedOperations: [...g.grantedOperations]
  }));

  const sources: PermissionSourceSnapshot = {
    agents: agentViews,
    os: osViews,
    extensions: extViews,
    tools: toolViews
  };

  return {
    sources,
    summary: makeSummary(sources)
  };
}

export function mergeSnapshots(a: UnifiedPermissionSnapshot, b: UnifiedPermissionSnapshot): UnifiedPermissionSnapshot {
  const sources: PermissionSourceSnapshot = {
    agents: [...a.sources.agents, ...b.sources.agents],
    os: [...a.sources.os, ...b.sources.os],
    extensions: [...a.sources.extensions, ...b.sources.extensions],
    tools: [...a.sources.tools, ...b.sources.tools]
  };
  return {
    sources,
    summary: makeSummary(sources)
  };
}

