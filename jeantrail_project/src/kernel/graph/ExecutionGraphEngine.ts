import { Uuid } from '../../types/common';
import type { 
  ExecutionGraph, 
  NodeSpec, 
  GraphEdge, 
  GraphValidationResult, 
  NodeCapability 
} from './ExecutionGraph';

/**
 * Execution Graph Engine
 * 
 * Responsible for:
 * 1. Constructing DAGs from intent
 * 2. Validating graph integrity (cycles, types, constraints)
 * 3. Serializing/Deserializing for storage
 */
export class ExecutionGraphEngine {
  
  /**
   * Creates a new empty graph
   */
  public createGraph(intentId: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): ExecutionGraph {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `graph-${Date.now()}`,
      intentId,
      timestamp: Date.now(),
      nodes: new Map(),
      edges: [],
      metadata: {
        priority,
        tags: []
      },
      status: 'draft'
    };
  }

  /**
   * Adds a node to the graph
   */
  public addNode(graph: ExecutionGraph, node: NodeSpec): void {
    if (graph.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists.`);
    }
    graph.nodes.set(node.id, node);
  }

  /**
   * Adds a connection between nodes
   */
  public connectNodes(
    graph: ExecutionGraph, 
    fromNodeId: string, 
    fromOutput: string, 
    toNodeId: string, 
    toInput: string
  ): void {
    // 1. Verify nodes exist
    const sourceNode = graph.nodes.get(fromNodeId);
    const targetNode = graph.nodes.get(toNodeId);
    
    if (!sourceNode) throw new Error(`Source node ${fromNodeId} not found.`);
    if (!targetNode) throw new Error(`Target node ${toNodeId} not found.`);

    // 2. Verify slots exist
    const outputSlot = sourceNode.outputs.find(o => o.name === fromOutput);
    if (!outputSlot) throw new Error(`Output ${fromOutput} not found on node ${fromNodeId}.`);
    
    // (Input validation is looser here, as inputs are defined in the record, but we should verify the target *expects* this input)
    // For now, we assume if we are connecting it, we are configuring the target's input.
    
    // 3. Update target node's input configuration
    if (!targetNode.inputs[toInput]) {
        targetNode.inputs[toInput] = {};
    }
    targetNode.inputs[toInput].sourceNodeId = fromNodeId;
    targetNode.inputs[toInput].sourceOutputName = fromOutput;

    // 4. Add edge record
    graph.edges.push({
      fromNode: fromNodeId,
      fromOutput,
      toNode: toNodeId,
      toInput
    });
  }

  /**
   * Validates the graph for execution
   */
  public validateGraph(graph: ExecutionGraph): GraphValidationResult {
    const errors: string[] = [];
    
    // 1. Cycle Detection (DFS)
    const cycles = this.detectCycles(graph);
    if (cycles.length > 0) {
      cycles.forEach(cycle => {
        errors.push(`Cycle detected: ${cycle.join(' -> ')}`);
      });
    }

    // 2. Constraint Validation
    graph.nodes.forEach(node => {
      // Example: Check if localOnly node is using a cloud model
      if (node.constraints.localOnly && !this.isModelLocal(node.model)) {
        errors.push(`Node ${node.id} (${node.name}) requires local execution but uses non-local model ${node.model}.`);
      }
      
      // 3. Input Satisfaction
      // Check if all required inputs have sources or static values
      // Note: This requires us to know the *expected* inputs of the node type.
      // For this dynamic graph, we rely on the inputs record being complete.
    });

    return {
      isValid: errors.length === 0,
      errors,
      cyclesDetected: cycles
    };
  }

  /**
   * Serializes the graph to JSON
   * Handles Map serialization
   */
  public serialize(graph: ExecutionGraph): string {
    return JSON.stringify({
      ...graph,
      nodes: Array.from(graph.nodes.entries())
    }, null, 2);
  }

  /**
   * Deserializes the graph from JSON
   */
  public deserialize(json: string): ExecutionGraph {
    const raw = JSON.parse(json);
    return {
      ...raw,
      nodes: new Map(raw.nodes)
    };
  }

  // --- Private Helpers ---

  private detectCycles(graph: ExecutionGraph): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Find all outgoing edges from this node
      const outgoing = graph.edges.filter(e => e.fromNode === nodeId);
      
      for (const edge of outgoing) {
        if (!visited.has(edge.toNode)) {
          dfs(edge.toNode, [...path]);
        } else if (recursionStack.has(edge.toNode)) {
          // Cycle found
          const cycleStart = path.indexOf(edge.toNode);
          cycles.push([...path.slice(cycleStart), edge.toNode]);
        }
      }

      recursionStack.delete(nodeId);
    };

    graph.nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    });

    return cycles;
  }

  private isModelLocal(modelName: string): boolean {
    // TODO: Connect to a real ModelRegistry
    const localModels = [
        'DeepSeek-R1', 
        'Qwen2.5-72B', 
        'Stable Video Diffusion', 
        'Blender', 
        'Llama-3-Local'
    ];
    // Heuristic: If it's in our known local list or ends with 'local'
    return localModels.includes(modelName) || modelName.toLowerCase().includes('local');
  }
}

export const graphEngine = new ExecutionGraphEngine();
