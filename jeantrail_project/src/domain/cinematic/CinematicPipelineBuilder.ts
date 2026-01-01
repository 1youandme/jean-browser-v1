import { randomUUID } from 'crypto';
import { ExecutionGraph, GraphEdge } from '../../kernel/graph/ExecutionGraph';
import { CinematicNodeFactory } from './CinematicNodeFactory';

export class CinematicPipelineBuilder {
  
  static buildStandardPipeline(scriptText: string): ExecutionGraph {
    const graphId = randomUUID();
    const timestamp = Date.now();

    // 1. Create Nodes
    const nodeNarrative = CinematicNodeFactory.createNarrativeNode();
    const nodeScene = CinematicNodeFactory.createSceneGraphNode();
    const nodeCamera = CinematicNodeFactory.createCameraPlanNode();
    const nodeAsset = CinematicNodeFactory.createAssetRequestNode();
    const nodeVideo = CinematicNodeFactory.createVideoGenNode();
    const nodeValidation = CinematicNodeFactory.createValidationNode();
    const nodeStitching = CinematicNodeFactory.createStitchingNode();
    const nodeConsistency = CinematicNodeFactory.createConsistencyNode();

    // 2. Configure Initial Input (Static)
    nodeNarrative.inputs['script'] = { staticValue: scriptText };

    // 3. Create Edges
    const edges: GraphEdge[] = [
      // Narrative -> Scene
      { fromNode: nodeNarrative.id, fromOutput: 'narrative_graph', toNode: nodeScene.id, toInput: 'narrative_graph' },
      
      // Scene -> Camera
      { fromNode: nodeScene.id, fromOutput: 'scene_graph', toNode: nodeCamera.id, toInput: 'scene_node' },
      
      // Camera -> Asset
      { fromNode: nodeCamera.id, fromOutput: 'camera_plan', toNode: nodeAsset.id, toInput: 'camera_plan' },
      
      // Asset -> Video
      { fromNode: nodeAsset.id, fromOutput: 'asset_requests', toNode: nodeVideo.id, toInput: 'asset_requests' },
      
      // Video -> Validation
      { fromNode: nodeVideo.id, fromOutput: 'video_segments', toNode: nodeValidation.id, toInput: 'video_segments' },
      
      // Validation -> Stitching (Also takes Video Segments, but logically flows after validation)
      { fromNode: nodeValidation.id, fromOutput: 'validation_report', toNode: nodeStitching.id, toInput: 'validation_report' },
      { fromNode: nodeVideo.id, fromOutput: 'video_segments', toNode: nodeStitching.id, toInput: 'video_segments' },
      
      // Stitching -> Consistency
      { fromNode: nodeStitching.id, fromOutput: 'rough_cut', toNode: nodeConsistency.id, toInput: 'rough_cut' }
    ];

    // 4. Link Inputs (Symbolic linking for the runtime)
    nodeScene.inputs['narrative_graph'] = { sourceNodeId: nodeNarrative.id, sourceOutputName: 'narrative_graph' };
    nodeCamera.inputs['scene_node'] = { sourceNodeId: nodeScene.id, sourceOutputName: 'scene_graph' };
    nodeAsset.inputs['camera_plan'] = { sourceNodeId: nodeCamera.id, sourceOutputName: 'camera_plan' };
    nodeVideo.inputs['asset_requests'] = { sourceNodeId: nodeAsset.id, sourceOutputName: 'asset_requests' };
    nodeValidation.inputs['video_segments'] = { sourceNodeId: nodeVideo.id, sourceOutputName: 'video_segments' };
    nodeStitching.inputs['validation_report'] = { sourceNodeId: nodeValidation.id, sourceOutputName: 'validation_report' };
    nodeStitching.inputs['video_segments'] = { sourceNodeId: nodeVideo.id, sourceOutputName: 'video_segments' };
    nodeConsistency.inputs['rough_cut'] = { sourceNodeId: nodeStitching.id, sourceOutputName: 'rough_cut' };

    // 5. Assemble Graph
    const graph: ExecutionGraph = {
      id: graphId,
      intentId: 'cinematic-pipeline-v1',
      timestamp,
      nodes: new Map([
        [nodeNarrative.id, nodeNarrative],
        [nodeScene.id, nodeScene],
        [nodeCamera.id, nodeCamera],
        [nodeAsset.id, nodeAsset],
        [nodeVideo.id, nodeVideo],
        [nodeValidation.id, nodeValidation],
        [nodeStitching.id, nodeStitching],
        [nodeConsistency.id, nodeConsistency]
      ]),
      edges,
      metadata: {
        priority: 'normal',
        tags: ['cinematic', 'video-gen', 'long-form']
      },
      status: 'draft'
    };

    return graph;
  }
}
