import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface AIMessage {
  role: string;
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export interface AnalysisRequest {
  text: string;
  type: 'sentiment' | 'summary' | 'keywords' | 'general';
}

export interface TranslateRequest {
  text: string;
  target_language: string;
}

class AIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, data?: any, options?: any): Promise<T> {
    try {
      const config = {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = data
        ? await axios.post<T>(`${this.baseURL}${endpoint}`, data, config)
        : await axios.get<T>(`${this.baseURL}${endpoint}`, config);

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Chat completion using AI
   */
  async chatCompletion(userId: string, request: AIRequest): Promise<AIResponse> {
    return this.makeRequest<AIResponse>('/api/ai/chat', {
      userId,
      ...request
    });
  }

  /**
   * Analyze text using AI
   */
  async analyzeText(userId: string, request: AnalysisRequest): Promise<any> {
    return this.makeRequest<any>('/api/ai/analyze', {
      userId,
      ...request
    });
  }

  /**
   * Translate text using AI
   */
  async translateText(userId: string, request: TranslateRequest): Promise<any> {
    return this.makeRequest<any>('/api/ai/translate', {
      userId,
      ...request
    });
  }

  /**
   * Generate image using SDXL
   */
  async generateImage(userId: string, prompt: string, options: any = {}): Promise<any> {
    return this.makeRequest<any>('/api/ai/image', {
      userId,
      prompt,
      ...options
    });
  }

  /**
   * Generate video using CogVideoX
   */
  async generateVideo(userId: string, prompt: string, options: any = {}): Promise<any> {
    return this.makeRequest<any>('/api/ai/video', {
      userId,
      prompt,
      ...options
    });
  }

  /**
   * Transcribe audio using Whisper
   */
  async transcribeAudio(userId: string, audioFile: File, language?: string): Promise<any> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('userId', userId);
    if (language) {
      formData.append('language', language);
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/ai/transcribe`, formData, {
        timeout: 60000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Generate speech using TTS
   */
  async generateSpeech(userId: string, text: string, voice?: string): Promise<ArrayBuffer> {
    try {
      const response = await axios.post(`${this.baseURL}/api/ai/speech`, {
        userId,
        text,
        voice
      }, {
        timeout: 30000,
        responseType: 'arraybuffer',
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Generate lip sync using Wav2Lip
   */
  async generateLipSync(userId: string, videoFile: File, audioFile: File): Promise<ArrayBuffer> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('audio', audioFile);
    formData.append('userId', userId);

    try {
      const response = await axios.post(`${this.baseURL}/api/ai/lipsync`, formData, {
        timeout: 120000, // 2 minutes
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get AI service health status
   */
  async getServiceHealth(): Promise<any> {
    return this.makeRequest<any>('/api/ai/health', undefined, { method: 'GET' });
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<any> {
    return this.makeRequest<any>('/api/ai/models', undefined, { method: 'GET' });
  }

  /**
   * Clear user AI cache
   */
  async clearUserCache(userId: string): Promise<void> {
    return this.makeRequest<void>('/api/ai/clear-cache', { userId });
  }
}

export const aiService = new AIService();
export default aiService;