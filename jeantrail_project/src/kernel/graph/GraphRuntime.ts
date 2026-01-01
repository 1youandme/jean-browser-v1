import { ExecutionGraph, NodeSpec } from './ExecutionGraph.js';
import { ExecutionPlan, ExecutionPlanner } from './ExecutionPlanner.js';
import { ExecutionContext, ExecutionSnapshot, NodeRuntimeState, NodeStatus } from './RuntimeTypes.js';
import { IExecutionExecutor } from './ExecutionExecutor.js';
import { Uuid } from '../../types/common';

export class GraphRuntime {
  private planner: ExecutionPlanner;
  private executor: IExecutionExecutor;

  // Runtime State
  private snapshot: ExecutionSnapshot;
  private plan: ExecutionPlan | null = null;
  private graph: ExecutionGraph;

  constructor(
    graph: ExecutionGraph, 
    executor: IExecutionExecutor,
    context: ExecutionContext
  ) {
    this.graph = graph;
    this.executor = executor;
    this.planner = new ExecutionPlanner();
    
    // Initialize State
    const nodeStates: Record<Uuid, NodeRuntimeState> = {};
    for (const [id] of graph.nodes) {
      nodeStates[id] = {
        nodeId: id,
        status: 'pending',
        attempts: 0,
        logs: []
      };
    }

    this.snapshot = {
      context,
      nodeStates,
      globalData: {},
      updatedAt: Date.now()
    };
  }

  /**
   * Initialize execution plan
   */
  public prepare(): void {
    this.plan = this.planner.plan(this.graph);
    console.log(`[GraphRuntime] Plan prepared with ${this.plan.stages.length} stages.`);
  }

  /**
   * Run the graph to completion
   */
  public async run(): Promise<ExecutionSnapshot> {
    if (!this.plan) this.prepare();
    if (!this.plan) throw new Error('Failed to prepare plan');

    for (const stage of this.plan.stages) {
      // Execute stage in parallel
      await Promise.all(stage.map(nodeId => this.executeNode(nodeId)));
      
      // Check for failures in stage
      const stageFailures = stage.some(id => this.snapshot.nodeStates[id].status === 'failed');
      if (stageFailures) {
        console.error('[GraphRuntime] Stage failed. Halting execution.');
        break; // Stop execution on failure
      }
    }

    this.snapshot.updatedAt = Date.now();
    return this.snapshot;
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string): Promise<void> {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return;

    const state = this.snapshot.nodeStates[nodeId];
    state.status = 'running';
    state.startTime = Date.now();
    state.attempts++;

    try {
      // Resolve Inputs
      const inputs = this.resolveInputs(node);
      
      // Execute
      const result = await this.executor.executeNode(node, inputs, this.snapshot.context);

      state.endTime = Date.now();
      if (result.success) {
        state.status = 'completed';
        state.outputData = result.output;
      } else {
        state.status = 'failed';
        state.error = result.error;
      }
    } catch (err: any) {
      state.status = 'failed';
      state.error = err.message;
      state.endTime = Date.now();
    }
  }

  /**
   * Resolve inputs from upstream nodes or static values
   */
  private resolveInputs(node: NodeSpec): Record<string, any> {
    const inputs: Record<string, any> = {};

    for (const [inputName, config] of Object.entries(node.inputs)) {
      if (config.staticValue !== undefined) {
        inputs[inputName] = config.staticValue;
      } else if (config.sourceNodeId && config.sourceOutputName) {
        // Fetch from upstream
        const upstreamState = this.snapshot.nodeStates[config.sourceNodeId];
        if (upstreamState.status !== 'completed' || !upstreamState.outputData) {
          throw new Error(`Upstream dependency ${config.sourceNodeId} not ready for ${node.id}`);
        }
        inputs[inputName] = upstreamState.outputData[config.sourceOutputName];
      }
    }
    return inputs;
  }

  public getSnapshot(): ExecutionSnapshot {
    return this.snapshot;
  }
}
