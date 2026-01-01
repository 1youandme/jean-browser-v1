import { 
  LogisticsExecutionGraph, 
  LogisticsNode, 
  LogisticsProvider, 
  LogisticsLegStatus, 
  GovernanceFailureMode 
} from './LogisticsTypes';
import { Uuid } from '../../types/common';

/**
 * The Logistics Engine orchestrates the multi-leg journey.
 * It strictly adheres to the "AI Recommends, User Decides" principle.
 */
export class LogisticsEngine {
  private graphs: Map<Uuid, LogisticsExecutionGraph> = new Map();

  /**
   * STEP 1: AI Recommendation
   * Generates a proposed execution graph based on origin/destination.
   * In a real system, this would use a routing algorithm. Here we mock a multi-leg journey.
   */
  createProposal(shipmentId: string, origin: string, destination: string): LogisticsExecutionGraph {
    const graphId = `graph-${Date.now()}`;
    const graph: LogisticsExecutionGraph = {
      id: graphId,
      shipmentId,
      createdAt: new Date().toISOString(),
      nodes: new Map(),
      edges: [],
      status: 'planning'
    };

    // Leg 1: Driver to Port
    const pickupNode = this.createNode(
      'Pickup', 
      'transport_leg', 
      { id: 'prov-1', name: 'Local Driver A', type: 'driver', governanceRating: 95 },
      origin,
      'Port of Origin',
      150,
      120 // 2 hours
    );

    // Leg 2: Customs Export
    const exportCustomsNode = this.createNode(
      'Export Clearance',
      'customs_clearance',
      { id: 'prov-2', name: 'Global Customs Broker', type: 'customs_broker', governanceRating: 99 },
      'Port of Origin',
      'Port of Origin',
      50,
      60
    );

    // Leg 3: Sea Freight
    const seaFreightNode = this.createNode(
      'Ocean Transit',
      'transport_leg',
      { id: 'prov-3', name: 'Maersk Line', type: 'shipping_line', governanceRating: 90 },
      'Port of Origin',
      'Port of Destination',
      1200,
      20160 // 14 days
    );

    this.addNodeToGraph(graph, pickupNode);
    this.addNodeToGraph(graph, exportCustomsNode);
    this.addNodeToGraph(graph, seaFreightNode);

    // Link them: Pickup -> Customs -> Sea
    graph.edges.push({ from: pickupNode.id, to: exportCustomsNode.id });
    graph.edges.push({ from: exportCustomsNode.id, to: seaFreightNode.id });

    this.graphs.set(graphId, graph);
    return graph;
  }

  /**
   * STEP 2: Explicit Approval
   * The user must approve a specific leg before it can be executed.
   */
  approveLeg(graphId: Uuid, nodeId: Uuid, userId: string): void {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error('Graph not found');

    const node = graph.nodes.get(nodeId);
    if (!node) throw new Error('Node not found');

    // Governance Check: Is the user authorized? (Simplified)
    if (!userId) throw new Error(GovernanceFailureMode.MISSING_APPROVAL);

    // Governance Check: Is the provider safe?
    if (node.provider.governanceRating < 80) {
      throw new Error(`${GovernanceFailureMode.ROUTE_RISK_HIGH}: Provider rating too low (${node.provider.governanceRating})`);
    }

    if (node.approvalStatus !== 'draft' && node.approvalStatus !== 'awaiting_approval') {
      throw new Error(`Invalid state transition from ${node.approvalStatus}`);
    }

    node.approvalStatus = 'approved';
    console.log(`Leg ${node.name} approved by user ${userId}`);
  }

  /**
   * STEP 3: Execution Trigger
   * Attempts to start the leg. Fails if approval is missing.
   */
  async executeLeg(graphId: Uuid, nodeId: Uuid): Promise<void> {
    const graph = this.graphs.get(graphId);
    if (!graph) throw new Error('Graph not found');

    const node = graph.nodes.get(nodeId);
    if (!node) throw new Error('Node not found');

    // CRITICAL GOVERNANCE GATE
    if (node.approvalStatus !== 'approved') {
      throw new Error(`${GovernanceFailureMode.MISSING_APPROVAL}: Leg must be explicitly approved before execution.`);
    }

    // Check dependencies (Previous legs must be completed)
    const inboundEdges = graph.edges.filter(e => e.to === nodeId);
    for (const edge of inboundEdges) {
      const parentNode = graph.nodes.get(edge.from);
      if (parentNode && parentNode.approvalStatus !== 'completed') {
        throw new Error(`Dependency failed: Parent node ${parentNode.name} is not completed.`);
      }
    }

    node.approvalStatus = 'in_transit';
    console.log(`EXECUTING: Dispatching instructions to ${node.provider.name} for ${node.name}`);
    
    // In a real system, this would call the OSExecutionBridge or an API
    // await OSExecutionBridge.dispatch(node.provider.id, ...);
  }

  /**
   * Helper to mark a leg as complete (e.g. via webhook or user confirmation)
   */
  completeLeg(graphId: Uuid, nodeId: Uuid): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;
    const node = graph.nodes.get(nodeId);
    if (!node) return;
    
    node.approvalStatus = 'completed';
  }

  private createNode(
    name: string, 
    capability: any, 
    provider: LogisticsProvider,
    origin: string,
    destination: string,
    cost: number,
    duration: number
  ): LogisticsNode {
    return {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      capability,
      provider,
      origin,
      destination,
      estimatedCost: cost,
      estimatedDurationMinutes: duration,
      approvalStatus: 'awaiting_approval', // Default to needing approval
      governanceTags: ['third_party'],
      requiredDocuments: []
    };
  }

  private addNodeToGraph(graph: LogisticsExecutionGraph, node: LogisticsNode) {
    graph.nodes.set(node.id, node);
  }
}
