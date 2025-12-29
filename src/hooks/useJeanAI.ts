import { useState, useCallback, useEffect } from 'react';
import { JeanMessage, JeanAction, AIRequest, AIResponse, Tab } from '../types';

interface UseJeanAIProps {
  backendUrl?: string;
}

export const useJeanAI = ({ backendUrl = 'http://localhost:8080' }: UseJeanAIProps = {}) => {
  const [conversation, setConversation] = useState<JeanMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  const generateMessageId = () => Date.now().toString();

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add user message to conversation
    const userMessage: JeanMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Prepare AI request
      const aiRequest: AIRequest = {
        prompt: message,
        contextJson: JSON.stringify({
          activeTab,
          recentActions: [], // Would track recent user actions
          currentView: activeTab?.type || 'web',
        }),
      };

      // Call AI backend
      const response = await fetch(`${backendUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequest),
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      const aiResponse: AIResponse = await response.json();

      // Add AI response to conversation
      const assistantMessage: JeanMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        actions: aiResponse.actions,
      };

      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);

      // Add error message to conversation
      const errorMessage: JeanMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [backendUrl, activeTab]);

  const executeAction = useCallback(async (action: JeanAction): Promise<void> => {
    console.log('Executing Jean action:', action);

    switch (action.type) {
      case 'open_tab':
        // Would integrate with tab management
        console.log('Opening new tab:', action.payload);
        break;

      case 'close_tab':
        // Would integrate with tab management
        console.log('Closing tab:', action.payload);
        break;

      case 'navigate':
        // Would integrate with navigation
        console.log('Navigating to:', action.payload);
        break;

      case 'open_local_path':
        // Would integrate with file system
        console.log('Opening local path:', action.payload);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const setActiveTabContext = useCallback((tab: Tab | null) => {
    setActiveTab(tab);
  }, []);

  // Speech-to-text placeholder hook
  const useSpeechToText = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');

    const startListening = () => {
      setIsListening(true);
      // Would implement actual STT here
      console.log('Starting speech recognition...');
    };

    const stopListening = () => {
      setIsListening(false);
      // Would stop STT and get final transcript
      console.log('Stopping speech recognition...');
    };

    return {
      isListening,
      transcript,
      startListening,
      stopListening,
    };
  };

  // Text-to-speech placeholder hook
  const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = (text: string) => {
      setIsSpeaking(true);
      // Would implement actual TTS here
      console.log('Speaking:', text);
      setTimeout(() => setIsSpeaking(false), 1000);
    };

    const stopSpeaking = () => {
      setIsSpeaking(false);
      // Would stop TTS
      console.log('Stopping speech...');
    };

    return {
      isSpeaking,
      speak,
      stopSpeaking,
    };
  };

  return {
    conversation,
    isTyping,
    sendMessage,
    executeAction,
    clearConversation,
    setActiveTabContext,
    // Hook exports for component use
    useSpeechToText,
    useTextToSpeech,
  };
};