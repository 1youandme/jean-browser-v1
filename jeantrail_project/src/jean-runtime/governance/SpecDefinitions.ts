/**
 * SpecDefinitions.ts
 * 
 * Defines the structural contracts for the Agent Framework and Plugin System.
 * These are types ONLY. No implementation logic.
 * 
 * Part of Phase B & C of Developer Control Layer.
 */

// Phase B: Agent Framework Skeleton
export type LifecycleState = 'CREATED' | 'DISABLED' | 'ARCHIVED';

export interface AgentSpec {
    agentId: string;
    role: string;
    permissions: string[]; // e.g. "fs:read", "net:none"
    lifecycleState: LifecycleState;
}

// Phase C: Plugin System Skeleton
export interface PluginContract {
    name: string;
    input: string; // Description of input schema
    output: string; // Description of output schema
    permissionScope: string[]; // Required permissions
}
