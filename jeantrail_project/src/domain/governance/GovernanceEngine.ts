import { GovernanceState, UserRole, GovernancePermission, ApprovalRequest, GovernanceContext, GovernanceEvent } from './types.js';
import { EventEmitter } from 'events';

export class GovernanceEngine extends EventEmitter {
  private state: GovernanceState = 'IDLE';
  private context: GovernanceContext = {
    pendingDecisions: 0,
    securityAlerts: []
  };
  private role: UserRole;
  private eventLog: GovernanceEvent[] = [];

  constructor(role: UserRole = 'VIEWER') {
    super();
    this.role = role;
  }

  // --- State Management ---

  public getState(): GovernanceState {
    return this.state;
  }

  public getContext(): GovernanceContext {
    return { ...this.context };
  }

  public getPermissions(): GovernancePermission {
    return {
      canApprove: this.role === 'ADMIN' || this.role === 'OPERATOR',
      canPause: this.role === 'ADMIN' || this.role === 'OPERATOR',
      canHalt: this.role === 'ADMIN', // Only Admin can kill-switch
      canViewSensitiveData: this.role === 'ADMIN'
    };
  }

  // --- Transitions ---

  public requestReview(graphId: string, request: ApprovalRequest) {
    if (this.state !== 'IDLE' && this.state !== 'PAUSED') {
      throw new Error(`Cannot request review in state ${this.state}`);
    }
    
    this.context.graphId = graphId;
    this.context.pendingDecisions++;
    this.transitionTo('REVIEW_PENDING', { request });
  }

  public approve(actor: string, decisionNotes: string) {
    if (!this.getPermissions().canApprove) throw new Error('Unauthorized: Missing Approval Permission');
    if (this.state !== 'REVIEW_PENDING' && this.state !== 'PAUSED') throw new Error('Nothing to approve');

    this.context.pendingDecisions--;
    this.logEvent('DECISION', { decision: 'APPROVED', notes: decisionNotes }, actor);
    
    // Auto-transition to executing if no more pending decisions? 
    // Principle: "No auto-execution" -> But approval IS the trigger.
    this.transitionTo('APPROVED', { actor });
  }

  public deny(actor: string, reason: string) {
    if (!this.getPermissions().canApprove) throw new Error('Unauthorized');
    
    this.context.pendingDecisions--;
    this.logEvent('DECISION', { decision: 'DENIED', reason }, actor);
    this.transitionTo('DENIED', { reason });
  }

  public startExecution(actor: string) {
    if (this.state !== 'APPROVED') throw new Error('Cannot start execution without Approval');
    this.transitionTo('EXECUTING', { actor });
  }

  public pause(actor: string) {
    if (!this.getPermissions().canPause) throw new Error('Unauthorized');
    if (this.state !== 'EXECUTING') return; // Idempotent-ish
    
    this.transitionTo('PAUSED', { actor });
  }

  public resume(actor: string) {
    if (!this.getPermissions().canPause) throw new Error('Unauthorized');
    if (this.state !== 'PAUSED') throw new Error('Not paused');
    
    this.transitionTo('EXECUTING', { actor });
  }

  public halt(actor: string, reason: string) {
    if (!this.getPermissions().canHalt) throw new Error('Unauthorized: KILL-SWITCH reserved for Admin');
    
    this.logEvent('ALERT', { type: 'KILL_SWITCH_ACTIVATED', reason }, actor);
    this.transitionTo('HALTED', { reason });
  }

  // --- Internals ---

  private transitionTo(newState: GovernanceState, payload: any) {
    const oldState = this.state;
    this.state = newState;
    
    const event: GovernanceEvent = {
      type: 'STATE_CHANGE',
      payload: { from: oldState, to: newState, ...payload },
      actor: 'SYSTEM', // or passed in
      timestamp: Date.now()
    };
    
    this.eventLog.push(event);
    this.emit('state_changed', newState, payload);
  }

  private logEvent(type: GovernanceEvent['type'], payload: any, actor: string) {
    this.eventLog.push({
      type,
      payload,
      actor,
      timestamp: Date.now()
    });
  }
}
