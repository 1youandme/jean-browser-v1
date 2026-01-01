/**
 * Kernel Contracts Index
 *
 * Governance-first type-only re-exports for compile-safe consumption.
 * No runtime logic is exported from this index.
 */

export type {
  DecisionTrace,
  MemoryAuditLog,
  KernelIntrospection
} from './KernelIntrospection';

export type {
  Intent,
  PermissionName,
  IntentDefinition
} from './Intent';

export type {
  PolicyOutcomeKind,
  PolicyOutcome,
  ImmutablePolicyOutcome
} from './PolicyOutcome';

// Codes are used in UI and domain checks; kept as enum reference.
export { PolicyReasonCode } from './PolicyOutcome';

export * from './graph/ExecutionGraph';
export { ExecutionGraphEngine, graphEngine } from './graph/ExecutionGraphEngine';
export * from './graph/RuntimeTypes';
export * from './graph/ExecutionPlanner';
export * from './graph/ExecutionExecutor';
export * from './graph/GraphRuntime';

