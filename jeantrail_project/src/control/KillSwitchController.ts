import { GlobalKillSwitch } from '../os/OSExecutionBridge';
import { createExecutionAudit, OSExecutionAuditEvent } from '../os/ExecutionAudit';
import { OSActionType } from '../os/OSActionTypes';
import { ExecutionContextId } from '../runtime/ExecutionContextTypes';

export interface KillSwitchOptions {
  sessionId: string;
  contextId: ExecutionContextId;
  userId?: string;
  reason?: string;
}

export interface KillSwitchResult {
  engaged: boolean;
  audit: OSExecutionAuditEvent;
}

export function engageKillSwitch(options: KillSwitchOptions): KillSwitchResult {
  GlobalKillSwitch.engage();
  const audit = createExecutionAudit(
    OSActionType.system_query,
    'kill_switch',
    'success',
    options.contextId,
    options.userId,
    {
      sessionId: options.sessionId,
      action: 'engage',
      reason: options.reason
    }
  );
  return { engaged: true, audit };
}

export function resetKillSwitch(options: KillSwitchOptions): KillSwitchResult {
  GlobalKillSwitch.reset();
  const audit = createExecutionAudit(
    OSActionType.system_query,
    'kill_switch',
    'success',
    options.contextId,
    options.userId,
    {
      sessionId: options.sessionId,
      action: 'reset',
      reason: options.reason
    }
  );
  return { engaged: false, audit };
}

