
/**
 * LocalRuntimeState Model
 * 
 * Explicitly defines the state model for Jean's local runtime.
 * Enforces zero implicit memory by categorizing state into:
 * - Session-only: Cleared on restart/reload
 * - Reconstructed: Built from local project files on startup
 * - Ephemeral: Never persisted, transient execution state
 */

import { JeanPresenceStateMachine, JeanPresenceState } from './JeanPresenceStateMachine';

export interface RuntimeContext {
    // Project root, detected environment capabilities
    rootPath: string;
    capabilities: string[];
}

export interface EphemeralState {
    isExecuting: boolean;
    activeOperationId?: string;
    lastHeartbeat: number;
    interruptSignal: boolean;
}

export class LocalRuntimeState {
    // Session-only state (e.g., in-memory context, uncommitted thoughts)
    // This is NOT persisted to disk and is lost on restart.
    public session: Map<string, any>;

    // Reconstructed state (loaded/parsed from local files)
    // This serves as the "Source of Truth" derived from the project itself.
    public projectContext: RuntimeContext;

    // Ephemeral state (execution flags, locks)
    // Never persisted, resetting to default on init.
    public ephemeral: EphemeralState;

    // Presence State Machine (Behavioral Lifecycle)
    public presence: JeanPresenceStateMachine;

    constructor() {
        this.session = new Map();
        this.projectContext = {
            rootPath: '',
            capabilities: []
        };
        this.ephemeral = {
            isExecuting: false,
            lastHeartbeat: Date.now(),
            interruptSignal: false
        };
        this.presence = new JeanPresenceStateMachine();
    }

    /**
     * Resets session state to ensure no implicit memory leaks between runs.
     */
    public resetSession(): void {
        this.session.clear();
        this.resetEphemeral();
        this.presence.forceState(JeanPresenceState.IDLE, 'Session Reset');
    }

    /**
     * Resets ephemeral state.
     */
    public resetEphemeral(): void {
        this.ephemeral = {
            isExecuting: false,
            lastHeartbeat: Date.now(),
            interruptSignal: false
        };
    }

    /**
     * Reconstructs state from a provided context object.
     * This mimics loading from local files.
     */
    public reconstruct(context: RuntimeContext): void {
        this.projectContext = context;
        // Verify consistency if needed
    }
}
