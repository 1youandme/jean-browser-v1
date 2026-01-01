import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Mic, 
  Settings, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity
} from 'lucide-react';

interface JeanMessage {
  id: string;
  type: 'user' | 'jean' | 'system';
  content: string;
  timestamp: Date;
  actions?: JeanAction[];
  attachments?: JeanAttachment[];
  context?: any;
}

interface JeanAction {
  id: string;
  type: string;
  description: string;
  requiresConfirmation: boolean;
  status: 'pending' | 'approved' | 'executed' | 'failed';
  category: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface JeanAttachment {
  type: string;
  content: string;
  metadata?: any;
}

interface BackgroundTask {
  id: string;
  description: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
}

interface JeanChatPanelProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const JeanChatPanel: React.FC<JeanChatPanelProps> = ({
  isMinimized = false,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<JeanMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial messages and background tasks
  useEffect(() => {
    loadChatHistory();
    loadBackgroundTasks();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateBackgroundTasks();
      checkConnectionStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/jean/chat/history');
      if (response.ok) {
        const history = await response.json();
        setMessages(history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadBackgroundTasks = async () => {
    try {
      const response = await fetch('/api/jean/tasks/active');
      if (response.ok) {
        const tasks = await response.json();
        setBackgroundTasks(tasks.map((task: any) => ({
          ...task,
          startTime: new Date(task.startTime)
        })));
      }
    } catch (error) {
      console.error('Failed to load background tasks:', error);
    }
  };

  const updateBackgroundTasks = async () => {
    // Update task progress and status
    setBackgroundTasks(prev => prev.map(task => {
      if (task.status === 'running') {
        const progress = Math.min(task.progress + Math.random() * 10, 100);
        return {
          ...task,
          progress,
          status: progress >= 100 ? 'completed' : 'running'
        };
      }
      return task;
    }).filter(task => task.status !== 'completed' || 
      (new Date().getTime() - task.startTime.getTime()) < 30000)); // Keep completed tasks for 30 seconds
  };

  const checkConnectionStatus = () => {
    // Simulate connection status changes
    if (Math.random() > 0.95) {
      setConnectionStatus('connecting');
      setTimeout(() => setConnectionStatus('connected'), 1000);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: JeanMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/jean/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            timestamp: new Date().toISOString(),
            workspace: 'developer_console'
          }
        })
      });

      if (response.ok) {
        const jeanResponse = await response.json();
        const jeanMessage: JeanMessage = {
          id: (Date.now() + 1).toString(),
          type: 'jean',
          content: jeanResponse.message,
          timestamp: new Date(),
          actions: jeanResponse.actions || [],
          context: jeanResponse.context
        };

        setMessages(prev => [...prev, jeanMessage]);

        // Auto-approve safe actions
        if (jeanResponse.actions) {
          const safeActions = jeanResponse.actions.filter((action: JeanAction) => 
            !action.requiresConfirmation && action.impactLevel === 'low'
          );
          
          for (const action of safeActions) {
            await executeAction(action.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: JeanMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const executeAction = async (actionId: string) => {
    try {
      const response = await fetch('/api/jean/action/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action_id: actionId })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update message with action result
        setMessages(prev => prev.map(msg => ({
          ...msg,
          actions: msg.actions?.map(action => 
            action.id === actionId 
              ? { ...action, status: 'executed', ...result }
              : action
          )
        })));

        // Add system message about completed action
        const systemMessage: JeanMessage = {
          id: Date.now().toString(),
          type: 'system',
          content: `Action completed: ${result.description || 'Operation successful'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  const confirmAction = async (actionId: string, confirmed: boolean) => {
    if (!confirmed) {
      // Reject action
      setMessages(prev => prev.map(msg => ({
        ...msg,
        actions: msg.actions?.map(action => 
          action.id === actionId 
            ? { ...action, status: 'failed' as const }
            : action
        )
      })));
      return;
    }

    await executeAction(actionId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'executed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'connecting':
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'disconnected':
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getImpactBadge = (level: string) => {
    const variant = level === 'critical' ? 'destructive' : 
                   level === 'high' ? 'destructive' :
                   level === 'medium' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="text-xs">
        {level}
      </Badge>
    );
  };

  if (isMinimized) {
    return (
      <Card className="w-80 shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <img 
                  src="/images/jean-avatar.png" 
                  alt="Jean" 
                  className="h-8 w-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%234F46E5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute -bottom-1 -right-1">
                  {getStatusIcon(connectionStatus)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Jean Assistant</p>
                <p className="text-xs text-muted-foreground">
                  {backgroundTasks.filter(t => t.status === 'running').length} tasks running
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleMinimize}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-96 shadow-lg ${isExpanded ? 'h-[600px]' : 'h-[500px]'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src="/images/jean-avatar.png" 
                alt="Jean" 
                className="h-10 w-10 rounded-full border-2 border-primary"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234F46E5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-family='Arial' font-size='18' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                {getStatusIcon(connectionStatus)}
              </div>
            </div>
            <div>
              <CardTitle className="text-lg">Jean Assistant</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {connectionStatus}
                </Badge>
                {backgroundTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {backgroundTasks.filter(t => t.status === 'running').length} active
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onToggleMinimize && (
              <Button variant="ghost" size="sm" onClick={onToggleMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Background Tasks */}
      {backgroundTasks.length > 0 && (
        <div className="px-4 pb-2">
          <div className="space-y-2">
            {backgroundTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center space-x-2 text-xs">
                {getStatusIcon(task.status)}
                <span className="flex-1 truncate">{task.description}</span>
                <span className="text-muted-foreground">{Math.round(task.progress)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CardContent className="p-0 flex flex-col h-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.type === 'system'
                      ? 'bg-muted'
                      : 'bg-secondary'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.type !== 'user' && (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Actions */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.actions.map(action => (
                              <div key={action.id} className="bg-background/50 rounded p-2 border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium">{action.description}</span>
                                  {getImpactBadge(action.impactLevel)}
                                </div>
                                {action.status === 'pending' && action.requiresConfirmation && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => confirmAction(action.id, false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => confirmAction(action.id, true)}
                                    >
                                      Execute
                                    </Button>
                                  </div>
                                )}
                                {action.status === 'executed' && (
                                  <div className="flex items-center space-x-1 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Completed</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.type === 'user' && (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              ref={inputRef}
              placeholder="Type your message to Jean..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button variant="ghost" size="sm">
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JeanChatPanel;