export interface AIService {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'image' | 'audio' | 'multimodal';
  status: 'online' | 'offline' | 'loading';
  capabilities: AICapability[];
  endpoint: string;
  model: string;
  provider: string;
  version: string;
  pricing: AIPricing;
  limits: AILimits;
  metrics: AIMetrics;
  config: AIConfig;
}

export type AICapability = 
  | 'text_generation'
  | 'image_generation'
  | 'speech_to_text'
  | 'text_to_speech'
  | 'translation'
  | 'summarization'
  | 'classification'
  | 'extraction'
  | 'code_generation'
  | 'data_analysis';

export interface AIPricing {
  currency: string;
  unit: 'tokens' | 'requests' | 'seconds' | 'images';
  price: number;
  freeQuota: number;
}

export interface AILimits {
  maxTokens: number;
  maxRequestsPerMinute: number;
  maxFileSize: number;
  maxConcurrentRequests: number;
  timeout: number;
}

export interface AIMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  totalCost: number;
  uptime: number;
}

export interface AIConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  stopSequences: string[];
  systemPrompt?: string;
}

export interface AIRequest {
  message: string;
  serviceId: string;
  type?: 'text' | 'image' | 'audio';
  context?: string;
  parameters?: Record<string, any>;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
    cost: number;
  };
  stream?: AsyncGenerator<string>;
  attachments?: AIAttachment[];
}

export interface AIAttachment {
  id: string;
  type: 'image' | 'audio' | 'file' | 'video';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface AIConversation {
  id: string;
  serviceId: string;
  title: string;
  messages: AIMessage[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
  };
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: AIAttachment[];
  timestamp: string;
  metadata?: {
    tokens?: number;
    responseTime?: number;
    cost?: number;
  };
}

export interface AIJob {
  id: string;
  type: 'text_generation' | 'image_generation' | 'audio_processing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  request: AIRequest;
  response?: AIResponse;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  type: 'base' | 'fine_tuned' | 'custom';
  size: string;
  parameters: number;
  capabilities: AICapability[];
  languages: string[];
  performance: {
    accuracy: number;
    speed: number;
    efficiency: number;
  };
  pricing: AIPricing;
  releaseDate: string;
  version: string;
}

export interface AIUsage {
  date: string;
  serviceId: string;
  requests: number;
  tokens: number;
  cost: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  variables: AIVariable[];
  serviceId: string;
  isPublic: boolean;
  usage: number;
  rating: number;
}

export interface AIVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}