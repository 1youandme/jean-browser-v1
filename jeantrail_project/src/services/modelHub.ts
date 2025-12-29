// Model Hub Service Interface and Implementation
export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  modelType: ModelType;
  backendType: BackendType;
  endpointUrl?: string;
  dockerImage?: string;
  modelConfig: Record<string, any>;
  parameters: Record<string, any>;
  capabilities: string[];
  status: ModelStatus;
  isDefault: boolean;
  priority: number;
  fileSize?: number;
  downloadProgress: number;
  version?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ModelType = 'llm' | 'image' | 'video' | 'audio' | 'multimodal';
export type BackendType = 'local' | 'remote' | 'colab' | 'gradio';
export type ModelStatus = 'online' | 'offline' | 'downloading' | 'error' | 'updating';

export interface CreateModelRequest {
  name: string;
  displayName: string;
  modelType: ModelType;
  backendType: BackendType;
  endpointUrl?: string;
  dockerImage?: string;
  apiKey?: string;
  modelConfig: Record<string, any>;
  parameters: Record<string, any>;
  capabilities: string[];
  version?: string;
}

export interface UpdateModelRequest {
  displayName?: string;
  endpointUrl?: string;
  apiKey?: string;
  modelConfig?: Record<string, any>;
  parameters?: Record<string, any>;
  capabilities?: string[];
  priority?: number;
}

export interface ListModelsQuery {
  modelType?: ModelType;
  backendType?: BackendType;
  status?: ModelStatus;
  isDefault?: boolean;
}

export interface ModelHubService {
  // Model management
  getModels: (query?: ListModelsQuery) => Promise<AIModel[]>;
  getModel: (id: string) => Promise<AIModel>;
  createModel: (request: CreateModelRequest) => Promise<AIModel>;
  updateModel: (id: string, request: UpdateModelRequest) => Promise<AIModel>;
  deleteModel: (id: string) => Promise<void>;
  setDefaultModel: (modelType: ModelType, id: string) => Promise<void>;
  
  // Model operations
  downloadModel: (id: string) => Promise<{ status: string; modelId: string }>;
  testModel: (id: string) => Promise<{ status: string; responseTimeMs: number }>;
  
  // Model selection
  getDefaultModel: (modelType: ModelType) => Promise<AIModel | null>;
  getAvailableModels: (modelType: ModelType) => Promise<AIModel[]>;
}

class ModelHubServiceImpl implements ModelHubService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getModels(query?: ListModelsQuery): Promise<AIModel[]> {
    const params = new URLSearchParams();
    if (query?.modelType) params.append('modelType', query.modelType);
    if (query?.backendType) params.append('backendType', query.backendType);
    if (query?.status) params.append('status', query.status);
    if (query?.isDefault !== undefined) params.append('isDefault', query.isDefault.toString());

    const response = await fetch(`${this.baseUrl}/api/models?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
    return response.json();
  }

  async getModel(id: string): Promise<AIModel> {
    const response = await fetch(`${this.baseUrl}/api/models/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);
    return response.json();
  }

  async createModel(request: CreateModelRequest): Promise<AIModel> {
    const response = await fetch(`${this.baseUrl}/api/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create model: ${response.statusText}`);
    return response.json();
  }

  async updateModel(id: string, request: UpdateModelRequest): Promise<AIModel> {
    const response = await fetch(`${this.baseUrl}/api/models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update model: ${response.statusText}`);
    return response.json();
  }

  async deleteModel(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/models/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete model: ${response.statusText}`);
  }

  async setDefaultModel(modelType: ModelType, id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/models/${modelType}/${id}/default`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error(`Failed to set default model: ${response.statusText}`);
  }

  async downloadModel(id: string): Promise<{ status: string; modelId: string }> {
    const response = await fetch(`${this.baseUrl}/api/models/${id}/download`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to start model download: ${response.statusText}`);
    return response.json();
  }

  async testModel(id: string): Promise<{ status: string; responseTimeMs: number }> {
    const response = await fetch(`${this.baseUrl}/api/models/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to test model: ${response.statusText}`);
    return response.json();
  }

  async getDefaultModel(modelType: ModelType): Promise<AIModel | null> {
    const models = await this.getModels({ modelType, isDefault: true });
    return models.length > 0 ? models[0] : null;
  }

  async getAvailableModels(modelType: ModelType): Promise<AIModel[]> {
    return this.getModels({ modelType, status: 'online' });
  }
}

// Singleton instance
export const modelHubService = new ModelHubServiceImpl();

// React hook
export const useModelHubService = (): ModelHubService => {
  return modelHubService;
};