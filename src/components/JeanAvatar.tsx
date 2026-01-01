import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, MessageCircle, X, Maximize2, Eye, Send, Mic, MicOff, User } from 'lucide-react';
import { aiService } from '../services/ai.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface JeanAvatarProps {
  onClick?: () => void;
  className?: string;
  userId?: string;
}

const JeanAvatar: React.FC<JeanAvatarProps> = ({ 
  onClick, 
  className = '',
  userId = 'anonymous'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [aiModel, setAiModel] = useState<string>('Qwen-3');
  
  const avatarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check AI service connection on mount
  useEffect(() => {
    checkAIConnection();
    
    // Set up speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const checkAIConnection = async () => {
    try {
      setConnectionStatus('connecting');
      await aiService.getServiceHealth();
      setConnectionStatus('connected');
      
      // Get available models
      const models = await aiService.getAvailableModels();
      if (models.data && models.data.length > 0) {
        setAiModel(models.data[0].id);
      }
    } catch (error) {
      console.error('AI service connection failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Mouse tracking for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(
          e.clientY - avatarCenterY,
          e.clientX - avatarCenterX
        );
        
        const distance = Math.min(
          Math.sqrt(
            Math.pow(e.clientX - avatarCenterX, 2) + 
            Math.pow(e.clientY - avatarCenterY, 2)
          ) / 10,
          15
        );
        
        setEyePosition({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAvatarClick = () => {
    setIsExpanded(!isExpanded);
    onClick?.();
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
    setIsChatMode(false);
  };

  const startChat = () => {
    setIsChatMode(true);
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      addMessage('assistant', 'Hello! I\'m Jean, your AI assistant. How can I help you today?');
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);
    setIsTyping(true);

    try {
      const response = await aiService.chatCompletion(userId, {
        messages: [
          { role: 'system', content: 'You are Jean, a helpful AI assistant for JeanTrail OS. Be concise and friendly.' },
          ...messages.slice(-10).map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ]
      });

      const assistantMessage = response.choices[0].message.content;
      addMessage('assistant', assistantMessage, response.usage);

      // Optional: Speak the response
      // await speakResponse(assistantMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again later.');
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      const audioBuffer = await aiService.generateSpeech(userId, text);
      const audio = new Audio(URL.createObjectURL(new Blob([audioBuffer])));
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch (error) {
      console.error('Failed to speak response:', error);
      setIsSpeaking(false);
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Compact Avatar (60x60px) */}
      <div
        ref={avatarRef}
        onClick={handleAvatarClick}
        className={`relative w-[60px] h-[60px] bg-gradient-to-br from-blue-600 to-purple-700 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center ${className}`}
      >
        {/* Main Jean Icon */}
        <Bot className="w-8 h-8 text-white" />
        
        {/* Animated Eye Tracking */}
        <div 
          className="absolute w-2 h-2 bg-white rounded-full transition-all duration-100"
          style={{
            top: '20px',
            left: '20px',
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
          }}
        />
        <div 
          className="absolute w-2 h-2 bg-white rounded-full transition-all duration-100"
          style={{
            top: '20px',
            left: '38px',
            transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
          }}
        />
        
        {/* Status Indicator */}
        <div className={`absolute bottom-1 right-1 w-3 h-3 ${getConnectionColor()} rounded-full animate-pulse`}>
          <div className={`absolute inset-0 ${getConnectionColor()} rounded-full animate-ping`}></div>
        </div>

        {/* Hover Hint */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
          Jean Assistant
        </div>
      </div>

      {/* Expanded Popover */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Jean Assistant</h3>
                  <p className="text-white/80 text-sm">
                    {aiModel} • {connectionStatus === 'connected' ? 'Connected' : 'Reconnecting...'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseExpanded}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {!isChatMode ? (
                <div className="p-6 h-full overflow-y-auto">
                  {/* Avatar Display */}
                  <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center relative">
                      <Bot className="w-16 h-16 text-white" />
                      
                      {/* Animated Eyes */}
                      <div 
                        className="absolute w-4 h-4 bg-white rounded-full transition-all duration-100"
                        style={{
                          top: '50px',
                          left: '45px',
                          transform: `translate(${eyePosition.x * 1.5}px, ${eyePosition.y * 1.5}px)`
                        }}
                      />
                      <div 
                        className="absolute w-4 h-4 bg-white rounded-full transition-all duration-100"
                        style={{
                          top: '50px',
                          left: '75px',
                          transform: `translate(${eyePosition.x * 1.5}px, ${eyePosition.y * 1.5}px)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={startChat}
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Start Chat</div>
                        <div className="text-sm text-gray-600">Talk with Jean</div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={toggleListening}
                      className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isListening ? <MicOff className="w-5 h-5 text-red-600" /> : <Mic className="w-5 h-5 text-purple-600" />}
                      <div className="text-left">
                        <div className="font-medium">Voice Control</div>
                        <div className="text-sm text-gray-600">
                          {isListening ? 'Listening...' : 'Speech to text'}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">System Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connection:</span>
                        <span className={`font-medium capitalize ${connectionStatus === 'connected' ? 'text-green-600' : connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {connectionStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Model:</span>
                        <span className="text-gray-900">{aiModel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Voice:</span>
                        <span className="text-gray-900">Available</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Memory:</span>
                        <span className="text-gray-900">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Features */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>🚀 AI Features</strong><br />
                      • Advanced language understanding with Qwen-3<br />
                      • Voice interaction and speech synthesis<br />
                      • Context-aware conversations<br />
                      • Multi-language support
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-blue-500' 
                              : 'bg-gradient-to-br from-blue-600 to-purple-700'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {message.content}
                            {message.metadata && (
                              <div className={`text-xs mt-1 ${
                                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {message.metadata.total_tokens} tokens
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isTyping}
                      />
                      <button
                        onClick={toggleListening}
                        className={`p-2 rounded-lg transition-colors ${
                          isListening 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        disabled={isTyping}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JeanAvatar;