export type AgentPermissionScope =
  | 'read_memory'
  | 'write_memory'
  | 'os_action'
  | 'browser_tab_access'
  | 'tool_use';

export const KNOWN_SCOPES: ReadonlyArray<AgentPermissionScope> = [
  'read_memory',
  'write_memory',
  'os_action',
  'browser_tab_access',
  'tool_use'
];

export interface AgentPermissionGrant {
  agentId: string;
  granted: AgentPermissionScope[];
}

export function initializeGrants(agentId: string): AgentPermissionGrant {
  return { agentId, granted: [] };
}

export function normalizeScopes(requested: string[]): AgentPermissionScope[] {
  const set = new Set(KNOWN_SCOPES);
  return requested.filter((r): r is AgentPermissionScope => set.has(r as AgentPermissionScope));
}

export function validateRequestedScopes(requested: string[]): { valid: boolean; unknown: string[] } {
  const known = new Set(KNOWN_SCOPES);
  const unknown = requested.filter(r => !known.has(r as AgentPermissionScope));
  return { valid: unknown.length === 0, unknown };
}

export function computePendingRequests(
  current: AgentPermissionGrant,
  requested: string[]
): AgentPermissionScope[] {
  const normalized = normalizeScopes(requested);
  const grantedSet = new Set(current.granted);
  return normalized.filter(s => !grantedSet.has(s));
}

export function grantPermissions(
  current: AgentPermissionGrant,
  scopes: AgentPermissionScope[]
): AgentPermissionGrant {
  const set = new Set(current.granted);
  scopes.forEach(s => set.add(s));
  return { agentId: current.agentId, granted: Array.from(set) };
}

export function revokePermission(
  current: AgentPermissionGrant,
  scope: AgentPermissionScope
): AgentPermissionGrant {
  const set = new Set(current.granted);
  set.delete(scope);
  return { agentId: current.agentId, granted: Array.from(set) };
}

export function isGranted(current: AgentPermissionGrant, scope: AgentPermissionScope): boolean {
  return current.granted.includes(scope);
}

export function diffGrants(
  before: AgentPermissionGrant,
  after: AgentPermissionGrant
): { granted: AgentPermissionScope[]; revoked: AgentPermissionScope[] } {
  const b = new Set(before.granted);
  const a = new Set(after.granted);
  const granted: AgentPermissionScope[] = Array.from(a).filter(s => !b.has(s));
  const revoked: AgentPermissionScope[] = Array.from(b).filter(s => !a.has(s));
  return { granted, revoked };
}

export function enforceNoInheritance(
  granted: AgentPermissionScope[],
  implied: Partial<Record<AgentPermissionScope, AgentPermissionScope[]>>
): { valid: boolean; violations: Array<{ scope: AgentPermissionScope; implies: AgentPermissionScope }> } {
  const violations: Array<{ scope: AgentPermissionScope; implies: AgentPermissionScope }> = [];
  for (const scope of granted) {
    const implies = implied[scope] || [];
    for (const i of implies) {
      violations.push({ scope, implies: i });
    }
  }
  return { valid: violations.length === 0, violations };
}

