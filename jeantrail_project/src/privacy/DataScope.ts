export type DataScope = 'ephemeral' | 'session' | 'workspace' | 'persistent';

export function normalizeScope(scope?: DataScope): DataScope {
  return scope ?? 'ephemeral';
}

export function isCrossScopeRead(from: DataScope, to: DataScope): boolean {
  return from !== to;
}

export function requiresPersistentOptIn(scope: DataScope, optIn: boolean): boolean {
  if (scope !== 'persistent') return false;
  return optIn !== true;
}
