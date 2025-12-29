import { useState, useCallback, useEffect } from 'react';
import { useAIServicesStore } from '@/store';
import { AIRequest, AIResponse, AIService } from '@/types';

export const useAI = () => {
  const {
    services,
    activeService,
    isProcessing,
    lastResponse,
    loadServices,
    setActiveService: storeSetActiveService,
    processRequest: storeProcessRequest,
  } = useAIServicesStore();

  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    service?: string;
  }>>([]);

  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const setActiveService = useCallback((service: AIService | null) => {
    storeSetActiveService(service);
    setConversationHistory([]);
  }, [storeSetActiveService]);

  const sendMessage = useCallback(async (message: string, options?: {
    context?: string;
    temperature?: number;
    maxTokens?: number;
  }) => {
    if (!activeService || !message.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
      service: activeService.id,
    };

    setConversationHistory(prev => [...prev, userMessage]);

    try {
      setIsStreaming(true);
      setStreamingResponse('');

      const request: AIRequest = {
        message,
        serviceId: activeService.id,
        context: options?.context,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000,
        stream: true,
      };

      const response = await storeProcessRequest(request);

      // Handle streaming response
      if (response.stream) {
        for await (const chunk of response.stream) {
          setStreamingResponse(prev => prev + chunk);
        }
      }

      const assistantMessage = {
        role: 'assistant' as const,
        content: response.content || streamingResponse,
        timestamp: new Date(),
        service: activeService.id,
      };

      setConversationHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      
      const errorMessage = {
        role: 'assistant' as const,
        content: options?.context?.includes('ar') 
          ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' 
          : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
        service: activeService.id,
      };

      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingResponse('');
    }
  }, [activeService, storeProcessRequest, streamingResponse]);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
  }, []);

  const exportConversation = useCallback(() => {
    const data = {
      service: activeService?.name || 'Unknown',
      messages: conversationHistory,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeService, conversationHistory]);

  const generateImage = useCallback(async (prompt: string, options?: {
    width?: number;
    height?: number;
    style?: string;
  }) => {
    if (!activeService || !activeService.capabilities?.includes('image_generation')) {
      throw new Error('Current service does not support image generation');
    }

    const request: AIRequest = {
      message: prompt,
      serviceId: activeService.id,
      type: 'image_generation',
      parameters: {
        width: options?.width || 512,
        height: options?.height || 512,
        style: options?.style || 'realistic',
      },
    };

    return await storeProcessRequest(request);
  }, [activeService, storeProcessRequest]);

  const transcribeAudio = useCallback(async (audioFile: File) => {
    if (!activeService || !activeService.capabilities?.includes('speech_to_text')) {
      throw new Error('Current service does not support speech to text');
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('serviceId', activeService.id);

    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    return await response.json();
  }, [activeService]);

  const generateSpeech = useCallback(async (text: string, options?: {
    voice?: string;
    speed?: number;
    language?: string;
  }) => {
    if (!activeService || !activeService.capabilities?.includes('text_to_speech')) {
      throw new Error('Current service does not support text to speech');
    }

    const request: AIRequest = {
      message: text,
      serviceId: activeService.id,
      type: 'text_to_speech',
      parameters: {
        voice: options?.voice || 'default',
        speed: options?.speed || 1.0,
        language: options?.language || 'en',
      },
    };

    return await storeProcessRequest(request);
  }, [activeService, storeProcessRequest]);

  // Auto-cleanup old messages
  useEffect(() => {
    if (conversationHistory.length > 100) {
      setConversationHistory(prev => prev.slice(-50)); // Keep last 50 messages
    }
  }, [conversationHistory]);

  return {
    // State
    services,
    activeService,
    isProcessing,
    lastResponse,
    conversationHistory,
    streamingResponse,
    isStreaming,

    // Actions
    setActiveService,
    sendMessage,
    clearConversation,
    exportConversation,
    generateImage,
    transcribeAudio,
    generateSpeech,
  };
};