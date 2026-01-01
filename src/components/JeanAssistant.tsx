import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, X, Check, AlertCircle } from 'lucide-react';
import { JeanMessage, JeanAction, Tab } from '../types';

interface JeanAssistantProps {
  conversation: JeanMessage[];
  isTyping: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onAction: (action: JeanAction) => Promise<void>;
  onClose: () => void;
  activeTab?: Tab;
}

export const JeanAssistant: React.FC<JeanAssistantProps> = ({
  conversation,
  isTyping,
  onSendMessage,
  onAction,
  onClose,
  activeTab,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [pendingActions, setPendingActions] = useState<JeanAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    
    // Include context about current tab
    const contextMessage = message + (
      activeTab ? `\n\nContext: Currently viewing ${activeTab.title} (${activeTab.type}: ${activeTab.url || activeTab.path})` : ''
    );
    
    await onSendMessage(contextMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // STT implementation would go here
  };

  const handleActionApproval = async (action: JeanAction, approved: boolean) => {
    setPendingActions(pendingActions.filter(a => a !== action));
    
    if (approved) {
      try {
        await onAction(action);
      } catch (error) {
        console.error('Failed to execute action:', error);
      }
    }
  };

  const formatActionDescription = (action: JeanAction): string => {
    switch (action.type) {
      case 'open_tab':
        return `Open new ${action.targetBar} tab${action.payload.url ? ` to ${action.payload.url}` : ''}`;
      case 'close_tab':
        return 'Close current tab';
      case 'navigate':
        return `Navigate to ${action.payload.url || action.payload.path}`;
      case 'open_local_path':
        return `Open local path: ${action.payload.path}`;
      default:
        return `Execute action: ${action.type}`;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">J</span>
          </div>
          <span className="font-medium text-gray-900">Jean Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Actions from Jean */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.actions.map((action, index) => (
                    <div key={index} className="bg-white/20 rounded p-2 text-xs">
                      <div className="font-medium mb-1">Suggested Action:</div>
                      <div className="mb-2">{formatActionDescription(action)}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActionApproval(action, true)}
                          className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleActionApproval(action, false)}
                          className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Jean is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Actions Bar */}
      {pendingActions.length > 0 && (
        <div className="border-t border-gray-200 bg-yellow-50 p-2">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>{pendingActions.length} action{pendingActions.length !== 1 ? 's' : ''} pending approval</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Jean anything..."
              className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            
            {/* Voice Controls */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={toggleListening}
                className={`p-1 rounded transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                className="p-1 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                title="Text-to-speech"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};