import React, { useState, useEffect } from 'react';
import { JeanIcon } from './JeanIcon';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'loading';
  url: string;
  port: number;
  responseTime?: number;
  uptime?: string;
  lastCheck: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  gpu?: number;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  type: string;
  createdAt: string;
  completedAt?: string;
}

export const Dashboard: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Frontend',
      status: 'online',
      url: 'http://localhost:1420',
      port: 1420,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Qwen-3 AI',
      status: 'offline',
      url: 'http://localhost:8001',
      port: 8001,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'SDXL Image Gen',
      status: 'offline',
      url: 'http://localhost:8002',
      port: 8002,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Whisper STT',
      status: 'offline',
      url: 'http://localhost:8003',
      port: 8003,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Coqui TTS',
      status: 'offline',
      url: 'http://localhost:8004',
      port: 8004,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'PostgreSQL',
      status: 'offline',
      url: 'localhost:5432',
      port: 5432,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Redis',
      status: 'offline',
      url: 'localhost:6379',
      port: 6379,
      lastCheck: new Date().toISOString()
    }
  ]);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    gpu: 0
  });

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Initial System Check',
      status: 'completed',
      progress: 100,
      type: 'system',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'AI Model Loading',
      status: 'pending',
      progress: 0,
      type: 'ai',
      createdAt: new Date().toISOString()
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'services' | 'metrics' | 'tasks'>('overview');

  // Check service health
  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${service.url}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const endTime = Date.now();
      
      return {
        ...service,
        status: response.ok ? 'online' : 'offline',
        responseTime: endTime - startTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        ...service,
        status: 'offline',
        lastCheck: new Date().toISOString()
      };
    }
  };

  // Refresh all services
  const refreshServices = async () => {
    setIsLoading(true);
    const updatedServices = await Promise.all(
      services.map(service => checkServiceHealth(service))
    );
    setServices(updatedServices);
    setIsLoading(false);
  };

  // Simulate metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 100,
        memory: 60 + Math.random() * 30,
        disk: 30 + Math.random() * 40,
        network: Math.random() * 100,
        gpu: Math.random() * 100
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Initial service check
  useEffect(() => {
    refreshServices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'loading': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '●';
      case 'offline': return '●';
      case 'loading': return '⟳';
      default: return '●';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* System Status Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <JeanIcon size={24} isActive={true} />
          <span className="ml-2">System Status</span>
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Overall Health</span>
            <span className={`font-bold ${getStatusColor('online')}`}>
              {services.filter(s => s.status === 'online').length}/{services.length} Online
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Active Tasks</span>
            <span className="text-blue-400">{tasks.filter(t => t.status === 'running').length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Completed Today</span>
            <span className="text-green-400">{tasks.filter(t => t.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">CPU Usage</span>
              <span className="text-white text-sm">{metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.cpu}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">Memory Usage</span>
              <span className="text-white text-sm">{metrics.memory.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.memory}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400 text-sm">Disk Usage</span>
              <span className="text-white text-sm">{metrics.disk.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.disk}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getTaskStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                </span>
                <span className="text-gray-300 text-sm truncate max-w-[150px]">
                  {task.title}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(task.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Service Status</h3>
        <button
          onClick={refreshServices}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.name} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{service.name}</h4>
              <span className={`text-lg ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={getStatusColor(service.status)}>{service.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Port:</span>
                <span className="text-gray-300">{service.port}</span>
              </div>
              {service.responseTime && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Response:</span>
                  <span className="text-gray-300">{service.responseTime}ms</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Last Check:</span>
                <span className="text-gray-300">
                  {new Date(service.lastCheck).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Resources */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">System Resources</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-white font-bold">{metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.cpu}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Memory Usage</span>
              <span className="text-white font-bold">{metrics.memory.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.memory}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Disk Usage</span>
              <span className="text-white font-bold">{metrics.disk.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.disk}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Network Activity</span>
              <span className="text-white font-bold">{metrics.network.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.network}%` }}
              />
            </div>
          </div>
          
          {metrics.gpu !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">GPU Usage</span>
                <span className="text-white font-bold">{metrics.gpu.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-400 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.gpu}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Performance Trends</h3>
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 mb-2">Response Times</h4>
            <div className="text-2xl font-bold text-green-400">45ms</div>
            <div className="text-sm text-gray-400">Average (Last 24h)</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 mb-2">Request Count</h4>
            <div className="text-2xl font-bold text-blue-400">1,234</div>
            <div className="text-sm text-gray-400">Total Today</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 mb-2">Error Rate</h4>
            <div className="text-2xl font-bold text-yellow-400">0.2%</div>
            <div className="text-sm text-gray-400">Last 24 hours</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 mb-2">Uptime</h4>
            <div className="text-2xl font-bold text-green-400">99.9%</div>
            <div className="text-sm text-gray-400">Last 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Task Queue</h3>
        <button
          onClick={() => {
            const newTask: Task = {
              id: Date.now().toString(),
              title: `Test Task ${Date.now()}`,
              status: 'pending',
              progress: 0,
              type: 'test',
              createdAt: new Date().toISOString()
            };
            setTasks([newTask, ...tasks]);
          }}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          Add Test Task
        </button>
      </div>
      
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className={`text-lg ${getTaskStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                </span>
                <div>
                  <h4 className="text-white font-medium">{task.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>Type: {task.type}</span>
                    <span>Created: {new Date(task.createdAt).toLocaleTimeString()}</span>
                    {task.completedAt && (
                      <span>Completed: {new Date(task.completedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{task.progress}%</div>
                  <div className="text-xs text-gray-400">{task.status}</div>
                </div>
              </div>
            </div>
            
            {task.status === 'running' && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <JeanIcon size={32} isActive={true} />
            <div>
              <h1 className="text-3xl font-bold text-white">JeanTrail OS Dashboard</h1>
              <p className="text-gray-400">System monitoring and control center</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: '🏠' },
          { id: 'services', label: 'Services', icon: '🔧' },
          { id: 'metrics', label: 'Metrics', icon: '📊' },
          { id: 'tasks', label: 'Tasks', icon: '📋' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedView === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'services' && renderServices()}
        {selectedView === 'metrics' && renderMetrics()}
        {selectedView === 'tasks' && renderTasks()}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        Last updated: {new Date().toLocaleString()} • Auto-refresh enabled
      </div>
    </div>
  );
};