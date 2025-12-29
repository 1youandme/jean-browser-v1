import { createGraph, addAgentNode, connectNodes, validateGraph } from './AgentGraphBuilder';
import { AgentManifest } from './AgentDefinition';

// Mock Agent Manifest
const mockAgent: AgentManifest = {
  id: 'mock-agent-1',
  name: 'Mock Agent',
  description: 'A test agent',
  version: '1.0.0',
  intentTypes: ['test_intent'],
  requiredPermissions: [],
  memoryScope: 'none'
};

const mockAgent2: AgentManifest = {
  ...mockAgent,
  id: 'mock-agent-2',
  name: 'Mock Agent 2'
};

async function runTests() {
  console.log('Running AgentGraphBuilder Tests...');

  // Test 1: Create Graph
  let graph = createGraph('test-graph', 'Test Graph');
  if (graph.id !== 'test-graph') throw new Error('Graph creation failed');
  console.log('✅ Graph creation passed');

  // Test 2: Add Nodes
  graph = addAgentNode(graph, mockAgent, { x: 0, y: 0 });
  graph = addAgentNode(graph, mockAgent2, { x: 100, y: 0 });
  
  if (graph.nodes.length !== 2) throw new Error('Node addition failed');
  const node1Id = graph.nodes[0].id;
  const node2Id = graph.nodes[1].id;
  console.log('✅ Node addition passed');

  // Test 3: Connect Nodes (Valid)
  graph = connectNodes(graph, node1Id, node2Id);
  if (graph.edges.length !== 1) throw new Error('Edge connection failed');
  console.log('✅ Edge connection passed');

  // Test 4: Validate Valid Graph
  const validResult = validateGraph(graph);
  if (!validResult.valid) throw new Error(`Validation failed for valid graph: ${validResult.errors.join(', ')}`);
  console.log('✅ Validation (DAG) passed');

  // Test 5: Detect Cycle
  // Create a back link: node2 -> node1
  graph = connectNodes(graph, node2Id, node1Id);
  const invalidResult = validateGraph(graph);
  if (invalidResult.valid) throw new Error('Cycle detection failed (graph should be invalid)');
  if (!invalidResult.errors[0].includes('cycles')) throw new Error('Cycle error message incorrect');
  console.log('✅ Cycle detection passed');

  console.log('All tests passed!');
}

// Execute if running directly (in a real env this would be via test runner)
// runTests().catch(console.error);

export { runTests };
