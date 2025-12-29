import { JeanCore, LifecycleOutcome, TriggerData } from './JeanRuntimeBoundary';
import { LocalRuntimeState } from '../state/LocalRuntimeState';
import { SafetyPolicyLayer } from '../safety/SafetyPolicyLayer';
import { JeanPresenceState } from '../state/JeanPresenceStateMachine';

/**
 * JeanCoreAdapter
 * 
 * Adapts the internal sovereign logic of Jean to the RuntimeBoundary.
 * This class ensures that:
 * 1. Decisions are made based ONLY on the provided state (no hidden context).
 * 2. Policies are applied before any action reaches the environment.
 */
export class JeanCoreAdapter implements JeanCore {
    private safetyLayer: SafetyPolicyLayer;

    constructor() {
        this.safetyLayer = new SafetyPolicyLayer();
    }
    
    /**
     * Decides the next step in the lifecycle.
     * In a full implementation, this would interface with the Policy Engine or AI Model.
     */
    async decideNextStep(state: LocalRuntimeState, trigger?: TriggerData): Promise<any> {
        // Transition to Observing if trigger received
        if (trigger && state.presence.getState() === JeanPresenceState.IDLE) {
            state.presence.transitionTo(JeanPresenceState.OBSERVING, `Trigger: ${trigger.type}`);
        }

        if (trigger) {
            console.log(`[Jean Core] Processing Trigger: ${trigger.type}`, trigger.payload);
            
            // Transition to Responding
            state.presence.transitionTo(JeanPresenceState.RESPONDING, 'Processing trigger');

            // Simple echo for now to demonstrate connectivity
            if (trigger.type === 'navigation_intent') {
                 return {
                    type: 'log_navigation',
                    payload: trigger.payload
                 };
            }

            // If searching unsafe terms, we want to generate an action that the safety layer will catch
            if (trigger.type === 'search_input') {
                return {
                    type: 'search_action',
                    payload: { query: trigger.payload.query }
                };
            }
        }

        // Example: If not executing, do nothing.
        if (!state.ephemeral.isExecuting) {
            // If we were responding, go back to Idle or Observing
            if (state.presence.getState() === JeanPresenceState.RESPONDING) {
                state.presence.transitionTo(JeanPresenceState.IDLE, 'Cycle complete');
            }
            return null;
        }

        // Return a heartbeat or next logical step
        return null; 
    }

    /**
     * Validates an action against the sovereign policy.
     * This is the "Safety Layer".
     */
    async validateAction(action: any, state: LocalRuntimeState): Promise<LifecycleOutcome> {
        // 1. Run Safety Policy Checks
        const safetyOutcome = this.safetyLayer.evaluate(action);
        if (safetyOutcome.type === 'blocked') {
            return safetyOutcome;
        }

        // 2. Specific Logic checks (e.g. whitelists)
        if (!action) {
            return { type: 'rejected', action, reason: 'Action is null' };
        }

        // Example Policy: All external network calls require explicit user review
        if (action.type === 'network_call' && !this.isWhitelisted(action.url)) {
            return {
                type: 'pending_review',
                action,
                reason: 'External network call requires user approval.'
            };
        }

        // Default safe fallback
        return {
            type: 'approved',
            action
        };
    }

    private isWhitelisted(url: string): boolean {
        // Check against local project whitelist
        return false;
    }
}
