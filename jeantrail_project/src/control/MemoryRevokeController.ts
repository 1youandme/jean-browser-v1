import { AgentManifest, MemoryScope } from '../agents/AgentDefinition';
import { MemoryAuditLog } from '../kernel/KernelIntrospection';

export interface ListScopesResult {
  scopes: MemoryScope[];
  byScope: Record<MemoryScope, string[]>; // agentIds per scope
}

export function listMemoryScopes(manifests: AgentManifest[]): ListScopesResult {
  const byScope: Record<MemoryScope, string[]> = {
    session: [],
    workspace: [],
    none: []
  };
  manifests.forEach(m => {
    byScope[m.memoryScope].push(m.id);
  });
  const scopes = (['session', 'workspace'] as MemoryScope[]).filter(s => byScope[s].length > 0);
  return { scopes, byScope };
}

export interface RevokeOptions {
  initiator?: string; // 'user' | 'controller'
  now?: number;
}

function nowTs(now?: number): number {
  return typeof now === 'number' ? now : Date.now();
}

function makeRevocationLog(target: string, initiator: string | undefined, now?: number): MemoryAuditLog {
  return {
    operation: 'revoke',
    target,
    initiator: initiator ?? 'user',
    timestamp: nowTs(now),
    success: true
  };
}

export interface RevokeByScopeResult {
  scope: MemoryScope;
  affectedAgentIds: string[];
  log: MemoryAuditLog;
}

export function revokeMemoryByScope(
  scope: MemoryScope,
  manifests: AgentManifest[],
  opts: RevokeOptions = {}
): RevokeByScopeResult {
  const affected = manifests.filter(m => m.memoryScope === scope).map(m => m.id);
  const log = makeRevocationLog(`scope:${scope}`, opts.initiator, opts.now);
  return { scope, affectedAgentIds: affected, log };
}

export interface RevokeByAgentResult {
  agentId: string;
  scope: MemoryScope;
  log: MemoryAuditLog;
  ok: boolean;
  reason?: string;
}

export function revokeMemoryByAgent(
  agentId: string,
  manifests: AgentManifest[],
  opts: RevokeOptions = {}
): RevokeByAgentResult {
  const m = manifests.find(x => x.id === agentId);
  if (!m) {
    return {
      agentId,
      scope: 'none',
      ok: false,
      reason: 'agent_not_found',
      log: makeRevocationLog(`agent:${agentId}`, opts.initiator, opts.now)
    };
  }
  if (m.memoryScope === 'none') {
    return {
      agentId,
      scope: 'none',
      ok: false,
      reason: 'no_memory_scope',
      log: makeRevocationLog(`agent:${agentId}`, opts.initiator, opts.now)
    };
  }
  return {
    agentId,
    scope: m.memoryScope,
    ok: true,
    log: makeRevocationLog(`agent:${agentId}`, opts.initiator, opts.now)
  };
}

