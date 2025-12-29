import { ExecutionRouteResult, ExecutionContextId, ExecutionContract } from '../runtime/ExecutionContextTypes';
import { OSActionType, OSIntent, OS_ACTION_DESCRIPTORS } from './OSActionTypes';
import { ExecutionResult, createExecutionAudit } from './ExecutionAudit';

export class GlobalKillSwitch {
  private static _disabled = false;

  static get isExecutionDisabled() {
    return this._disabled;
  }

  static engage() {
    this._disabled = true;
    console.warn('KILL SWITCH ENGAGED: All OS execution halted.');
  }

  static reset() {
    this._disabled = false;
    console.log('Kill switch reset. Execution enabled.');
  }
}

export interface ExecutionOptions {
  confirmationToken: string;
  expectedContext: ExecutionContextId;
  workspaceId: string;
  userId?: string;
  contract: ExecutionContract;
}

export class OSExecutionBridge {
  /**
   * Bridges a symbolic route result to a real OS execution.
   * Requires explicit confirmation token and passes through the Global Kill Switch.
   */
  static async execute(
    route: ExecutionRouteResult,
    intent: OSIntent,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const contextId = route.contextId;

    // 1. Kill Switch Check
    if (GlobalKillSwitch.isExecutionDisabled) {
      return this.createResult(intent, 'cancelled', contextId, options, 'Kill switch engaged');
    }

    // 2. Validate Route
    if (!route.accepted) {
      return this.createResult(intent, 'failure', contextId, options, 'Route not accepted');
    }
    if (route.mode !== 'symbolic') {
      return this.createResult(intent, 'failure', contextId, options, 'Route must be symbolic before execution');
    }

    // 3. Context Match
    if (contextId !== options.expectedContext) {
      return this.createResult(intent, 'failure', contextId, options, `Context mismatch: route=${contextId}, expected=${options.expectedContext}`);
    }

    // 4. Contract Validation
    const contract = options.contract;
    if (!contract || contract.revoked) {
      return this.createResult(intent, 'failure', contextId, options, 'Contract missing or revoked');
    }
    if (contract.contextId !== options.expectedContext) {
      return this.createResult(intent, 'failure', contextId, options, 'Contract context mismatch');
    }
    const now = Date.now();
    const startTs = Date.parse(contract.timeBounds.start);
    const endTs = Date.parse(contract.timeBounds.end);
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || now < startTs || now > endTs) {
      return this.createResult(intent, 'failure', contextId, options, 'Contract time bounds invalid or expired');
    }
    if (contract.allowedActions.length > 0) {
      const allowed = new Set(contract.allowedActions);
      if (!allowed.has(String(intent.action))) {
        return this.createResult(intent, 'failure', contextId, options, 'Action not permitted by contract');
      }
    }
    if (intent.target.startsWith('agent:')) {
      if (!contract.delegation) {
        return this.createResult(intent, 'failure', contextId, options, 'Agent delegation missing contract');
      }
      const d = contract.delegation;
      if (!d.delegatorAgentId || !d.delegateAgentId) {
        return this.createResult(intent, 'failure', contextId, options, 'Delegation contract incomplete');
      }
    }
    if (contract.delegation) {
      const d = contract.delegation;
      const allowed = new Set(d.allowedActions);
      if (!allowed.has(String(intent.action))) {
        return this.createResult(intent, 'failure', contextId, options, 'Delegation action not permitted');
      }
    }

    // 5. Token Validation
    // In a real implementation, this would verify cryptographic signature and expiration
    if (!this.isValidToken(options.confirmationToken)) {
      return this.createResult(intent, 'failure', contextId, options, 'Invalid or expired confirmation token');
    }

    // 6. Capability & Risk Check
    const descriptor = OS_ACTION_DESCRIPTORS[intent.action];
    if (!descriptor) {
      return this.createResult(intent, 'failure', contextId, options, `Unknown OS action: ${intent.action}`);
    }

    // 7. Perform Execution (Simulated)
    try {
      // In a real environment, this would call the OS API (fs, child_process, etc.)
      // For now, we simulate success for defined actions.
      
      console.log(`[OSExecutionBridge] Executing ${intent.action} on ${intent.target}`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 50));

      return this.createResult(intent, 'success', contextId, options, undefined, {
        executed: true,
        risk: descriptor.riskLevel
      });

    } catch (error: any) {
      return this.createResult(intent, 'failure', contextId, options, `Runtime error: ${error.message}`);
    }
  }

  private static isValidToken(token: string): boolean {
    return typeof token === 'string' && token.length > 0 && !token.startsWith('expired');
  }

  private static createResult(
    intent: OSIntent,
    status: 'success' | 'failure' | 'cancelled',
    contextId: string,
    options: ExecutionOptions,
    error?: string,
    output?: unknown
  ): ExecutionResult {
    const descriptor = OS_ACTION_DESCRIPTORS[intent.action];
    
    const audit = createExecutionAudit(
      intent.action,
      intent.target,
      status,
      contextId,
      options.userId,
      {
        workspaceId: options.workspaceId,
        riskLevel: descriptor?.riskLevel,
        error,
        contractId: options.contract?.id
      }
    );

    return {
      status,
      output,
      error,
      reversibleHint: descriptor?.reversible ? 'Action supports reversal' : 'Action is irreversible',
      auditTrailId: audit.id,
      timestamp: new Date().toISOString(),
      contractId: options.contract?.id,
      contextId,
      reason: status === 'success' ? 'executed' : status === 'cancelled' ? 'cancelled' : 'blocked'
    };
  }
}
