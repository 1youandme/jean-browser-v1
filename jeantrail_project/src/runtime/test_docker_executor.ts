import { ExecutionGraph, NodeSpec, DataSlot, NodeCapability } from '../kernel/graph/ExecutionGraph.js';
import { GraphRuntime } from '../kernel/graph/GraphRuntime.js';
import { ExecutionContext } from '../kernel/graph/RuntimeTypes.js';
import { DockerExecutor } from './DockerExecutor.js';
import { GovernanceEngine } from '../domain/governance/GovernanceEngine.js';

function makeVideoNode(id: string, name: string, model: string, prompt: string, durationSecs: number, outputName: string): NodeSpec {
  const outputs: DataSlot[] = [{ name: outputName, type: 'video_path', required: true }];
  return {
    id,
    name,
    capability: NodeCapability.VIDEO_GEN,
    model,
    inputs: {
      prompt: { staticValue: prompt },
      durationSecs: { staticValue: durationSecs },
      outputPath: { staticValue: `/outputs/${id}.mp4` },
      seed: { staticValue: 1234 },
    },
    outputs,
    constraints: {
      localOnly: true,
      requiresGpu: true,
      networkAccess: 'none',
      memoryLimitMb: 8192,
      maxDurationMs: 600000,
      allowedModels: [model],
    },
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
  };
}

async function runCase(engine: GovernanceEngine, executor: DockerExecutor, node: NodeSpec, ctx: ExecutionContext) {
  const nodes = new Map<string, NodeSpec>();
  nodes.set(node.id, node);
  const graph: ExecutionGraph = {
    id: ctx.graphId,
    intentId: 'intent_video_test',
    timestamp: Date.now(),
    nodes,
    edges: [],
    metadata: { priority: 'normal', tags: ['runtime-test'] },
    status: 'validated',
  };

  const runtime = new GraphRuntime(graph, executor, ctx);
  runtime.prepare();
  const snapshot = await runtime.run();
  const state = snapshot.nodeStates[node.id];
  console.log(`[Result] ${node.name}:`, state.status, state.error || '', state.outputData || '');
}

async function test() {
  console.log('--- DockerExecutor Governance Runtime Test ---');
  const engine = new GovernanceEngine('ADMIN');
  const executor = new DockerExecutor(engine);

  const ctx: ExecutionContext = {
    runId: 'run_001',
    workspaceId: 'ws_001',
    graphId: 'graph_rt_001',
    startTime: Date.now(),
    isReplay: false,
    seed: 42,
    dryRun: true,
  };

  const req = { id: 'apr_1', type: 'EXECUTION_START' as const, description: 'Run video worker', metadata: {}, timestamp: Date.now() };
  engine.requestReview(ctx.graphId, req);
  engine.approve('admin', 'Approved for test');
  engine.startExecution('admin');

  const okNode = makeVideoNode('node_ok', 'Generate Teaser', 'stable-video-diffusion', 'a calm ocean at sunset', 8, 'teaser');
  await runCase(engine, executor, okNode, ctx);

  const longNode = makeVideoNode('node_long', 'Too Long Clip', 'stable-video-diffusion', 'mountain panorama', 20, 'long');
  await runCase(engine, executor, longNode, ctx);

  const repeatNode1 = makeVideoNode('node_repeat', 'No Repetition 1', 'stable-video-diffusion', 'same prompt', 6, 'clip1');
  await runCase(engine, executor, repeatNode1, ctx);
  const repeatNode2 = makeVideoNode('node_repeat', 'No Repetition 2', 'stable-video-diffusion', 'same prompt', 6, 'clip2');
  await runCase(engine, executor, repeatNode2, ctx);

  engine.halt('admin', 'Manual stop');
  const afterHaltNode = makeVideoNode('node_after_halt', 'After Halt', 'stable-video-diffusion', 'test after halt', 6, 'halted');
  await runCase(engine, executor, afterHaltNode, ctx);
}

test();
