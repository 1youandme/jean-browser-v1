import { AgentGraph, AgentNode, AgentEdge, AgentManifest } from './AgentDefinition';

/**
 * Pure functions for building Agent Graphs.
 * Enforces: No loops, no self-triggers (conceptually checked here or in validation).
 */

export function createGraph(id: string, name: string): AgentGraph {
  return {
    id,
    name,
    nodes: [],
    edges: [],
    version: '1.0.0'
  };
}

export function addNode(
  graph: AgentGraph, 
  type: AgentNode['type'], 
  position: { x: number, y: number },
  data: AgentNode['data'] = {}
): AgentGraph {
  const newNode: AgentNode = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    position,
    data
  };

  return {
    ...graph,
    nodes: [...graph.nodes, newNode]
  };
}

export function addAgentNode(
  graph: AgentGraph, 
  agent: AgentManifest, 
  position: { x: number, y: number }
): AgentGraph {
  return addNode(graph, 'agent', position, { 
    agentId: agent.id,
    label: agent.name 
  });
}

export function connectNodes(
  graph: AgentGraph, 
  sourceId: string, 
  targetId: string,
  label?: string
): AgentGraph {
  // Simple validation: Prevent self-loops
  if (sourceId === targetId) {
    throw new Error("Self-loops are not allowed.");
  }

  // Check existence
  if (!graph.nodes.find(n => n.id === sourceId)) throw new Error(`Source node ${sourceId} not found.`);
  if (!graph.nodes.find(n => n.id === targetId)) throw new Error(`Target node ${targetId} not found.`);

  // Check for duplicate edge
  const exists = graph.edges.some(e => e.source === sourceId && e.target === targetId);
  if (exists) return graph;

  // Cycle detection could go here (DFS check)

  const newEdge: AgentEdge = {
    id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    source: sourceId,
    target: targetId,
    label
  };

  return {
    ...graph,
    edges: [...graph.edges, newEdge]
  };
}

export function removeNode(graph: AgentGraph, nodeId: string): AgentGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter(n => n.id !== nodeId),
    edges: graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
  };
}

export function validateGraph(graph: AgentGraph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Must have at least one input (conceptually) or trigger? 
  // For now, visual builder might allow incomplete graphs.
  
  // 2. Check for cycles (Basic DFS)
  if (hasCycle(graph)) {
    errors.push("Graph contains cycles, which are forbidden.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function hasCycle(graph: AgentGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  for (const node of graph.nodes) {
    if (detectCycle(node.id, graph, visited, recursionStack)) {
      return true;
    }
  }
  return false;
}

function detectCycle(
  nodeId: string, 
  graph: AgentGraph, 
  visited: Set<string>, 
  stack: Set<string>
): boolean {
  if (stack.has(nodeId)) return true;
  if (visited.has(nodeId)) return false;

  visited.add(nodeId);
  stack.add(nodeId);

  const outgoing = graph.edges.filter(e => e.source === nodeId);
  for (const edge of outgoing) {
    if (detectCycle(edge.target, graph, visited, stack)) {
      return true;
    }
  }

  stack.delete(nodeId);
  return false;
}
