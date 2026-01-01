import type { ExecutionConstraints, NodeCapability } from '../graph/ExecutionGraph';
import type { ImmutablePolicyOutcome } from '../PolicyOutcome';
import type { GovernancePort } from './GovernancePort';

export interface WorkerDescriptor {
  id: string;
  name: string;
  capabilities: NodeCapability[];
  supportedModels: string[];
}

export interface WorkerProposal {
  workerId: string;
  capability: NodeCapability;
  model: string;
  constraints: ExecutionConstraints;
  context: Record<string, unknown>;
}

export interface Worker {
  describe(): WorkerDescriptor;
  prepare(
    capability: NodeCapability,
    model: string,
    constraints: ExecutionConstraints,
    context: Record<string, unknown>
  ): WorkerProposal;
  requestApproval(
    governance: GovernancePort,
    intentId: string,
    proposal: WorkerProposal
  ): Promise<ImmutablePolicyOutcome>;
}

