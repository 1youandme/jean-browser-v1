export class ExecutionPlanner {
    /**
     * Generates an execution plan from a graph.
     * Calculates topological order and groups parallelizable nodes.
     */
    plan(graph) {
        const adj = new Map();
        const inDegree = new Map();
        // Initialize
        for (const [nodeId] of graph.nodes) {
            adj.set(nodeId, []);
            inDegree.set(nodeId, 0);
        }
        // Build Adjacency List & In-Degree
        for (const edge of graph.edges) {
            adj.get(edge.fromNode)?.push(edge.toNode);
            inDegree.set(edge.toNode, (inDegree.get(edge.toNode) || 0) + 1);
        }
        // Topological Sort with Levels (Kahn's Algorithm adapted for layers)
        const stages = [];
        const orderedNodes = [];
        // Initial Queue: nodes with 0 in-degree
        let currentStage = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                currentStage.push(nodeId);
            }
        }
        while (currentStage.length > 0) {
            stages.push([...currentStage]); // Capture this level of parallelism
            orderedNodes.push(...currentStage);
            const nextStage = [];
            for (const node of currentStage) {
                const neighbors = adj.get(node) || [];
                for (const neighbor of neighbors) {
                    const newDegree = (inDegree.get(neighbor) || 0) - 1;
                    inDegree.set(neighbor, newDegree);
                    if (newDegree === 0) {
                        nextStage.push(neighbor);
                    }
                }
            }
            currentStage = nextStage;
        }
        // Cycle check
        if (orderedNodes.length !== graph.nodes.size) {
            throw new Error('Cycle detected or disconnected graph structure invalid for execution.');
        }
        return {
            orderedNodes,
            stages
        };
    }
    /**
     * Identifies direct dependencies for a specific node
     */
    getDependencies(graph, nodeId) {
        return graph.edges
            .filter(e => e.toNode === nodeId)
            .map(e => e.fromNode);
    }
}
export const planner = new ExecutionPlanner();
