/**
 * JeanPresenceState
 * Defines the high-level behavioral states of the Jean Runtime.
 */
export enum JeanPresenceState {
    IDLE = 'idle',
    OBSERVING = 'observing',
    RESPONDING = 'responding',
    EXECUTING = 'executing',
    EMERGENCY_STOP = 'emergency_stop'
}

/**
 * JeanPresenceStateMachine
 * 
 * Manages the behavioral lifecycle of Jean.
 * Ensures:
 * - Deterministic transitions
 * - Visible execution
 * - Interruptibility
 * - Single-instance execution
 */
export class JeanPresenceStateMachine {
    private currentState: JeanPresenceState = JeanPresenceState.IDLE;
    private stateLog: { state: JeanPresenceState, timestamp: number, reason?: string }[] = [];

    /**
     * Gets the current state.
     */
    public getState(): JeanPresenceState {
        return this.currentState;
    }

    /**
     * Transitions to a new state if valid.
     * Logs the transition.
     */
    public transitionTo(newState: JeanPresenceState, reason?: string): boolean {
        // Rule: Emergency Stop overrides everything
        if (newState === JeanPresenceState.EMERGENCY_STOP) {
            this.forceState(newState, reason);
            return true;
        }

        // Rule: Cannot transition out of Emergency Stop easily (requires explicit reset)
        if (this.currentState === JeanPresenceState.EMERGENCY_STOP && newState !== JeanPresenceState.IDLE) {
            console.warn(`[Jean Presence] Cannot transition from EMERGENCY_STOP to ${newState} without reset.`);
            return false;
        }

        // Rule: Single-instance execution
        // If we are executing, we should not transition to executing again (unless re-entrant which we avoid)
        if (this.currentState === JeanPresenceState.EXECUTING && newState === JeanPresenceState.EXECUTING) {
             console.warn('[Jean Presence] Already executing.');
             return false;
        }

        // Valid transition
        this.currentState = newState;
        this.logTransition(newState, reason);
        this.notifyStateChange(newState);
        return true;
    }

    /**
     * Forces a state transition (e.g. for Emergency Stop or Reset).
     */
    public forceState(newState: JeanPresenceState, reason?: string) {
        this.currentState = newState;
        this.logTransition(newState, reason);
        this.notifyStateChange(newState);
    }

    private logTransition(state: JeanPresenceState, reason?: string) {
        const entry = { state, timestamp: Date.now(), reason };
        this.stateLog.push(entry);
        console.log(`[Jean Presence] Transitioned to ${state.toUpperCase()}${reason ? ` (${reason})` : ''}`);
    }

    private notifyStateChange(state: JeanPresenceState) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jean-presence-change', { 
                detail: { state, timestamp: Date.now() } 
            }));
        }
    }

    public getLog() {
        return this.stateLog;
    }
}
