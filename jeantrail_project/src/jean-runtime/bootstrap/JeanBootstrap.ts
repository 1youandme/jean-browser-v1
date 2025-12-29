import { JeanRuntimeBoundary } from '../core/JeanRuntimeBoundary';
import { JeanCoreAdapter } from '../core/JeanCoreAdapter';
import { PluggableExecutionAdapter } from '../execution/ExecutionAdapter';
import { LocalRuntimeState, RuntimeContext } from '../state/LocalRuntimeState';

/**
 * JeanBootstrap
 * 
 * Responsible for the deterministic initialization of the Jean Runtime.
 * Enforces the "Zero Implicit Memory" rule by always constructing state 
 * fresh or from explicit local project files.
 */
export class JeanBootstrap {
    private static instance: JeanBootstrap;
    public runtime: JeanRuntimeBoundary | null = null;
    public state: LocalRuntimeState | null = null;
    public env: PluggableExecutionAdapter | null = null;

    private constructor() {}

    /**
     * Singleton accessor.
     */
    public static getInstance(): JeanBootstrap {
        if (!JeanBootstrap.instance) {
            JeanBootstrap.instance = new JeanBootstrap();
        }
        return JeanBootstrap.instance;
    }

    /**
     * Bootstraps the runtime.
     * This method is idempotent and deterministic.
     * 
     * @param context The initial context derived from the local project.
     */
    public async initialize(context: RuntimeContext): Promise<JeanRuntimeBoundary> {
        console.log('[Jean Bootstrap] Initializing Runtime...');

        // 1. Initialize State (Zero implicit memory)
        const state = new LocalRuntimeState();
        
        try {
            // Failure Safety: Reconstruct from local project ONLY.
            // If this fails, we catch it and potentially downgrade capabilities.
            state.reconstruct(context);
        } catch (e: any) {
            console.warn('[Jean Bootstrap] Failed to fully reconstruct state. Downgrading to Safe Mode.', e);
            // In Safe Mode, we might clear capabilities or set a flag in ephemeral state
            state.ephemeral.interruptSignal = true; // Prevent immediate execution
        }

        this.state = state;

        // 2. Initialize Core (Sovereign Logic)
        // The core is stateless; it depends on the State object passed to it.
        const core = new JeanCoreAdapter();

        // 3. Initialize Execution Environment (The Shell)
        // We inject the detected capabilities from the project context.
        const env = new PluggableExecutionAdapter(context.capabilities);
        this.env = env;

        // 4. Create Boundary
        // This wires the Core to the Environment via the State.
        this.runtime = new JeanRuntimeBoundary(core, env, state);

        console.log('[Jean Bootstrap] Runtime Initialized successfully.');
        return this.runtime;
    }

    /**
     * Resets the runtime.
     * Used when the project is closed or a hard reset is requested.
     */
    public reset(): void {
        console.log('[Jean Bootstrap] Resetting Runtime...');
        if (this.state) {
            this.state.resetSession();
        }
        // Force re-initialization to ensure no stale references
        this.runtime = null;
        this.state = null;
        this.env = null;
    }
}
