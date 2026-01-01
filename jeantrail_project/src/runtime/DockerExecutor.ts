import { IExecutionExecutor, NodeExecutionResult } from '../kernel/graph/ExecutionExecutor.js';
import { NodeSpec, NodeCapability } from '../kernel/graph/ExecutionGraph.js';
import { ExecutionContext } from '../kernel/graph/RuntimeTypes.js';
import { CapabilityRouter } from '../kernel/routing/CapabilityRouter.js';
import { WorkerRegistry } from '../kernel/routing/WorkerRegistry.js';
import { GovernanceEngine } from '../domain/governance/GovernanceEngine.js';

type DockerCommandSpec = {
  image: string;
  args: string[];
  env: Record<string, string>;
  mounts: { hostPath: string; containerPath: string; readOnly?: boolean }[];
  gpu: boolean;
  network: 'none' | 'bridge' | 'host';
  timeoutMs: number;
  memoryMb: number;
};

export class DockerExecutor implements IExecutionExecutor {
  private router: CapabilityRouter;
  private governance: GovernanceEngine;
  private promptRegistry: Map<string, Set<string>>;

  constructor(governance: GovernanceEngine) {
    const registry = new WorkerRegistry();
    this.router = new CapabilityRouter(registry);
    this.governance = governance;
    this.promptRegistry = new Map();
  }

  async executeNode(node: NodeSpec, inputs: Record<string, any>, context: ExecutionContext): Promise<NodeExecutionResult> {
    const currentState = this.governance.getState();
    if (currentState === 'HALTED') {
      return { success: false, output: {}, error: 'EXECUTION_HALTED_BY_GOVERNANCE' };
    }
    if (currentState !== 'EXECUTING') {
      return { success: false, output: {}, error: `DENY_BY_DEFAULT_STATE_${currentState}` };
    }

    const routing = this.router.route(node);
    if (!routing.success || !routing.target) {
      return { success: false, output: {}, error: `ROUTING_FAILED_${routing.error || 'UNKNOWN'}` };
    }

    if (routing.target.executionMode !== 'local_docker') {
      return { success: false, output: {}, error: 'FAIL_CLOSED_NON_DOCKER_TARGET' };
    }

    if (node.capability === NodeCapability.VIDEO_GEN) {
      const duration = Number(inputs['durationSecs'] ?? 0);
      if (duration <= 0 || duration > 12) {
        return { success: false, output: {}, error: 'DURATION_EXCEEDS_12S_OR_INVALID' };
      }
      const prompt = String(inputs['prompt'] ?? '').trim();
      const registryKey = `${context.graphId}:${node.id}`;
      if (!this.promptRegistry.has(registryKey)) {
        this.promptRegistry.set(registryKey, new Set());
      }
      const used = this.promptRegistry.get(registryKey)!;
      if (prompt.length > 0 && used.has(prompt)) {
        return { success: false, output: {}, error: 'PROMPT_REPETITION_REFUSED' };
      }
      if (prompt.length > 0) used.add(prompt);
    }

    const dockerSpec = this.buildDockerSpec(node, inputs, routing.target.resourceGrant);
    const command = this.buildDockerCommand(dockerSpec);

    const output: Record<string, any> = {
      commandPreview: command,
      workerId: routing.target.workerId,
      auditReasoning: routing.target.reasoning,
      nodeId: node.id,
    };

    return { success: true, output };
  }

  private buildDockerSpec(node: NodeSpec, inputs: Record<string, any>, grant: { gpuAllocated: boolean; memoryMb: number; networkAccess: 'none' | 'internal' | 'full'; timeoutMs: number }): DockerCommandSpec {
    const image = this.selectImage(node);
    const env: Record<string, string> = {};
    const args: string[] = [];
    const mounts: { hostPath: string; containerPath: string; readOnly?: boolean }[] = [];

    if (node.capability === NodeCapability.VIDEO_GEN) {
      const prompt = String(inputs['prompt'] ?? '');
      const seed = String(inputs['seed'] ?? '42');
      const duration = String(inputs['durationSecs'] ?? '8');
      const outputPath = String(inputs['outputPath'] ?? '/outputs/out.mp4');

      env['PROMPT'] = prompt;
      env['SEED'] = seed;
      env['DURATION_SECS'] = duration;
      env['OUTPUT_PATH'] = outputPath;
      args.push('--generate');
      mounts.push({ hostPath: 'E:\\manager\\project_unpacked\\outputs', containerPath: '/outputs' });
    }

    const network = grant.networkAccess === 'none' ? 'none' : 'bridge';
    return {
      image,
      args,
      env,
      mounts,
      gpu: grant.gpuAllocated,
      network,
      timeoutMs: grant.timeoutMs,
      memoryMb: grant.memoryMb,
    };
  }

  private selectImage(node: NodeSpec): string {
    if (node.capability === 'video_gen') {
      if (node.model === 'stable-video-diffusion') return 'ghcr.io/stabilityai/stable-video-diffusion:latest';
      if (node.model === 'opensora') return 'ghcr.io/opensora/opensora-runtime:latest';
    }
    if (node.capability === NodeCapability.VISION_ANALYSIS) return 'ghcr.io/llava/llava:latest';
    return 'ghcr.io/jeantrail/worker-base:latest';
  }

  private buildDockerCommand(spec: DockerCommandSpec): string {
    const parts: string[] = ['docker run --rm'];
    if (spec.gpu) parts.push('--gpus all');
    parts.push(`-m ${spec.memoryMb}m`);
    if (spec.network === 'none') parts.push('--network none');
    for (const [k, v] of Object.entries(spec.env)) parts.push(`-e ${k}="${v.replace(/"/g, '\\"')}"`);
    for (const m of spec.mounts) parts.push(`-v "${m.hostPath}":"${m.containerPath}"${m.readOnly ? ':ro' : ''}`);
    parts.push(spec.image);
    parts.push(...spec.args);
    return parts.join(' ');
  }
}
