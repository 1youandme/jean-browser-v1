import { WorkerProfile } from './RoutingTypes.js';
import { NodeCapability } from '../graph/ExecutionGraph.js';

export class WorkerRegistry {
  private workers: Map<string, WorkerProfile> = new Map();

  constructor() {
    this.seedRegistry();
  }

  public getAllWorkers(): WorkerProfile[] {
    return Array.from(this.workers.values());
  }

  public getWorker(id: string): WorkerProfile | undefined {
    return this.workers.get(id);
  }

  public updateStatus(id: string, status: WorkerProfile['status']) {
    const worker = this.workers.get(id);
    if (worker) {
      worker.status = status;
    }
  }

  private seedRegistry() {
    // 1. Local Reasoning Worker (Docker)
    this.addWorker({
      id: 'local-reasoning-01',
      name: 'Local DeepSeek Runner',
      capabilities: [NodeCapability.REASONING, NodeCapability.CODE_GEN, NodeCapability.PLANNING],
      supportedModels: ['deepseek-r1', 'deepseek-coder', 'qwen2.5', 'tu-trans-72b'],
      executionMode: 'local_docker',
      resources: {
        hasGpu: true,
        maxMemoryMb: 32768, // 32GB
        networkIsolated: false,
        isLocal: true
      },
      status: 'online'
    });

    // 2. Cloud Video Generator (Remote API)
    this.addWorker({
      id: 'cloud-video-01',
      name: 'Cloud SVD Cluster',
      capabilities: [NodeCapability.VIDEO_GEN],
      supportedModels: ['stable-video-diffusion', 'opensora', 'video-to-video-refiner'],
      executionMode: 'remote_api',
      resources: {
        hasGpu: true,
        maxMemoryMb: 65536, // 64GB
        networkIsolated: false,
        isLocal: false
      },
      status: 'online'
    });

    // 2b. Local Video Generator (Docker)
    this.addWorker({
      id: 'local-video-01',
      name: 'Local SVD Runner',
      capabilities: [NodeCapability.VIDEO_GEN],
      supportedModels: ['stable-video-diffusion', 'opensora'],
      executionMode: 'local_docker',
      resources: {
        hasGpu: true,
        maxMemoryMb: 24576, // 24GB
        networkIsolated: false,
        isLocal: true
      },
      status: 'online'
    });

    // 3. Secure Vision Analyst (Local, No Network)
    this.addWorker({
      id: 'secure-vision-01',
      name: 'Secure LLaVA Guard',
      capabilities: [NodeCapability.VISION_ANALYSIS, NodeCapability.VERIFICATION],
      supportedModels: ['llava-next', 'guardrails-v2'],
      executionMode: 'local_docker',
      resources: {
        hasGpu: true,
        maxMemoryMb: 16384,
        networkIsolated: true, // Secure enclave
        isLocal: true
      },
      status: 'online'
    });

    // 4. Orchestrator (Process Isolation)
    this.addWorker({
      id: 'orch-01',
      name: 'Main Loop Orchestrator',
      capabilities: [NodeCapability.ORCHESTRATION],
      supportedModels: ['ffmpeg-orchestrator', 'control-flow-v1'],
      executionMode: 'process_isolation',
      resources: {
        hasGpu: false,
        maxMemoryMb: 4096,
        networkIsolated: false,
        isLocal: true
      },
      status: 'online'
    });
    
    // 5. GPT-4o Wrapper (Remote API)
    this.addWorker({
      id: 'cloud-llm-01',
      name: 'OpenAI Wrapper',
      capabilities: [NodeCapability.REASONING, NodeCapability.PLANNING, NodeCapability.CODE_GEN],
      supportedModels: ['gpt-4o', 'gpt-4-turbo'],
      executionMode: 'remote_api',
      resources: {
        hasGpu: false, // API doesn't expose GPU
        maxMemoryMb: 8192,
        networkIsolated: false,
        isLocal: false
      },
      status: 'online'
    });
  }

  private addWorker(profile: WorkerProfile) {
    this.workers.set(profile.id, profile);
  }
}
