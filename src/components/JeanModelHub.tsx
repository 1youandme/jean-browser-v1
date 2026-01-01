import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { JeanModel, ModelInstance, ModelType, ModelBackend, ModelStatus } from '../types/jean-model-hub';

interface JeanModelHubProps {
  userId: string;
  onModelSelect?: (model: JeanModel) => void;
}

const JeanModelHub: React.FC<JeanModelHubProps> = ({ userId, onModelSelect }) => {
  const [models, setModels] = useState<JeanModel[]>([]);
  const [instances, setInstances] = useState<ModelInstance[]>([]);
  const [selectedModel, setSelectedModel] = useState<JeanModel | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'instances' | 'usage'>('models');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ModelType | 'all'>('all');
  const [filterBackend, setFilterBackend] = useState<ModelBackend | 'all'>('all');

  // Load models on component mount
  useEffect(() => {
    loadModels();
    loadInstances();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const result = await invoke<JeanModel[]>('jean_model_hub_search', {
        query: searchQuery || undefined,
        modelType: filterType === 'all' ? undefined : filterType,
        backend: filterBackend === 'all' ? undefined : filterBackend,
      });
      setModels(result);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstances = async () => {
    try {
      const result = await invoke<ModelInstance[]>('jean_model_hub_get_instances', { userId });
      setInstances(result);
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  };

  const loadModel = async (modelId: string) => {
    try {
      const result = await invoke<ModelInstance>('jean_model_hub_load_model', {
        modelId,
        config: {
          auto_start: true,
          allocate_resources: {
            memory_gb: 4,
            cpu_cores: 2,
          },
        },
      });
      setInstances(prev => [result, ...prev]);
      await loadInstances(); // Refresh instances
    } catch (error) {
      console.error('Failed to load model:', error);
    }
  };

  const unloadModel = async (instanceId: string) => {
    try {
      await invoke('jean_model_hub_unload_model', { instanceId });
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
    } catch (error) {
      console.error('Failed to unload model:', error);
    }
  };

  const getModelTypeDisplay = (type: ModelType): string => {
    const typeNames = {
      [ModelType.LLM]: 'Language Model',
      [ModelType.TTS]: 'Text-to-Speech',
      [ModelType.STT]: 'Speech-to-Text',
      [ModelType.Vision]: 'Vision Model',
      [ModelType.Embedding]: 'Embedding Model',
      [ModelType.Translation]: 'Translation Model',
    };
    return typeNames[type] || type;
  };

  const getBackendDisplay = (backend: ModelBackend): string => {
    const backendNames = {
      [ModelBackend.Local]: 'Local',
      [ModelBackend.Cloud]: 'Cloud',
      [ModelBackend.Colab]: 'Colab',
      [ModelBackend.Api]: 'API',
      [ModelBackend.Hybrid]: 'Hybrid',
    };
    return backendNames[backend] || backend;
  };

  const getStatusColor = (status: ModelStatus): string => {
    switch (status) {
      case ModelStatus.Active: return 'text-green-600 bg-green-100';
      case ModelStatus.Inactive: return 'text-gray-600 bg-gray-100';
      case ModelStatus.Loading: return 'text-yellow-600 bg-yellow-100';
      case ModelStatus.Error: return 'text-red-600 bg-red-100';
      case ModelStatus.Updating: return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = !searchQuery || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || model.model_type === filterType;
    const matchesBackend = filterBackend === 'all' || model.backend === filterBackend;
    return matchesSearch && matchesType && matchesBackend;
  });

  const renderModels = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ModelType | 'all')}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Types</option>
          {Object.values(ModelType).map(type => (
            <option key={type} value={type}>{getModelTypeDisplay(type)}</option>
          ))}
        </select>
        <select
          value={filterBackend}
          onChange={(e) => setFilterBackend(e.target.value as ModelBackend | 'all')}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">All Backends</option>
          {Object.values(ModelBackend).map(backend => (
            <option key={backend} value={backend}>{getBackendDisplay(backend)}</option>
          ))}
        </select>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="text-lg">Loading models...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map(model => (
            <div
              key={model.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedModel?.id === model.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedModel(model);
                onModelSelect?.(model);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{model.display_name || model.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                  {model.status}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{model.description}</p>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{getModelTypeDisplay(model.model_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Backend:</span>
                  <span>{getBackendDisplay(model.backend)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span>{model.provider || 'Unknown'}</span>
                </div>
                {model.quality_score && (
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span>{(model.quality_score * 100).toFixed(0)}%</span>
                  </div>
                )}
                {model.cost_per_token && (
                  <div className="flex justify-between">
                    <span>Cost/Token:</span>
                    <span>${model.cost_per_token}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {model.capabilities.slice(0, 3).map(cap => (
                  <span key={cap} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {cap}
                  </span>
                ))}
                {model.capabilities.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    +{model.capabilities.length - 3}
                  </span>
                )}
              </div>

              {model.status === ModelStatus.Inactive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    loadModel(model.id);
                  }}
                  className="w-full mt-3 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load Model
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInstances = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Running Instances</h2>
      
      {instances.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No models are currently running</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map(instance => (
            <div key={instance.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{instance.instance_name}</h3>
                  <p className="text-sm text-gray-600">
                    PID: {instance.pid} | Port: {instance.port}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    instance.is_running ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {instance.is_running ? 'Running' : 'Stopped'}
                  </span>
                  {instance.is_running && (
                    <button
                      onClick={() => unloadModel(instance.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Load:</span>
                  <span className="ml-2">{instance.current_load ? `${(instance.current_load * 100).toFixed(0)}%` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Requests:</span>
                  <span className="ml-2">{instance.total_requests}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tokens:</span>
                  <span className="ml-2">{instance.total_tokens_processed.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Uptime:</span>
                  <span className="ml-2">{Math.floor(instance.uptime_seconds / 3600)}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderUsage = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Usage Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Usage by Model */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Usage by Model</h3>
          <div className="space-y-2">
            {/* This would be populated with actual usage data */}
            <div className="flex justify-between text-sm">
              <span>GPT-4 Turbo</span>
              <span>1,234 requests</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Claude 3 Sonnet</span>
              <span>856 requests</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Whisper Large</span>
              <span>432 requests</span>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Cost Summary (30 days)</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Cost:</span>
              <span className="font-semibold">$12.34</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Input Tokens:</span>
              <span>1.2M</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Output Tokens:</span>
              <span>450K</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Response Time:</span>
              <span>1.2s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Usage Trends</h3>
        <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
          <p className="text-gray-500">Usage chart would be displayed here</p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'models', label: 'Models', count: filteredModels.length },
    { id: 'instances', label: 'Instances', count: instances.filter(i => i.is_running).length },
    { id: 'usage', label: 'Usage', count: null },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jean Model Hub</h1>
        <p className="text-gray-600">Manage AI models and their instances</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'models' && renderModels()}
        {activeTab === 'instances' && renderInstances()}
        {activeTab === 'usage' && renderUsage()}
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedModel.display_name || selectedModel.name}</h2>
              <button
                onClick={() => setSelectedModel(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{selectedModel.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-500">Type:</span> {getModelTypeDisplay(selectedModel.model_type)}</div>
                    <div><span className="text-gray-500">Backend:</span> {getBackendDisplay(selectedModel.backend)}</div>
                    <div><span className="text-gray-500">Provider:</span> {selectedModel.provider || 'Unknown'}</div>
                    <div><span className="text-gray-500">Version:</span> {selectedModel.version || 'Latest'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-500">Quality Score:</span> {selectedModel.quality_score ? `${(selectedModel.quality_score * 100).toFixed(0)}%` : 'N/A'}</div>
                    <div><span className="text-gray-500">Speed Score:</span> {selectedModel.speed_score ? `${(selectedModel.speed_score * 100).toFixed(0)}%` : 'N/A'}</div>
                    <div><span className="text-gray-500">Response Time:</span> {selectedModel.avg_response_time_ms ? `${selectedModel.avg_response_time_ms}ms` : 'N/A'}</div>
                    <div><span className="text-gray-500">Success Rate:</span> {selectedModel.success_rate ? `${(selectedModel.success_rate * 100).toFixed(0)}%` : 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.capabilities.map(cap => (
                    <span key={cap} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.supported_languages.map(lang => (
                    <span key={lang} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                {selectedModel.status === ModelStatus.Inactive && (
                  <button
                    onClick={() => {
                      loadModel(selectedModel.id);
                      setSelectedModel(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Load Model
                  </button>
                )}
                <button
                  onClick={() => setSelectedModel(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JeanModelHub;