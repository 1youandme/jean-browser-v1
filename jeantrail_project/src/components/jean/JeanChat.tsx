import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip, Mic, MicOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { jeanCoreService } from '../../services/jean/jeanCore';
import { JeanMessage, JeanAction } from '../../types/jean';

interface JeanChatProps {
  userId: string;
  sessionId?: string;
  onActionConfirm?: (action: JeanAction) => void;
  onActionReject?: (action: JeanAction) => void;
}

export const JeanChat: React.FC<JeanChatProps> = ({
  userId,
  sessionId,
  onActionConfirm,
  onActionReject
}) => {
  const [messages, setMessages] = useState<JeanMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingActions, setPendingActions] = useState<JeanAction[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadConversationHistory();
    scrollToBottom();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const history = await jeanCoreService.getConversationHistory(userId, sessionId);
      setMessages(history);
      generateSuggestions(history);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const generateSuggestions = (history: JeanMessage[]) => {
    const commonSuggestions = [
      "Open a new tab in the web browser",
      "Show me my recent files",
      "Check system status",
      "Help me organize my workspace",
      "Search for products on Alibaba",
      "Analyze this page for me"
    ];

    // Context-aware suggestions based on last messages
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage.content.toLowerCase().includes('product')) {
        suggestions.push("Find similar products", "Analyze pricing trends");
      }
      if (lastMessage.content.toLowerCase().includes('file')) {
        suggestions.push("Organize my downloads", "Find duplicate files");
      }
    }

    setSuggestions(commonSuggestions.slice(0, 4));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() && attachments.length === 0) return;

    const userMessage: JeanMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      attachments: attachments.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const response = await jeanCoreService.processMessage({
        userId,
        sessionId,
        message,
        attachments: attachments.map(file => ({
          type: 'file',
          content: file.name,
          metadata: {
            fileType: file.type,
            size: file.size
          }
        }))
      });

      const jeanMessage: JeanMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        actions: response.actions,
        requiresConfirmation: response.requiresConfirmation
      };

      setMessages(prev => [...prev, jeanMessage]);
      
      if (response.actions && response.actions.length > 0) {
        setPendingActions(response.actions.filter(action => action.requiresConfirmation));
      }

      generateSuggestions([...messages, userMessage, jeanMessage]);
    } catch (error) {
      const errorMessage: JeanMessage = {
        id: crypto.randomUUID(),
        type: 'system',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionConfirmation = async (action: JeanAction, confirmed: boolean) => {
    setPendingActions(prev => prev.filter(a => a.id !== action.id));
    
    if (confirmed) {
      try {
        await onActionConfirm?.(action);
        
        // Add confirmation message
        const confirmationMessage: JeanMessage = {
          id: crypto.randomUUID(),
          type: 'system',
          content: `✅ Action completed: ${action.description}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, confirmationMessage]);
      } catch (error) {
        const errorMessage: JeanMessage = {
          id: crypto.randomUUID(),
          type: 'system',
          content: `❌ Failed to execute action: ${action.description}`,
          timestamp: new Date().toISOString(),
          isError: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      await onActionReject?.(action);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
      // Implement speech-to-text here
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const formatMessageContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Jean Assistant</h3>
            <p className="text-sm text-gray-500">AI-powered browser assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hello! I'm Jean</h3>
            <p className="text-gray-500 mb-4">
              Your AI assistant for browser management, file operations, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'justify-end' : ''
            }`}
          >
            {message.type !== 'user' && (
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'assistant' ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                {message.type === 'assistant' ? (
                  <Bot className="h-5 w-5 text-white" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-white" />
                )}
              </div>
            )}
            
            <div className={`max-w-lg ${
              message.type === 'user' ? 'order-1' : ''
            }`}>
              <div className={`rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.isError
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                />
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-xs opacity-75"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span>{attachment.name}</span>
                        <span>({Math.round(attachment.size / 1024)}KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {message.type === 'user' && (
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                )}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Pending Actions */}
        {pendingActions.map((action) => (
          <div key={action.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Action Requires Confirmation</h4>
                <p className="text-yellow-700 text-sm mt-1">{action.description}</p>
                <p className="text-yellow-600 text-xs mt-2">Impact: {action.estimatedImpact}</p>
                
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleActionConfirmation(action, true)}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleActionConfirmation(action, false)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Jean is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 text-sm"
              >
                <Paperclip className="h-3 w-3 text-gray-600" />
                <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileAttachment}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputMessage);
                }
              }}
              placeholder="Ask Jean anything..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={toggleRecording}
            className={`p-2 transition-colors ${
              isRecording
                ? 'text-red-600 hover:text-red-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() && attachments.length === 0}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => setInputMessage("Check system status")}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            📊 System Status
          </button>
          <button
            onClick={() => setInputMessage("Open browser tab")}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            🌐 New Tab
          </button>
          <button
            onClick={() => setInputMessage("Show recent files")}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            📁 Recent Files
          </button>
          <button
            onClick={() => setInputMessage("Help me organize workspace")}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            🎯 Organize
          </button>
        </div>
      </div>
    </div>
  );
};