import { LocalRuntimeState } from '../state/LocalRuntimeState';

/**
 * LifecycleOutcome
 * Defines the result of a policy validation or decision process.
 */
export interface LifecycleOutcome {
    type: 'approved' | 'rejected' | 'pending_review' | 'blocked';
    action: any; // The action to be executed
    reason?: string;
    metadata?: Record<string, any>;
}

export interface TriggerData {
    source: 'browser' | 'system' | 'user';
    type: string;
    payload: any;
    timestamp: number;
}

/**
 * JeanCore Interface
 * Represents the sovereign decision-making and policy engine.
 * It is pure logic and does not directly touch the environment.
 */
export interface JeanCore {
    /**
     * Determines the next action based on the current state.
     */
    decideNextStep(state: LocalRuntimeState, trigger?: TriggerData): Promise<any>;

    /**
     * Validates a proposed action against safety policies and sovereignty rules.
     */
    validateAction(action: any, state: LocalRuntimeState): Promise<LifecycleOutcome>;
}

/**
 * ExecutionEnvironment Interface
 * Represents the shell (TRAE, Browser, Host) where Jean is running.
 * This layer handles the actual side effects.
 */
export interface ExecutionEnvironment {
    /**
     * Executes a validated action.
     */
    execute(action: any): Promise<void>;

    /**
     * Notifies the user or system of events.
     */
    notify(message: string, level: 'info' | 'warn' | 'error'): Promise<void>;

    /**
     * Checks if a capability is available in the current shell.
     */
    hasCapability(capability: string): boolean;
}

/**
 * JeanRuntimeBoundary
 * 
 * Defines the strict boundary between Jean Core and the Execution Environment.
 * Ensures that Jean operates as a sovereign entity, treating the environment
 * as a swappable shell.
 */
export class JeanRuntimeBoundary {
    private core: JeanCore;
    private env: ExecutionEnvironment;
    private state: LocalRuntimeState;

    constructor(core: JeanCore, env: ExecutionEnvironment, state: LocalRuntimeState) {
        this.core = core;
        this.env = env;
        this.state = state;
    }

    /**
     * Runs a single execution cycle.
     * 1. Decide next step (Pure logic)
     * 2. Validate action (Policy)
     * 3. Execute action (Side effect via Environment)
     */
    public async processCycle(trigger?: TriggerData): Promise<void> {
        if (this.state.ephemeral.interruptSignal) {
            await this.env.notify("Cycle interrupted by signal.", 'warn');
            return;
        }

        try {
            this.state.ephemeral.isExecuting = true;

            // 1. Decision
            const rawAction = await this.core.decideNextStep(this.state, trigger);
            if (!rawAction) {
                this.state.ephemeral.isExecuting = false;
                return;
            }

            // 2. Policy Validation
            const outcome = await this.core.validateAction(rawAction, this.state);

            // 3. Execution based on outcome
            switch (outcome.type) {
                case 'approved':
                    await this.env.execute(outcome.action);
                    break;
                case 'pending_review':
                    await this.env.notify(`Action requires approval: ${outcome.reason}`, 'warn');
                    // Logic to wait for approval would go here or be handled by the env
                    break;
                case 'rejected':
                    await this.env.notify(`Action rejected: ${outcome.reason}`, 'info');
                    break;
                case 'blocked':
                    await this.env.notify(`Action BLOCKED by safety policy: ${outcome.reason}`, 'error');
                    break;
            }

        } catch (error: any) {
            await this.env.notify(`Runtime Error: ${error.message}`, 'error');
            // Failure safety: Ensure state is not left in an undefined executing state if possible
        } finally {
            this.state.ephemeral.isExecuting = false;
        }
    }
}
