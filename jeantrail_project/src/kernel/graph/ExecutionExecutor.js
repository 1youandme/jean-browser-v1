/**
 * Mock Executor for Testing/Dev
 */
export class MockExecutor {
    async executeNode(node, inputs, context) {
        console.log(`[MockExecutor] Executing ${node.name} (${node.id})`);
        console.log(`[MockExecutor] Inputs:`, inputs);
        // Simulate latency
        await new Promise(resolve => setTimeout(resolve, 100));
        // Determine outputs based on inputs + deterministic seed
        const outputs = {};
        for (const outSlot of node.outputs) {
            outputs[outSlot.name] = `mock-output-for-${outSlot.name}-${context.runId}`;
        }
        return {
            success: true,
            output: outputs
        };
    }
}
