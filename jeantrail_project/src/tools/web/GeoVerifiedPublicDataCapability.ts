import { ExecutionContract, ExecutionRouteResult, ConsentToken } from '../../runtime/ExecutionContextTypes';
import { routeExecution } from '../../runtime/ContextRouter';
import { OSIntent, OSActionType } from '../../os/OSActionTypes';
import { OSExecutionBridge } from '../../os/OSExecutionBridge';
import { createExecutionAudit, ExecutionResult } from '../../os/ExecutionAudit';

// Governance:
// - Read-only, public data only (NON-PII)
// - Contract-first validation mandatory
// - Single execution gate via OSExecutionBridge
// - Kill Switch overrides all execution
// - Fail-closed: missing/invalid data blocks immediately
// - Every execution and block emits audit with contractId, contextId, reason

export type GeoPublicAction =
  | 'discover_sources'
  | 'fetch_public_listing'
  | 'normalize_result'
  | 'return_structured_preview';

export interface GeoCapabilityDescriptor {
  id: 'geo_public_data_read';
  category: 'data_collection';
  riskLevel: 'low';
  reversible: true;
  executionMode: 'assisted' | 'confirmed';
  allowedActions: GeoPublicAction[];
}

export const GEO_PUBLIC_DESCRIPTOR: GeoCapabilityDescriptor = {
  id: 'geo_public_data_read',
  category: 'data_collection',
  riskLevel: 'low',
  reversible: true,
  executionMode: 'assisted',
  allowedActions: [
    'discover_sources',
    'fetch_public_listing',
    'normalize_result',
    'return_structured_preview'
  ]
};

export interface GeoContractResourceLimits {
  maxRequestsPerRun: number;
  maxExecutionTime: number;
  maxBytesFetched: number;
}

export interface GeoContractTemplateInput {
  contextId: 'web' | 'proxy' | 'local';
  scopes: string[];
  allowedActions: GeoPublicAction[];
  resourceLimits: GeoContractResourceLimits;
  timeBounds: { start: string; end: string };
}

export function buildGeoPublicDataContractTemplate(input: GeoContractTemplateInput): ExecutionContract {
  return {
    id: `geo-${Date.now().toString(36)}`,
    contextId: input.contextId,
    scopes: input.scopes.slice(),
    allowedActions: input.allowedActions.slice(),
    resourceLimits: {
      cpu: undefined,
      io: input.resourceLimits.maxRequestsPerRun,
      memoryMB: undefined,
      steps: undefined
    },
    timeBounds: { start: input.timeBounds.start, end: input.timeBounds.end },
    revoked: false
  };
}

export interface DiscoverSourcesInput {
  country: string;
  city?: string;
  category?: string;
}

export interface FetchPublicListingInput {
  source_url: string;
}

export interface NormalizeResultInput {
  raw_html: string;
}

export interface StructuredPreviewInput {
  max_items: number;
}

export type GeoPublicInput =
  | DiscoverSourcesInput
  | FetchPublicListingInput
  | NormalizeResultInput
  | StructuredPreviewInput;

export interface GeoStructuredItem {
  country?: string;
  region?: string;
  city?: string;
  category?: string;
  name?: string;
  address?: string;
  public_contact?: string;
  source_url?: string;
  confidence_score: number;
}

export interface GeoStructuredOutput {
  items: GeoStructuredItem[];
  contractId: string;
  contextId: string;
  reason: 'executed' | 'blocked' | 'cancelled';
  auditTrailId: string;
}

function withinTimeBounds(contract: ExecutionContract): boolean {
  const now = Date.now();
  const start = Date.parse(contract.timeBounds.start);
  const end = Date.parse(contract.timeBounds.end);
  return !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;
}

function isActionAllowed(contract: ExecutionContract, action: GeoPublicAction): boolean {
  const allowed = new Set(contract.allowedActions);
  return allowed.has(action);
}

function validateContractStrict(contract: ExecutionContract, action: GeoPublicAction): { ok: boolean; reason?: string } {
  if (!contract || contract.revoked) return { ok: false, reason: 'contract_missing_or_revoked' };
  if (!withinTimeBounds(contract)) return { ok: false, reason: 'time_bounds_invalid_or_expired' };
  if (!isActionAllowed(contract, action)) return { ok: false, reason: 'action_not_permitted' };
  if (!Array.isArray(contract.scopes) || contract.scopes.length === 0) return { ok: false, reason: 'scopes_missing' };
  const scopeSet = new Set(contract.scopes);
  if (!scopeSet.has('tool_use:web_read')) return { ok: false, reason: 'scope_tool_use_web_read_required' };
  if (!scopeSet.has('browser_tab_access:sandboxed')) return { ok: false, reason: 'scope_browser_tab_access_required' };
  return { ok: true };
}

export async function executeGeoPublicData(
  action: GeoPublicAction,
  input: GeoPublicInput,
  contract: ExecutionContract,
  confirmationToken: string
): Promise<GeoStructuredOutput> {
  const contextId = contract.contextId;
  const validation = validateContractStrict(contract, action);
  if (!validation.ok) {
    const audit = createExecutionAudit(
      OSActionType.system_query,
      `geo:${String(action)}`,
      'failure',
      contextId,
      undefined,
      { eventType: 'execution_blocked', contractId: contract.id, reason: validation.reason }
    );
    return {
      items: [],
      contractId: contract.id,
      contextId,
      reason: 'blocked',
      auditTrailId: audit.id
    };
  }

  const consent: ConsentToken = { contextId, token: confirmationToken };
  const route: ExecutionRouteResult = routeExecution(
    { contextId, action: `geo:${String(action)}`, payload: { ...input } },
    consent
  );

  if (!route.accepted) {
    const audit = createExecutionAudit(
      OSActionType.system_query,
      `geo:${String(action)}`,
      'failure',
      contextId,
      undefined,
      { eventType: 'execution_blocked', contractId: contract.id, reason: route.reason || 'route_not_accepted' }
    );
    return {
      items: [],
      contractId: contract.id,
      contextId,
      reason: 'blocked',
      auditTrailId: audit.id
    };
  }

  const intent: OSIntent = {
    action: OSActionType.system_query,
    target: `web_read:${String(action)}`,
    payload: { ...input },
    timestamp: new Date().toISOString()
  };

  const result: ExecutionResult = await OSExecutionBridge.execute(route, intent, {
    confirmationToken,
    expectedContext: contextId,
    workspaceId: 'unknown',
    userId: undefined,
    contract
  });

  if (result.status !== 'success') {
    const audit = createExecutionAudit(
      OSActionType.system_query,
      `geo:${String(action)}`,
      result.status,
      contextId,
      undefined,
      { eventType: 'execution_non_success', contractId: contract.id, reason: result.error || result.status }
    );
    return {
      items: [],
      contractId: contract.id,
      contextId,
      reason: result.status === 'cancelled' ? 'cancelled' : 'blocked',
      auditTrailId: audit.id
    };
  }

  const items: GeoStructuredItem[] = buildStructuredItems(action, input);
  return {
    items,
    contractId: contract.id,
    contextId,
    reason: 'executed',
    auditTrailId: result.auditTrailId
  };
}

function buildStructuredItems(action: GeoPublicAction, input: GeoPublicInput): GeoStructuredItem[] {
  if (action === 'discover_sources') {
    const a = input as DiscoverSourcesInput;
    return [
      {
        country: a.country,
        city: a.city,
        category: a.category,
        name: 'Public Source Directory',
        source_url: 'https://example.org/public-directory',
        confidence_score: 0.6
      }
    ];
  }
  if (action === 'fetch_public_listing') {
    const f = input as FetchPublicListingInput;
    return [
      {
        name: 'Public Listing',
        source_url: f.source_url,
        confidence_score: 0.5
      }
    ];
  }
  if (action === 'normalize_result') {
    const n = input as NormalizeResultInput;
    const len = typeof n.raw_html === 'string' ? n.raw_html.length : 0;
    return [
      {
        name: 'Normalized Preview',
        confidence_score: len > 0 ? 0.5 : 0.3
      }
    ];
  }
  if (action === 'return_structured_preview') {
    const s = input as StructuredPreviewInput;
    const count = Math.max(0, Math.min(10, s.max_items));
    return Array.from({ length: count }).map((_, i) => ({
      name: `Preview Item ${i + 1}`,
      confidence_score: 0.4
    }));
  }
  return [];
}
