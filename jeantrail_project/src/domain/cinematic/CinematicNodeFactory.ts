import { NodeSpec, NodeCapability, DataSlot, ExecutionConstraints } from '../../kernel/graph/ExecutionGraph';
import { randomUUID } from 'crypto';

/**
 * Factory for creating Cinematic Pipeline Nodes
 */
export class CinematicNodeFactory {
  
  private static defaultConstraints: ExecutionConstraints = {
    localOnly: false,
    requiresGpu: false,
    allowedModels: [],
    networkAccess: 'full',
    memoryLimitMb: 4096
  };

  /**
   * Step 1: Script Analysis
   */
  static createNarrativeNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Script to Narrative',
      capability: NodeCapability.REASONING,
      model: 'deepseek-r1', // High reasoning for plot analysis
      inputs: {}, // Input provided at runtime
      outputs: [
        { name: 'narrative_graph', type: 'json', description: 'Graph of characters and plot', required: true }
      ],
      constraints: { ...this.defaultConstraints },
      retryPolicy: { maxAttempts: 3, backoffMs: 1000 }
    };
  }

  /**
   * Step 2: Scene Splitting & Pacing
   */
  static createSceneGraphNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Narrative to Scene Graph',
      capability: NodeCapability.PLANNING,
      model: 'tu-trans-72b', // Good instruction following for structure
      inputs: {},
      outputs: [
        { name: 'scene_graph', type: 'json', description: 'Ordered list of scenes', required: true }
      ],
      constraints: { ...this.defaultConstraints }
    };
  }

  /**
   * Step 3: Camera Direction
   */
  static createCameraPlanNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Scene to Camera Plan',
      capability: NodeCapability.PLANNING,
      model: 'gpt-4o', // Visual imagination required
      inputs: {},
      outputs: [
        { name: 'camera_plan', type: 'json', description: 'List of shots per scene', required: true }
      ],
      constraints: { ...this.defaultConstraints }
    };
  }

  /**
   * Step 4: Asset Prompt Engineering
   */
  static createAssetRequestNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Camera to Asset Requests',
      capability: NodeCapability.REASONING,
      model: 'deepseek-coder', // Structured output generation
      inputs: {},
      outputs: [
        { name: 'asset_requests', type: 'json', description: 'Generation prompts and parameters', required: true }
      ],
      constraints: { ...this.defaultConstraints }
    };
  }

  /**
   * Step 5: Video Generation
   * Note: This usually runs N times. In a static graph, we might have one node per shot 
   * or a "Batch Processor" node. We'll assume a Batch Processor for this level of abstraction.
   */
  static createVideoGenNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Video Generation',
      capability: NodeCapability.VIDEO_GEN,
      model: 'stable-video-diffusion',
      inputs: {},
      outputs: [
        { name: 'video_segments', type: 'json', description: 'List of generated file paths', required: true }
      ],
      constraints: { 
        ...this.defaultConstraints,
        requiresGpu: true,
        memoryLimitMb: 16384 // 16GB VRAM
      }
    };
  }

  /**
   * Step 6: Validation
   */
  static createValidationNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Scene Validation',
      capability: NodeCapability.VISION_ANALYSIS,
      model: 'llava-next',
      inputs: {},
      outputs: [
        { name: 'validation_report', type: 'json', description: 'Pass/Fail report', required: true }
      ],
      constraints: { ...this.defaultConstraints, requiresGpu: true }
    };
  }

  /**
   * Step 7: Stitching
   */
  static createStitchingNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Stitching',
      capability: NodeCapability.ORCHESTRATION,
      model: 'ffmpeg-orchestrator',
      inputs: {},
      outputs: [
        { name: 'rough_cut', type: 'video_path', description: 'Rough cut video file', required: true }
      ],
      constraints: { ...this.defaultConstraints }
    };
  }

  /**
   * Step 8: Final Consistency
   */
  static createConsistencyNode(id: string = randomUUID()): NodeSpec {
    return {
      id,
      name: 'Final Consistency Pass',
      capability: NodeCapability.VIDEO_GEN,
      model: 'video-to-video-refiner',
      inputs: {},
      outputs: [
        { name: 'final_master', type: 'video_path', description: 'Final mastered video', required: true }
      ],
      constraints: { ...this.defaultConstraints, requiresGpu: true }
    };
  }
}
