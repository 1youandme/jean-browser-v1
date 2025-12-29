import { ActionType } from '../action/ActionTypes';
import { ExecutionReadinessState, isReadyForExecution } from './ExecutionReadiness';
import { createReceipt, ExecutionReceipt } from './ExecutionReceipt';
import { AutonomyMode } from '../autonomy/AutonomyTypes';
import { OSIntent, OSActionType } from '../os/OSActionTypes';
import { OSExecutionBridge } from '../os/OSExecutionBridge';
import { ExecutionContract, ExecutionRouteResult, ContextAuditEvent } from '../runtime/ExecutionContextTypes';
import { createExecutionAudit } from '../os/ExecutionAudit';

export interface ToolAdapterResult {
  success: boolean;
  data?: Record<string, unknown>;
  report?: string;
  rollbackToken?: string;
}

export interface ToolAdapter {
  id: string;
  sandboxed: boolean;
  execute: (action: ActionType, input: Record<string, unknown>) => ToolAdapterResult;
}

export async function executeWithAdapter(
  state: ExecutionReadinessState,
  confirmationToken: string | null,
  adapter: ToolAdapter,
  action: ActionType,
  input: Record<string, unknown>,
  contract: ExecutionContract
): Promise<ExecutionReceipt> {
  if (!isReadyForExecution(state)) {
    createExecutionAudit(
      OSActionType.system_query,
      `tool:${adapter.id}:${String(action)}`,
      'failure',
      contract.contextId,
      undefined,
      { eventType: 'execution_blocked_bypass_attempt', reason: 'not_ready' }
    );
    return createReceipt('symbolic', 'blocked', { action, reversible: false });
  }
  if (state.autonomy !== ('bounded' as AutonomyMode)) {
    createExecutionAudit(
      OSActionType.system_query,
      `tool:${adapter.id}:${String(action)}`,
      'failure',
      contract.contextId,
      undefined,
      { eventType: 'execution_blocked_bypass_attempt', reason: 'autonomy' }
    );
    return createReceipt('symbolic', 'blocked', { action, reversible: false });
  }
  if (!confirmationToken) {
    createExecutionAudit(
      OSActionType.system_query,
      `tool:${adapter.id}:${String(action)}`,
      'failure',
      contract.contextId,
      undefined,
      { eventType: 'execution_blocked_bypass_attempt', reason: 'token_missing' }
    );
    return createReceipt('symbolic', 'blocked', { action, reversible: false });
  }
  if (!adapter.sandboxed) {
    createExecutionAudit(
      OSActionType.system_query,
      `tool:${adapter.id}:${String(action)}`,
      'failure',
      contract.contextId,
      undefined,
      { eventType: 'execution_blocked_bypass_attempt', reason: 'unsandboxed' }
    );
    return createReceipt('symbolic', 'blocked', { action, reversible: false, toolId: adapter.id });
  }

  const auditEvent: ContextAuditEvent = {
    id: `route-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    event: 'adapter_route',
    contextId: contract.contextId,
    details: { toolId: adapter.id }
  };
  const route: ExecutionRouteResult = {
    accepted: true,
    reason: 'adapter',
    contextId: contract.contextId,
    mode: 'symbolic',
    audit: auditEvent
  };
  const intent: OSIntent = {
    action: OSActionType.system_query,
    target: `tool:${adapter.id}:${String(action)}`,
    payload: input,
    timestamp: new Date().toISOString()
  };
  const res = await OSExecutionBridge.execute(route, intent, {
    confirmationToken: confirmationToken || '',
    expectedContext: contract.contextId,
    workspaceId: 'unknown',
    userId: undefined,
    contract
  });
  const status = res.status === 'success' ? 'success' : 'blocked';
  return createReceipt('real', status, {
    action,
    toolId: adapter.id,
    reversible: !!res.reversibleHint
  });
}
