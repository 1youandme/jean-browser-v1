import { ExecutionEnvironment } from '../core/JeanRuntimeBoundary';

export type ExecutionHandler = (action: any) => Promise<void>;

/**
 * PluggableExecutionAdapter
 * 
 * A concrete implementation of the ExecutionEnvironment that allows for:
 * - Swappable handlers for different action types
 * - Visible execution (via event dispatching)
 * - Interruptibility (implied by the handlers returning promises that can be awaited/rejected)
 */
export class PluggableExecutionAdapter implements ExecutionEnvironment {
    private handlers: Map<string, ExecutionHandler> = new Map();
    private capabilities: Set<string> = new Set();

    constructor(initialCapabilities: string[] = []) {
        initialCapabilities.forEach(cap => this.capabilities.add(cap));
    }

    /**
     * Registers a handler for a specific action type.
     */
    public registerHandler(actionType: string, handler: ExecutionHandler): void {
        this.handlers.set(actionType, handler);
    }

    /**
     * Registers a capability that this environment supports.
     */
    public registerCapability(capability: string): void {
        this.capabilities.add(capability);
    }

    /**
     * Executes the action using the registered handler.
     * Throws if no handler is found.
     */
    public async execute(action: any): Promise<void> {
        // "Visibly" - could dispatch an event before starting
        this.dispatchStartEvent(action);

        const type = action.type;
        const handler = this.handlers.get(type);

        if (!handler) {
            console.warn(`[Jean Execution] No handler registered for action type: ${type}`);
             this.dispatchEndEvent(action, 'error', `No handler for ${type}`);
            throw new Error(`No handler for action type: ${type}`);
        }

        try {
            await handler(action);
            this.dispatchEndEvent(action, 'success');
        } catch (error: any) {
            console.error(`[Jean Execution] Error executing ${type}:`, error);
            this.dispatchEndEvent(action, 'error', error.message);
            throw error;
        }
    }

    /**
     * Notifies the external system (UI/Shell) of events.
     */
    public async notify(message: string, level: 'info' | 'warn' | 'error'): Promise<void> {
        console.log(`[Jean Runtime - ${level.toUpperCase()}] ${message}`);
        
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('jean-runtime-notification', { 
                detail: { message, level, timestamp: Date.now() } 
            });
            window.dispatchEvent(event);
        }
    }

    public hasCapability(capability: string): boolean {
        return this.capabilities.has(capability);
    }

    private dispatchStartEvent(action: any) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jean-execution-start', { detail: action }));
        }
    }

    private dispatchEndEvent(action: any, status: 'success' | 'error', error?: string) {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('jean-execution-end', { 
                detail: { action, status, error } 
            }));
        }
    }
}
