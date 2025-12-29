/**
 * KernelState.ts
 * 
 * Defines the state model for Jean as a Personal AI OS.
 * strictly adhering to:
 * - Session-as-OS: Isolation by default.
 * - Application-as-Intent: Apps are intent providers, not controllers.
 */

export type IsolationLevel = 'strict' | 'shared_read' | 'shared_write';

export interface OSSession {
  id: string;
  userId: string;
  startTime: number;
  isolationLevel: IsolationLevel;
  activeContexts: Set<string>; // IDs of active contexts (e.g., "coding", "planning")
  ephemeralMemory: Map<string, any>; // Cleared on session end
}

export interface IntentProvider {
  appId: string;
  name: string;
  registeredIntents: string[]; // e.g., ["edit_code", "review_pr"]
  permissions: Set<string>;
}

export interface OSProcess {
  pid: string;
  sessionId: string;
  intentId: string;
  status: 'pending' | 'running' | 'suspended' | 'completed' | 'failed';
  resourceUsage: {
    memory: number; // abstract units
    compute: number; // abstract units
  };
}

export interface KernelState {
  systemStatus: 'booting' | 'idle' | 'orchestrating' | 'shutdown';
  activeSessions: Map<string, OSSession>;
  processTable: Map<string, OSProcess>;
  registry: Map<string, IntentProvider>;
  
  // Global sovereignty switches
  sovereignty: {
    allowMemoryPersistence: boolean;
    allowExternalRouting: boolean;
    requireExplicitApproval: boolean;
  };
}

export const INITIAL_KERNEL_STATE: KernelState = {
  systemStatus: 'booting',
  activeSessions: new Map(),
  processTable: new Map(),
  registry: new Map(),
  sovereignty: {
    allowMemoryPersistence: false, // Default to no hidden persistence
    allowExternalRouting: false,
    requireExplicitApproval: true
  }
};
