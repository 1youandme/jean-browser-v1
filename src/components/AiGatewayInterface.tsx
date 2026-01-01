import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Send, 
  Image, 
  Mic, 
  Volume2, 
  Settings, 
  Activity, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Zap
} from 'lucide-react';

interface Job {
  id: string;
  user_id: string;
  model_name: string;
  model_version: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_cost_cents: number;
  actual_cost_cents?: number;
  result?: any;
  error?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface Model {
  id: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'audio';
  cost_per_unit: number;
  health_status: 'healthy' | 'unhealthy' | 'degraded';
  endpoint: string;
}

interface Workflow {
  name: string;
  description: string;
  stages: Array<{
    stage: string;
    model: string;
    purpose: string;
  }>;
}

export const AiGatewayInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedModel, setSelectedModel] = useState('qwen-3-72b');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [prompt, setPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadModels();
    loadJobs();
    loadWorkflows();
    loadStats();
    
    // Set up polling for job updates
    const interval = setInterval(loadJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/ai/models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/ai/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/ai/workflows');
      const data = await response.json();
      setWorkflows(Object.entries(data).map(([name, stages]: [string, any]) => ({
        name,
        description: `${name} workflow`,
        stages
      })));
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ai/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleTextGeneration = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          version: 'latest',
          stream: streaming,
          user_id: 'current_user', // Should come from auth
          max_tokens: maxTokens,
          temperature,
          priority,
        }),
      });
      
      const data = await response.json();
      setCurrentJob({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      
      // Start polling for this specific job
      if (streaming) {
        pollJob(data.job_id);
      } else {
        loadJobs();
      }
      
      setPrompt('');
    } catch (error) {
      console.error('Failed to generate text:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          negative_prompt: negativePrompt,
          model: 'sdxl',
          user_id: 'current_user',
          width: 1024,
          height: 1024,
        }),
      });
      
      const data = await response.json();
      setCurrentJob({
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      
      loadJobs();
      setImagePrompt('');
      setNegativePrompt('');
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowExecution = async () => {
    if (!selectedWorkflow || !prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/pipeline/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_data: { prompt },
          user_id: 'current_user',
          workflow: selectedWorkflow,
          priority,
        }),
      });
      
      const data = await response.json();
      setCurrentJob({
        id: data.request_id,
        user_id: 'current_user',
        model_name: selectedWorkflow,
        model_version: 'latest',
        status: data.status,
        created_at: new Date().toISOString(),
        estimated_cost_cents: data.total_cost_cents || 0,
        result: data.results,
        priority,
      });
      
      setPrompt('');
      loadJobs();
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollJob = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/job/${jobId}`);
        const data = await response.json();
        
        setCurrentJob(data);
        if (data.status === 'completed' || data.status === 'failed') {
          loadJobs();
          setCurrentJob(null);
        } else {
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Failed to poll job:', error);
      }
    };
    
    poll();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Send className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Gateway Interface</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {models.filter(m => m.health_status === 'healthy').length}/{models.length} Models Online
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {jobs.filter(j => j.status === 'processing').length} Active Jobs
          </Badge>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCost(stats.total_cost_cents || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.success_rate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold">{Math.round((stats.avg_processing_time_ms || 0) / 1000)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.total_requests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter(m => m.type === 'text').map(model => (
                        <SelectItem key={model.id} value={model.name}>
                          <div className="flex items-center gap-2">
                            {getModelIcon(model.type)}
                            {model.name}
                            <Badge variant={model.health_status === 'healthy' ? 'default' : 'destructive'}>
                              {model.health_status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Textarea
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    min={1}
                    max={4096}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Temperature</label>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={streaming}
                    onChange={(e) => setStreaming(e.target.checked)}
                  />
                  <label htmlFor="streaming" className="text-sm font-medium">
                    Stream Response
                  </label>
                </div>
              </div>
              
              <Button 
                onClick={handleTextGeneration} 
                disabled={loading || !prompt.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Generate Text
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
              />
              
              <Textarea
                placeholder="Negative prompt (what you don't want in the image)..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
              />
              
              <Button 
                onClick={handleImageGeneration} 
                disabled={loading || !imagePrompt.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                Generate Image
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multimodal Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow</label>
                <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map(workflow => (
                      <SelectItem key={workflow.name} value={workflow.name}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="Input for the workflow..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
              
              <Button 
                onClick={handleWorkflowExecution} 
                disabled={loading || !selectedWorkflow || !prompt.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Execute Workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No jobs yet</p>
                ) : (
                  jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">{job.model_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Cost: {formatCost(job.estimated_cost_cents)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(currentJob.status)}
              Current Job: {currentJob.id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{currentJob.model_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="font-medium">{formatCost(currentJob.estimated_cost_cents)}</p>
                </div>
              </div>
              
              {currentJob.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}
              
              {currentJob.result && (
                <div>
                  <p className="text-sm font-medium mb-2">Result:</p>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(currentJob.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {currentJob.error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{currentJob.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AiGatewayInterface;