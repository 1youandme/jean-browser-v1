import { NodeSpec } from './ExecutionGraph.js';
import { ExecutionContext, NodeRuntimeState } from './RuntimeTypes.js';

export interface NodeExecutionResult {
  success: boolean;
  output: Record<string, any>;
  error?: string;
}

/**
 * Abstract Executor
 * 
 * Implementations will handle the actual side-effects (API calls, Docker containers, etc.)
 */
export interface IExecutionExecutor {
  executeNode(
    node: NodeSpec, 
    inputs: Record<string, any>, 
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;
}

/**
 * Mock Executor for Testing/Dev
 */
export class MockExecutor implements IExecutionExecutor {
  async executeNode(
    node: NodeSpec, 
    inputs: Record<string, any>, 
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    console.log(`[MockExecutor] Executing ${node.name} (${node.id})`);
    console.log(`[MockExecutor] Inputs:`, inputs);
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 100));

    // Determine outputs based on inputs + deterministic seed
    const outputs: Record<string, any> = {};
    for (const outSlot of node.outputs) {
      outputs[outSlot.name] = `mock-output-for-${outSlot.name}-${context.runId}`;
    }

    return {
      success: true,
      output: outputs
    };
  }
}
