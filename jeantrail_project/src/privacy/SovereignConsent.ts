import { DataScope } from './DataScope';
import { ExecutionContextId } from '../runtime/ExecutionContextTypes';

export type ConsentPurpose = 'execution' | 'memory' | 'context';

export interface SovereignConsentToken {
  id: string;
  timestamp: string;
  explicit: boolean;
  purposes: ConsentPurpose[];
  scopes?: DataScope[];
  contexts?: ExecutionContextId[];
}

export function hasConsent(
  token: SovereignConsentToken | null,
  purpose: ConsentPurpose,
  opts?: { scope?: DataScope; contextId?: ExecutionContextId }
): boolean {
  if (!token) return false;
  if (!token.explicit) return false;
  if (!token.purposes.includes(purpose)) return false;
  if (opts?.scope) {
    if (!token.scopes || !token.scopes.includes(opts.scope)) return false;
  }
  if (opts?.contextId) {
    if (!token.contexts || !token.contexts.includes(opts.contextId)) return false;
  }
  return true;
}
