import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { CacheManager } from '../utils/cache';
import { RateLimiter } from '../utils/rate-limiter';

interface AIRequest {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface AIResponse {
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

interface AnalysisRequest {
  text: string;
  type: 'sentiment' | 'summary' | 'keywords' | 'general';
}

interface TranslateRequest {
  text: string;
  target_language: string;
}

export class AIService {
  private qwen3Url: string;
  private sdxlUrl: string;
  private cogvideoxUrl: string;
  private whisperUrl: string;
  private wav2lipUrl: string;
  private coquiTtsUrl: string;
  private redis: Redis;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;

  constructor() {
    this.qwen3Url = process.env.AI_SERVICE_URL || 'http://qwen3:5000';
    this.sdxlUrl = process.env.SDXL_SERVICE_URL || 'http://sdxl:5001';
    this.cogvideoxUrl = process.env.COGVIDEOX_SERVICE_URL || 'http://cogvideox:5002';
    this.whisperUrl = process.env.WHISPER_SERVICE_URL || 'http://whisper:5003';
    this.wav2lipUrl = process.env.WAV2LIP_SERVICE_URL || 'http://wav2lip:5004';
    this.coquiTtsUrl = process.env.COQUI_TTS_SERVICE_URL || 'http://coqui_tts:5005';
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.cache = new CacheManager(this.redis);
    this.rateLimiter = new RateLimiter(this.redis);

    // Test connections on startup
    this.testConnections();
  }

  private async testConnections() {
    try {
      // Test Qwen-3
      const qwenHealth = await axios.get(`${this.qwen3Url}/health`, { timeout: 5000 });
      logger.info('Qwen-3 service connected', { status: qwenHealth.data });

      // Test other services (optional, with timeout)
      Promise.allSettled([
        axios.get(`${this.sdxlUrl}/health`, { timeout: 3000 }),
        axios.get(`${this.cogvideoxUrl}/health`, { timeout: 3000 }),
        axios.get(`${this.whisperUrl}/health`, { timeout: 3000 }),
        axios.get(`${this.wav2lipUrl}/health`, { timeout: 3000 }),
        axios.get(`${this.coquiTtsUrl}/health`, { timeout: 3000 }),
      ]).then(results => {
        results.forEach((result, index) => {
          const services = ['SDXL', 'CogVideoX', 'Whisper', 'Wav2Lip', 'Coqui TTS'];
          if (result.status === 'fulfilled') {
            logger.info(`${services[index]} service connected`, { status: result.value.data });
          } else {
            logger.warn(`${services[index]} service unavailable`, { error: result.reason.message });
          }
        });
      });
    } catch (error) {
      logger.error('AI service connection test failed', { error });
    }
  }

  /**
   * Chat completion using Qwen-3
   */
  async chatCompletion(userId: string, request: AIRequest): Promise<AIResponse> {
    try {
      // Check rate limit
      await this.rateLimiter.checkLimit(userId, 'ai_chat', 100, 60000); // 100 requests per minute

      // Generate cache key
      const cacheKey = `ai:chat:${JSON.stringify(request)}`;
      
      // Try cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        logger.info('AI chat response from cache', { userId });
        return cached;
      }

      // Call Qwen-3 service
      const response = await axios.post<AIResponse>(
        `${this.qwen3Url}/api/v1/chat/completions`,
        request,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data;
      
      // Cache the result for 1 hour
      await this.cache.set(cacheKey, result, 3600);

      // Log usage
      logger.info('AI chat completion successful', {
        userId,
        model: result.model,
        usage: result.usage,
      });

      return result;

    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error('AI chat completion failed', {
          userId,
          error: error.response?.data || error.message,
          status: error.response?.status,
        });
        
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status >= 500) {
          throw new Error('AI service is temporarily unavailable. Please try again later.');
        }
      }
      
      logger.error('AI chat completion error', { userId, error });
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Analyze text using AI
   */
  async analyzeText(userId: string, request: AnalysisRequest): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_analyze', 50, 60000); // 50 requests per minute

      const cacheKey = `ai:analyze:${JSON.stringify(request)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axios.post(
        `${this.qwen3Url}/api/v1/analyze`,
        request,
        { timeout: 15000 }
      );

      const result = response.data;
      await this.cache.set(cacheKey, result, 1800); // 30 minutes

      logger.info('Text analysis completed', { userId, type: request.type });
      return result;

    } catch (error) {
      logger.error('Text analysis failed', { userId, error });
      throw new Error('Failed to analyze text');
    }
  }

  /**
   * Translate text using AI
   */
  async translateText(userId: string, request: TranslateRequest): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_translate', 30, 60000); // 30 requests per minute

      const cacheKey = `ai:translate:${JSON.stringify(request)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await axios.post(
        `${this.qwen3Url}/api/v1/translate`,
        request,
        { timeout: 20000 }
      );

      const result = response.data;
      await this.cache.set(cacheKey, result, 3600); // 1 hour

      logger.info('Text translation completed', { userId, target: request.target_language });
      return result;

    } catch (error) {
      logger.error('Text translation failed', { userId, error });
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Generate image using SDXL
   */
  async generateImage(userId: string, prompt: string, options: any = {}): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_image', 10, 60000); // 10 requests per minute

      const request = {
        prompt,
        ...options,
        negative_prompt: options.negative_prompt || '',
        num_images: options.num_images || 1,
        width: options.width || 1024,
        height: options.height || 1024,
        steps: options.steps || 20,
        guidance_scale: options.guidance_scale || 7.5,
      };

      const response = await axios.post(
        `${this.sdxlUrl}/api/v1/generate`,
        request,
        { 
          timeout: 60000, // 60 seconds for image generation
          responseType: 'arraybuffer',
        }
      );

      // For image generation, we might get binary data or base64
      // Handle accordingly
      const result = {
        images: response.data.images || [],
        metadata: response.data.metadata || {},
      };

      logger.info('Image generation completed', { userId, prompt });
      return result;

    } catch (error) {
      logger.error('Image generation failed', { userId, error });
      throw new Error('Failed to generate image');
    }
  }

  /**
   * Generate video using CogVideoX
   */
  async generateVideo(userId: string, prompt: string, options: any = {}): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_video', 5, 60000); // 5 requests per minute

      const request = {
        prompt,
        ...options,
        duration: options.duration || 10,
        fps: options.fps || 8,
        resolution: options.resolution || '512x512',
      };

      const response = await axios.post(
        `${this.cogvideoxUrl}/api/v1/generate`,
        request,
        { 
          timeout: 300000, // 5 minutes for video generation
        }
      );

      const result = response.data;
      
      logger.info('Video generation completed', { userId, duration: request.duration });
      return result;

    } catch (error) {
      logger.error('Video generation failed', { userId, error });
      throw new Error('Failed to generate video');
    }
  }

  /**
   * Transcribe audio using Whisper
   */
  async transcribeAudio(userId: string, audioBuffer: Buffer, language?: string): Promise<any> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_transcribe', 20, 60000); // 20 requests per minute

      const formData = new FormData();
      formData.append('audio', audioBuffer, 'audio.wav');
      if (language) {
        formData.append('language', language);
      }

      const response = await axios.post(
        `${this.whisperUrl}/api/v1/transcribe`,
        formData,
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const result = response.data;
      
      logger.info('Audio transcription completed', { userId, language });
      return result;

    } catch (error) {
      logger.error('Audio transcription failed', { userId, error });
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Generate speech using Coqui TTS
   */
  async generateSpeech(userId: string, text: string, voice?: string): Promise<Buffer> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_tts', 30, 60000); // 30 requests per minute

      const request = {
        text,
        voice: voice || 'en',
        speed: 1.0,
        pitch: 1.0,
      };

      const response = await axios.post(
        `${this.coquiTtsUrl}/api/v1/synthesize`,
        request,
        {
          timeout: 30000,
          responseType: 'arraybuffer',
        }
      );

      logger.info('Speech generation completed', { userId, text: text.substring(0, 50) });
      return response.data;

    } catch (error) {
      logger.error('Speech generation failed', { userId, error });
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Generate lip sync using Wav2Lip
   */
  async generateLipSync(userId: string, videoBuffer: Buffer, audioBuffer: Buffer): Promise<Buffer> {
    try {
      await this.rateLimiter.checkLimit(userId, 'ai_lipsync', 3, 60000); // 3 requests per minute

      const formData = new FormData();
      formData.append('video', videoBuffer, 'video.mp4');
      formData.append('audio', audioBuffer, 'audio.wav');

      const response = await axios.post(
        `${this.wav2lipUrl}/api/v1/lipsync`,
        formData,
        {
          timeout: 120000, // 2 minutes for lip sync
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      logger.info('Lip sync generation completed', { userId });
      return response.data;

    } catch (error) {
      logger.error('Lip sync generation failed', { userId, error });
      throw new Error('Failed to generate lip sync');
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<any> {
    try {
      const services = [
        { name: 'Qwen-3', url: `${this.qwen3Url}/health` },
        { name: 'SDXL', url: `${this.sdxlUrl}/health` },
        { name: 'CogVideoX', url: `${this.cogvideoxUrl}/health` },
        { name: 'Whisper', url: `${this.whisperUrl}/health` },
        { name: 'Wav2Lip', url: `${this.wav2lipUrl}/health` },
        { name: 'Coqui TTS', url: `${this.coquiTtsUrl}/health` },
      ];

      const healthChecks = await Promise.allSettled(
        services.map(async (service) => {
          const response = await axios.get(service.url, { timeout: 5000 });
          return { name: service.name, status: 'healthy', data: response.data };
        })
      );

      const results = healthChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { name: services[index].name, status: 'unhealthy', error: result.reason.message };
        }
      });

      return { services: results, timestamp: new Date().toISOString() };

    } catch (error) {
      logger.error('Service health check failed', { error });
      throw new Error('Failed to check service health');
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any> {
    try {
      const response = await axios.get(`${this.qwen3Url}/api/v1/models`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get available models', { error });
      throw new Error('Failed to retrieve models');
    }
  }

  /**
   * Clear AI cache for user
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const pattern = `*:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('User AI cache cleared', { userId, keysCount: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear user cache', { userId, error });
    }
  }
}

export const aiService = new AIService();