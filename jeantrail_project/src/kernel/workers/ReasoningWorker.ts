import type { ExecutionConstraints, NodeCapability } from '../graph/ExecutionGraph';
import { NodeCapability as CapabilityEnum } from '../graph/ExecutionGraph';
import { GlobalKillSwitch } from '../../os/OSExecutionBridge';
import type { ImmutablePolicyOutcome } from '../PolicyOutcome';
import type { GovernancePort } from './GovernancePort';
import type { Worker, WorkerDescriptor, WorkerProposal } from './Worker';

export class ReasoningWorker implements Worker {
  private id = 'worker-reasoning-default';
  private name = 'Reasoning Worker';
  private capabilities: NodeCapability[] = [
    CapabilityEnum.REASONING,
    CapabilityEnum.PLANNING,
    CapabilityEnum.CODE_GEN
  ];
  private models: string[] = ['deepseek-r1', 'deepseek-coder', 'qwen2.5'];

  describe(): WorkerDescriptor {
    return {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      supportedModels: this.models
    };
  }

  prepare(
    capability: NodeCapability,
    model: string,
    constraints: ExecutionConstraints,
    context: Record<string, unknown>
  ): WorkerProposal {
    if (GlobalKillSwitch.isExecutionDisabled) {
      throw new Error('Worker execution disabled in governance-only build');
    }
    return {
      workerId: this.id,
      capability,
      model,
      constraints,
      context
    };
  }

  async requestApproval(
    governance: GovernancePort,
    intentId: string,
    proposal: WorkerProposal
  ): Promise<ImmutablePolicyOutcome> {
    return governance.requestApproval(
      intentId,
      proposal.capability,
      proposal.model,
      proposal.constraints,
      proposal.context
    );
  }
}
