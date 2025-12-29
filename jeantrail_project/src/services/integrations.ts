// Unified Integration Layer - n8n, Colab, Gradio
export interface Integration {
  id: string;
  name: string;
  integrationType: string;
  config: IntegrationConfig;
  isActive: boolean;
  lastTestedAt?: Date;
  testStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  eventType: string;
  payload: Record<string, any>;
  responseData: Record<string, any>;
  status: string;
  errorMessage?: string;
  durationMs?: number;
  createdAt: Date;
}

export interface ColabJobRequest {
  notebookUrl: string;
  parameters: Record<string, any>;
  timeoutMinutes?: number;
}

export interface GradioJobRequest {
  appUrl: string;
  fnIndex: number;
  data: Record<string, any>[];
  timeoutMinutes?: number;
}

export interface JobStatus {
  jobId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TriggerWebhookRequest {
  integrationId: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface CreateIntegrationRequest {
  name: string;
  integrationType: string;
  config: IntegrationConfig;
}

export interface UpdateIntegrationRequest {
  name?: string;
  config?: IntegrationConfig;
  isActive?: boolean;
}

export interface GetIntegrationLogsQuery {
  integrationId?: string;
  eventType?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListIntegrationsQuery {
  integrationType?: string;
  isActive?: boolean;
}

export interface IntegrationConfig {
  type: 'n8n' | 'colab' | 'gradio' | 'webhook' | 'api';
  config: Record<string, any>;
}

export interface IntegrationService {
  // Integration management
  getIntegrations: (query?: ListIntegrationsQuery) => Promise<Integration[]>;
  getIntegration: (id: string) => Promise<Integration>;
  createIntegration: (request: CreateIntegrationRequest) => Promise<Integration>;
  updateIntegration: (id: string, request: UpdateIntegrationRequest) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  testIntegration: (id: string) => Promise<{ success: boolean; responseTimeMs?: number; message?: string }>;
  
  // Webhook triggering
  triggerWebhook: (request: TriggerWebhookRequest) => Promise<{
    success: boolean;
    durationMs: number;
    logId: string;
  }>;
  
  // Job submission
  submitColabJob: (request: ColabJobRequest) => Promise<JobStatus>;
  submitGradioJob: (request: GradioJobRequest) => Promise<JobStatus>;
  getJobStatus: (jobId: string) => Promise<JobStatus>;
  cancelJob: (jobId: string) => Promise<{ success: boolean; cancelledAt: string }>;
  
  // Logging
  getIntegrationLogs: (query?: GetIntegrationLogsQuery) => Promise<IntegrationLog[]>;
}

class IntegrationServiceImpl implements IntegrationService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getIntegrations(query?: ListIntegrationsQuery): Promise<Integration[]> {
    const params = new URLSearchParams();
    if (query?.integrationType) params.append('integration_type', query.integrationType);
    if (query?.isActive !== undefined) params.append('is_active', query.isActive.toString());

    const response = await fetch(`${this.baseUrl}/api/integrations?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch integrations: ${response.statusText}`);
    return response.json();
  }

  async getIntegration(id: string): Promise<Integration> {
    const response = await fetch(`${this.baseUrl}/api/integrations/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch integration: ${response.statusText}`);
    return response.json();
  }

  async createIntegration(request: CreateIntegrationRequest): Promise<Integration> {
    const response = await fetch(`${this.baseUrl}/api/integrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create integration: ${response.statusText}`);
    return response.json();
  }

  async updateIntegration(id: string, request: UpdateIntegrationRequest): Promise<Integration> {
    const response = await fetch(`${this.baseUrl}/api/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update integration: ${response.statusText}`);
    return response.json();
  }

  async deleteIntegration(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/integrations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete integration: ${response.statusText}`);
  }

  async testIntegration(id: string): Promise<{ success: boolean; responseTimeMs?: number; message?: string }> {
    const response = await fetch(`${this.baseUrl}/api/integrations/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to test integration: ${response.statusText}`);
    return response.json();
  }

  async triggerWebhook(request: TriggerWebhookRequest): Promise<{
    success: boolean;
    durationMs: number;
    logId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/integrations/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to trigger webhook: ${response.statusText}`);
    return response.json();
  }

  async submitColabJob(request: ColabJobRequest): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/api/integrations/colab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to submit Colab job: ${response.statusText}`);
    return response.json();
  }

  async submitGradioJob(request: GradioJobRequest): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/api/integrations/gradio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to submit Gradio job: ${response.statusText}`);
    return response.json();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/api/integrations/jobs/${jobId}`);
    if (!response.ok) throw new Error(`Failed to get job status: ${response.statusText}`);
    return response.json();
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; cancelledAt: string }> {
    const response = await fetch(`${this.baseUrl}/api/integrations/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to cancel job: ${response.statusText}`);
    return response.json();
  }

  async getIntegrationLogs(query?: GetIntegrationLogsQuery): Promise<IntegrationLog[]> {
    const params = new URLSearchParams();
    if (query?.integrationId) params.append('integration_id', query.integrationId);
    if (query?.eventType) params.append('event_type', query.eventType);
    if (query?.status) params.append('status', query.status);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/integrations/logs?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch integration logs: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const integrationService = new IntegrationServiceImpl();

// React hook
export const useIntegrationService = (): IntegrationService => {
  return integrationService;
};

// Integration factory functions
export function createN8NIntegration(config: {
  webhookUrl: string;
  apiKey?: string;
  workflowId?: string;
}): CreateIntegrationRequest {
  return {
    name: 'n8n Workflow Automation',
    integrationType: 'n8n',
    config: {
      type: 'n8n',
      config,
    },
  };
}

export function createColabIntegration(config: {
  notebookUrl: string;
  apiKey?: string;
  runtimeType?: string;
}): CreateIntegrationRequest {
  return {
    name: 'Google Colab Integration',
    integrationType: 'colab',
    config: {
      type: 'colab',
      config: {
        notebookUrl: config.notebookUrl,
        apiKey: config.apiKey,
        runtimeType: config.runtimeType || 'gpu',
      },
    },
  };
}

export function createGradioIntegration(config: {
  appUrl: string;
  apiKey?: string;
  fnIndex: number;
}): CreateIntegrationRequest {
  return {
    name: 'Gradio App Integration',
    integrationType: 'gradio',
    config: {
      type: 'gradio',
      config: {
        appUrl: config.appUrl,
        apiKey: config.apiKey,
        fnIndex: config.fnIndex,
      },
    },
  };
}

export function createWebhookIntegration(config: {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}): CreateIntegrationRequest {
  return {
    name: 'Custom Webhook',
    integrationType: 'webhook',
    config: {
      type: 'webhook',
      config,
    },
  };
}

// Integration helpers
export function validateIntegrationConfig(type: string, config: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (type) {
    case 'n8n':
      if (!config.webhookUrl) {
        errors.push('Webhook URL is required for n8n integration');
      }
      break;

    case 'colab':
      if (!config.notebookUrl) {
        errors.push('Notebook URL is required for Colab integration');
      }
      break;

    case 'gradio':
      if (!config.appUrl) {
        errors.push('App URL is required for Gradio integration');
      }
      if (typeof config.fnIndex !== 'number') {
        errors.push('Function index is required for Gradio integration');
      }
      break;

    case 'webhook':
      if (!config.url) {
        errors.push('URL is required for webhook integration');
      }
      break;

    default:
      errors.push(`Unknown integration type: ${type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getIntegrationTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    n8n: '🔄',
    colab: '🔬',
    gradio: '🤖',
    webhook: '🔗',
    api: '🌐',
  };

  return icons[type] || '🔌';
}

export function getIntegrationTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    n8n: 'Automate workflows with n8n',
    colab: 'Run Google Colab notebooks',
    gradio: 'Interact with Gradio applications',
    webhook: 'Send data to external webhooks',
    api: 'Connect to external APIs',
  };

  return descriptions[type] || 'Unknown integration type';
}

// Job polling helper
export function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs: number = 5000,
  maxAttempts: number = 60
): Promise<JobStatus> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await integrationService.getJobStatus(jobId);
        onUpdate(status);

        if (status.status === 'completed' || status.status === 'failed') {
          resolve(status);
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Maximum polling attempts reached'));
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

// Integration event helpers
export function createIntegrationEvent(
  integrationId: string,
  eventType: string,
  payload: Record<string, any>
): TriggerWebhookRequest {
  return {
    integrationId,
    eventType,
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
      source: 'jeantrail',
    },
  };
}

export function createVideoGenerationEvent(
  projectId: string,
  storyboard: Record<string, any>,
  config: Record<string, any>
): TriggerWebhookRequest {
  return createIntegrationEvent(
    'colab-video-generation', // This would be the integration ID
    'video_generation_started',
    {
      projectId,
      storyboard,
      config,
    }
  );
}

export function createContentCreationEvent(
  contentType: string,
  contentId: string,
  metadata: Record<string, any>
): TriggerWebhookRequest {
  return createIntegrationEvent(
    'content-workflow', // This would be the integration ID
    'content_created',
    {
      contentType,
      contentId,
      metadata,
    }
  );
}