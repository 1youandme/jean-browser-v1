import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { 
  Users, 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2, 
  FileText, 
  Settings, 
  Plus,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Cpu,
  HardDrive,
  Network,
  Calendar,
  BarChart3
} from 'lucide-react';

interface TraeAgent {
  id: string;
  name: string;
  role: string;
  email: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'error' | 'paused' | 'maintenance';
  priority: number;
  current_tasks: number;
  max_concurrent_tasks: number;
  docker_container?: string;
  last_run?: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  average_execution_time_ms: number;
  resource_limits: {
    cpu: number;
    memory: number;
    disk: number;
  };
  performance_metrics: {
    cpu_usage: number;
    memory_usage: number;
    network_io: number;
    disk_io: number;
  };
  tags: string[];
  auto_restart: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentTask {
  id: string;
  agent_id: string;
  task_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  execution_time_ms?: number;
  result?: any;
  error_message?: string;
}

export const AgentManagementPanel: React.FC = () => {
  const [agents, setAgents] = useState<TraeAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<TraeAgent | null>(null);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgentTasks = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setAgentTasks(data);
      }
    } catch (error) {
      console.error('Failed to load agent tasks:', error);
    }
  };

  const controlAgent = async (agentId: string, action: 'start' | 'pause' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/agents/${agentId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        loadAgents(); // Refresh agents list
      }
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error);
    }
  };

  const dispatchTask = async (agentId: string, taskType: string, parameters: any) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: taskType,
          parameters
        })
      });

      if (response.ok) {
        loadAgents();
        if (selectedAgent?.id === agentId) {
          loadAgentTasks(agentId);
        }
      }
    } catch (error) {
      console.error('Failed to dispatch task:', error);
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadAgents();
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'default' : 
                   status === 'idle' ? 'secondary' :
                   status === 'error' ? 'destructive' :
                   status === 'maintenance' ? 'destructive' : 'outline';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const getSuccessRate = (agent: TraeAgent) => {
    if (agent.total_runs === 0) return 0;
    return ((agent.successful_runs / agent.total_runs) * 100).toFixed(1);
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading TRAE agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TRAE Agents Management</h2>
          <p className="text-muted-foreground">
            Monitor and control your 16 AI agents
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search agents by name, role, or capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'idle', 'error', 'paused'].map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map(agent => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                </div>
                {getStatusBadge(agent.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Contact Info */}
                <div className="text-sm">
                  <p className="text-muted-foreground">Email:</p>
                  <p className="truncate">{agent.email}</p>
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.capabilities.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Task Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tasks:</p>
                    <p>{agent.current_tasks}/{agent.max_concurrent_tasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate:</p>
                    <p>{getSuccessRate(agent)}%</p>
                  </div>
                </div>

                {/* Resource Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      <span>CPU</span>
                    </div>
                    <span>{agent.performance_metrics.cpu_usage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      <span>Memory</span>
                    </div>
                    <span>{agent.performance_metrics.memory_usage}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {agent.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => controlAgent(agent.id, 'pause')}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => controlAgent(agent.id, 'start')}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => controlAgent(agent.id, 'restart')}
                  >
                    <Activity className="h-3 w-3" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          loadAgentTasks(agent.id);
                        }}
                      >
                        <FileText className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{agent.name} - Details</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Agent Info */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              {getStatusBadge(agent.status)}
                            </div>
                            <div className="flex justify-between">
                              <span>Email:</span>
                              <span>{agent.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Priority:</span>
                              <Badge variant="outline">{agent.priority}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Runs:</span>
                              <span>{agent.total_runs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span>{getSuccessRate(agent)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Execution:</span>
                              <span>{(agent.average_execution_time_ms / 1000).toFixed(2)}s</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Tasks */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Recent Tasks</h3>
                          <ScrollArea className="h-64">
                            <div className="space-y-2">
                              {agentTasks.map(task => (
                                <div key={task.id} className="p-2 border rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{task.task_type}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {task.status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(task.scheduled_at).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Agent Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agents.reduce((sum, a) => sum + a.total_runs, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {agents.reduce((sum, a) => sum + a.current_tasks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Current Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {agents.filter(a => a.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentManagementPanel;