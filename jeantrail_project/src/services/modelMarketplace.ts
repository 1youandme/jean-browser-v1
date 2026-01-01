import type { Pipeline, ModelPipelineBinding, MarketplaceModelItem } from '../types';
import type { AIModel, ModelHubService } from './modelHub';
import { modelHubService } from './modelHub';

export interface ModelMarketplaceService {
  listModels: (ownerUserId: string) => Promise<MarketplaceModelItem[]>;
  getPipelines: (ownerUserId: string) => Pipeline[];
  createPipeline: (ownerUserId: string, name: string, description?: string) => Pipeline;
  bindModelToPipeline: (ownerUserId: string, modelId: string, pipelineId: string) => ModelPipelineBinding;
  setEnabled: (ownerUserId: string, modelId: string, enabled: boolean) => void;
  getBinding: (ownerUserId: string, modelId: string) => ModelPipelineBinding | undefined;
}

class ModelMarketplaceServiceImpl implements ModelMarketplaceService {
  private modelHub: ModelHubService;
  private pipelines: Map<string, Pipeline[]> = new Map();
  private bindings: Map<string, Map<string, ModelPipelineBinding>> = new Map();

  constructor(hub: ModelHubService) {
    this.modelHub = hub;
  }

  async listModels(ownerUserId: string): Promise<MarketplaceModelItem[]> {
    const models: AIModel[] = await this.modelHub.getModels();
    const userBindings = this.bindings.get(ownerUserId) ?? new Map();
    return models.map((m) => {
      const b = userBindings.get(m.id);
      return {
        modelId: m.id,
        displayName: m.displayName,
        modelType: m.modelType,
        backendType: m.backendType,
        enabled: !!b?.enabled,
        pipelineId: b?.pipelineId,
      };
    });
  }

  getPipelines(ownerUserId: string): Pipeline[] {
    return this.pipelines.get(ownerUserId) ?? [];
  }

  createPipeline(ownerUserId: string, name: string, description?: string): Pipeline {
    const now = new Date().toISOString();
    const pipeline: Pipeline = {
      id: `${ownerUserId}-${Date.now()}`,
      ownerUserId,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      steps: [],
    };
    const list = this.pipelines.get(ownerUserId) ?? [];
    this.pipelines.set(ownerUserId, [pipeline, ...list]);
    return pipeline;
  }

  bindModelToPipeline(ownerUserId: string, modelId: string, pipelineId: string): ModelPipelineBinding {
    const userPipelines = this.getPipelines(ownerUserId);
    const exists = userPipelines.find((p) => p.id === pipelineId && p.ownerUserId === ownerUserId);
    if (!exists) {
      throw new Error('Pipeline not owned by user');
    }
    const binding: ModelPipelineBinding = {
      modelId,
      pipelineId,
      ownerUserId,
      enabled: false,
    };
    const userBindings = this.bindings.get(ownerUserId) ?? new Map();
    userBindings.set(modelId, binding);
    this.bindings.set(ownerUserId, userBindings);
    return binding;
  }

  setEnabled(ownerUserId: string, modelId: string, enabled: boolean): void {
    const userBindings = this.bindings.get(ownerUserId) ?? new Map();
    const binding = userBindings.get(modelId);
    if (!binding || binding.ownerUserId !== ownerUserId) {
      throw new Error('Binding not found or not owned by user');
    }
    if (!binding.pipelineId) {
      throw new Error('Pipeline required to enable model');
    }
    binding.enabled = enabled;
    userBindings.set(modelId, binding);
    this.bindings.set(ownerUserId, userBindings);
  }

  getBinding(ownerUserId: string, modelId: string): ModelPipelineBinding | undefined {
    const userBindings = this.bindings.get(ownerUserId) ?? new Map();
    return userBindings.get(modelId);
  }
}

export const modelMarketplaceService: ModelMarketplaceService = new ModelMarketplaceServiceImpl(modelHubService);

