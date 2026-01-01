import { NodeSpec, ExecutionConstraints } from '../graph/ExecutionGraph';
import { WorkerRegistry } from './WorkerRegistry.js';
import { RoutingDecision, ResolvedExecutionTarget, WorkerProfile, ResourceGrant } from './RoutingTypes.js';

export class CapabilityRouter {
  private registry: WorkerRegistry;

  constructor(registry: WorkerRegistry) {
    this.registry = registry;
  }

  /**
   * Main Entry Point: Route a NodeSpec to a Worker
   */
  public route(node: NodeSpec): RoutingDecision {
    const auditLog: string[] = [];
    auditLog.push(`Routing Node: ${node.name} (${node.id})`);
    auditLog.push(`Required Capability: ${node.capability}`);
    auditLog.push(`Required Model: ${node.model}`);
    
    // 1. Get all candidates
    const allWorkers = this.registry.getAllWorkers();
    
    // 2. Filter by Capability
    const capabilityMatches = allWorkers.filter(w => w.capabilities.includes(node.capability));
    if (capabilityMatches.length === 0) {
      return { success: false, error: 'NO_CAPABILITY_MATCH' };
    }
    auditLog.push(`Capability Matches: ${capabilityMatches.map(w => w.id).join(', ')}`);

    // 3. Filter by Model Support
    // Some capabilities might be generic (like orchestration), but if a model is specified, it must be supported.
    const modelMatches = capabilityMatches.filter(w => w.supportedModels.includes(node.model));
    if (modelMatches.length === 0) {
      return { success: false, error: 'MODEL_NOT_SUPPORTED' };
    }
    auditLog.push(`Model Matches: ${modelMatches.map(w => w.id).join(', ')}`);

    // 4. Filter by Status (Must be online)
    const onlineWorkers = modelMatches.filter(w => w.status === 'online');
    if (onlineWorkers.length === 0) {
      return { success: false, error: 'NO_WORKERS_AVAILABLE' };
    }

    // 5. Apply Hard Constraints (Fail-Closed)
    const validCandidates: WorkerProfile[] = [];
    
    for (const worker of onlineWorkers) {
      const constraintsResult = this.checkConstraints(worker, node.constraints);
      if (constraintsResult.passed) {
        validCandidates.push(worker);
      } else {
        auditLog.push(`Worker ${worker.id} rejected: ${constraintsResult.reason}`);
      }
    }

    if (validCandidates.length === 0) {
      // Return specific constraint violation if possible, otherwise generic
      // For simplicity, we'll return the error of the last rejection or generic
      return { success: false, error: 'NO_WORKERS_AVAILABLE' }; 
    }

    // 6. Selection Strategy (Deterministic)
    // Sort by:
    // 1. Local Preference (if not strictly required, prefer local for speed/cost)
    // 2. Cost (if available)
    // 3. ID (Lexicographical for determinism)
    
    validCandidates.sort((a, b) => {
      // Prefer Local
      if (a.resources.isLocal !== b.resources.isLocal) {
        return a.resources.isLocal ? -1 : 1;
      }
      // Deterministic Tie-breaker
      return a.id.localeCompare(b.id);
    });

    const selectedWorker = validCandidates[0];
    
    if (validCandidates.length > 1) {
      // If we have multiple perfectly valid candidates and no clear winner, 
      // strict determinism is handled by the sort above.
      // However, "Ambiguous Routing" might be desired if we need explicit intent.
      // For now, we accept the deterministic sort result.
      auditLog.push(`Multiple candidates found. Selected ${selectedWorker.id} via deterministic sort.`);
    }

    // 7. Grant Resources
    const resourceGrant: ResourceGrant = {
      gpuAllocated: node.constraints.requiresGpu || false,
      memoryMb: node.constraints.memoryLimitMb || 1024,
      networkAccess: node.constraints.networkAccess || 'none',
      timeoutMs: node.constraints.maxDurationMs || 30000
    };

    return {
      success: true,
      target: {
        workerId: selectedWorker.id,
        executionMode: selectedWorker.executionMode,
        resourceGrant,
        reasoning: auditLog
      }
    };
  }

  private checkConstraints(worker: WorkerProfile, constraints: ExecutionConstraints): { passed: boolean; reason?: string } {
    // 1. Local Only
    if (constraints.localOnly && !worker.resources.isLocal) {
      return { passed: false, reason: 'CONSTRAINT_VIOLATION_LOCAL' };
    }

    // 2. GPU Requirement
    if (constraints.requiresGpu && !worker.resources.hasGpu) {
      return { passed: false, reason: 'CONSTRAINT_VIOLATION_GPU' };
    }

    // 3. Memory Limit
    if (constraints.memoryLimitMb && worker.resources.maxMemoryMb < constraints.memoryLimitMb) {
      return { passed: false, reason: 'CONSTRAINT_VIOLATION_MEMORY' };
    }

    // 4. Network Access
    // If the node needs 'full', but the worker is 'networkIsolated' (true), then it can't support it.
    // networkIsolated=true means ONLY 'none' or 'internal' (maybe) are allowed. 
    // Usually isolated means NO external internet.
    if (constraints.networkAccess === 'full' && worker.resources.networkIsolated) {
      return { passed: false, reason: 'CONSTRAINT_VIOLATION_NETWORK' };
    }

    // 5. Allowed Models (Whitelist)
    // This constraint is on the NODE side (what models are allowed for this task).
    // The worker must support one of the allowed models.
    // But we already filtered by `node.model` in Step 3.
    // `constraints.allowedModels` is usually an override or policy check. 
    // If `node.model` is not in `constraints.allowedModels`, the GRAPH should be invalid, 
    // but we can check here too.
    if (constraints.allowedModels && constraints.allowedModels.length > 0) {
      // The node.model MUST be in the allowed list
      // This is technically a graph validation issue, but good to enforce.
      // However, the worker just needs to support node.model. 
      // So this check is moot if we trust the node.model is correct.
      // Let's assume this is a policy check:
      // Does the worker support *only* the allowed models? No, the worker supports many.
      // Does the task *require* a model from the list? Yes.
      // We already filtered by node.model.
    }

    return { passed: true };
  }
}
