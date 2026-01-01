import type { ImmutablePolicyOutcome } from '../PolicyOutcome';
import type { ExecutionConstraints, NodeCapability } from '../graph/ExecutionGraph';

export interface GovernancePort {
  requestApproval(
    intentId: string,
    capability: NodeCapability,
    model: string,
    constraints: ExecutionConstraints,
    context: Record<string, unknown>
  ): Promise<ImmutablePolicyOutcome>;
}

