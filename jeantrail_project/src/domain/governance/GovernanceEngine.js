import { EventEmitter } from 'events';
export class GovernanceEngine extends EventEmitter {
    constructor(role = 'VIEWER') {
        super();
        this.state = 'IDLE';
        this.context = {
            pendingDecisions: 0,
            securityAlerts: []
        };
        this.eventLog = [];
        this.role = role;
    }
    // --- State Management ---
    getState() {
        return this.state;
    }
    getContext() {
        return { ...this.context };
    }
    getPermissions() {
        return {
            canApprove: this.role === 'ADMIN' || this.role === 'OPERATOR',
            canPause: this.role === 'ADMIN' || this.role === 'OPERATOR',
            canHalt: this.role === 'ADMIN', // Only Admin can kill-switch
            canViewSensitiveData: this.role === 'ADMIN'
        };
    }
    // --- Transitions ---
    requestReview(graphId, request) {
        if (this.state !== 'IDLE' && this.state !== 'PAUSED') {
            throw new Error(`Cannot request review in state ${this.state}`);
        }
        this.context.graphId = graphId;
        this.context.pendingDecisions++;
        this.transitionTo('REVIEW_PENDING', { request });
    }
    approve(actor, decisionNotes) {
        if (!this.getPermissions().canApprove)
            throw new Error('Unauthorized: Missing Approval Permission');
        if (this.state !== 'REVIEW_PENDING' && this.state !== 'PAUSED')
            throw new Error('Nothing to approve');
        this.context.pendingDecisions--;
        this.logEvent('DECISION', { decision: 'APPROVED', notes: decisionNotes }, actor);
        // Auto-transition to executing if no more pending decisions? 
        // Principle: "No auto-execution" -> But approval IS the trigger.
        this.transitionTo('APPROVED', { actor });
    }
    deny(actor, reason) {
        if (!this.getPermissions().canApprove)
            throw new Error('Unauthorized');
        this.context.pendingDecisions--;
        this.logEvent('DECISION', { decision: 'DENIED', reason }, actor);
        this.transitionTo('DENIED', { reason });
    }
    startExecution(actor) {
        if (this.state !== 'APPROVED')
            throw new Error('Cannot start execution without Approval');
        this.transitionTo('EXECUTING', { actor });
    }
    pause(actor) {
        if (!this.getPermissions().canPause)
            throw new Error('Unauthorized');
        if (this.state !== 'EXECUTING')
            return; // Idempotent-ish
        this.transitionTo('PAUSED', { actor });
    }
    resume(actor) {
        if (!this.getPermissions().canPause)
            throw new Error('Unauthorized');
        if (this.state !== 'PAUSED')
            throw new Error('Not paused');
        this.transitionTo('EXECUTING', { actor });
    }
    halt(actor, reason) {
        if (!this.getPermissions().canHalt)
            throw new Error('Unauthorized: KILL-SWITCH reserved for Admin');
        this.logEvent('ALERT', { type: 'KILL_SWITCH_ACTIVATED', reason }, actor);
        this.transitionTo('HALTED', { reason });
    }
    // --- Internals ---
    transitionTo(newState, payload) {
        const oldState = this.state;
        this.state = newState;
        const event = {
            type: 'STATE_CHANGE',
            payload: { from: oldState, to: newState, ...payload },
            actor: 'SYSTEM', // or passed in
            timestamp: Date.now()
        };
        this.eventLog.push(event);
        this.emit('state_changed', newState, payload);
    }
    logEvent(type, payload, actor) {
        this.eventLog.push({
            type,
            payload,
            actor,
            timestamp: Date.now()
        });
    }
}
