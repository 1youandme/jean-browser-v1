import React, { useState, useCallback, useEffect } from 'react';
import {
  Zap,
  Globe,
  Shield,
  Key,
  Database,
  Code,
  TestTube,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  FileText,
  Folder,
  Search,
  Filter,
  Play,
  Pause,
  Terminal,
  Code2,
  Link,
  Server,
  Cloud,
  Smartphone,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Wind
} from 'lucide-react';

// Types
interface APIConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  version: string;
  authentication: {
    type: 'none' | 'bearer' | 'basic' | 'api-key' | 'oauth2' | 'custom';
    config: {
      token?: string;
      username?: string;
      password?: string;
      apiKey?: string;
      apiKeyHeader?: string;
      clientId?: string;
      clientSecret?: string;
      scopes?: string[];
      customHeaders?: { [key: string]: string };
    };
  };
  endpoints: APIEndpoint[];
  documentation: APIDocumentation;
  metadata: {
    createdAt: string;
    updatedAt: string;
    category: string;
    tags: string[];
    status: 'active' | 'inactive' | 'testing';
    lastTested?: string;
  };
}

interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  description: string;
  parameters: APIParameter[];
  requestBody?: any;
  responses: APIResponse[];
  examples: APIExample[];
  testResults?: TestResult[];
}

interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

interface APIResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

interface APIExample {
  name: string;
  description: string;
  request: {
    url: string;
    method: string;
    headers?: { [key: string]: string };
    body?: any;
  };
  response: {
    statusCode: number;
    headers?: { [key: string]: string };
    body?: any;
  };
}

interface TestResult {
  timestamp: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  error?: string;
  responseBody?: any;
}

interface APIDocumentation {
  overview: string;
  authentication: string;
  usage: string;
  examples: string;
  changelog: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation: (data: any) => boolean;
}

// Mock data
const MOCK_APIS: APIConfig[] = [
  {
    id: '1',
    name: 'Weather API',
    description: 'Real-time weather data and forecasts',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    version: '2.5',
    authentication: {
      type: 'api-key',
      config: {
        apiKey: 'your-api-key-here',
        apiKeyHeader: 'appid'
      }
    },
    endpoints: [
      {
        id: '1-1',
        path: '/weather',
        method: 'GET',
        description: 'Get current weather data',
        parameters: [
          {
            name: 'q',
            type: 'string',
            required: true,
            description: 'City name, state code and country code'
          },
          {
            name: 'units',
            type: 'string',
            required: false,
            description: 'Units of measurement',
            defaultValue: 'metric'
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Weather data retrieved successfully',
            example: {
              coord: { lon: -0.1257, lat: 51.5085 },
              weather: [{ main: 'Clear', description: 'clear sky' }],
              main: { temp: 15.2, feels_like: 14.8, humidity: 72 },
              name: 'London'
            }
          }
        ],
        examples: []
      }
    ],
    documentation: {
      overview: 'OpenWeatherMap provides current weather data and forecasts',
      authentication: 'API key required',
      usage: 'Include appid parameter with your API key',
      examples: 'See examples section',
      changelog: 'Version 2.5 - latest stable version'
    },
    metadata: {
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      category: 'Weather',
      tags: ['weather', 'climate', 'forecast'],
      status: 'active',
      lastTested: '2024-01-15T10:30:00Z'
    }
  }
];

// Step 1: Basic Information
const BasicInfoStep: React.FC<{
  data: Partial<APIConfig>;
  onChange: (data: Partial<APIConfig>) => void;
}> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Name
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Weather API"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Brief description of what this API does"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Base URL
        </label>
        <input
          type="url"
          value={data.baseUrl || ''}
          onChange={(e) => onChange({ ...data, baseUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://api.example.com/v1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Version
        </label>
        <input
          type="text"
          value={data.version || ''}
          onChange={(e) => onChange({ ...data, version: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="v1.0"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={data.metadata?.category || ''}
          onChange={(e) => onChange({
            ...data,
            metadata: { ...data.metadata, category: e.target.value }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select category</option>
          <option value="Weather">Weather</option>
          <option value="Finance">Finance</option>
          <option value="Social Media">Social Media</option>
          <option value="E-commerce">E-commerce</option>
          <option value="Maps">Maps</option>
          <option value="Analytics">Analytics</option>
          <option value="Communication">Communication</option>
          <option value="Storage">Storage</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </div>
  );
};

// Step 2: Authentication Configuration
const AuthenticationStep: React.FC<{
  data: Partial<APIConfig>;
  onChange: (data: Partial<APIConfig>) => void;
}> = ({ data, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const authType = data.authentication?.type || 'none';
  
  const updateAuthConfig = (config: any) => {
    onChange({
      ...data,
      authentication: {
        ...data.authentication,
        config: { ...data.authentication?.config, ...config }
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authentication Type
        </label>
        <select
          value={authType}
          onChange={(e) => onChange({
            ...data,
            authentication: { type: e.target.value as any, config: {} }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">None (Public API)</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="api-key">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
          <option value="custom">Custom Headers</option>
        </select>
      </div>
      
      {authType === 'bearer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bearer Token
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.authentication?.config?.token || ''}
              onChange={(e) => updateAuthConfig({ token: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bearer token"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
      
      {authType === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={data.authentication?.config?.username || ''}
              onChange={(e) => updateAuthConfig({ username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.authentication?.config?.password || ''}
                onChange={(e) => updateAuthConfig({ password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {authType === 'api-key' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.authentication?.config?.apiKey || ''}
                onChange={(e) => updateAuthConfig({ apiKey: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter API key"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key Header Name
            </label>
            <input
              type="text"
              value={data.authentication?.config?.apiKeyHeader || ''}
              onChange={(e) => updateAuthConfig({ apiKeyHeader: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., X-API-Key, Authorization"
            />
          </div>
        </div>
      )}
      
      {authType === 'oauth2' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={data.authentication?.config?.clientId || ''}
              onChange={(e) => updateAuthConfig({ clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter client ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={data.authentication?.config?.clientSecret || ''}
                onChange={(e) => updateAuthConfig({ clientSecret: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter client secret"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scopes (comma-separated)
            </label>
            <input
              type="text"
              value={data.authentication?.config?.scopes?.join(', ') || ''}
              onChange={(e) => updateAuthConfig({ 
                scopes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="read, write, admin"
            />
          </div>
        </div>
      )}
      
      {authType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Headers
          </label>
          <div className="space-y-2">
            {Object.entries(data.authentication?.config?.customHeaders || {}).map(([key, value]) => (
              <div key={key} className="flex space-x-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <input
                  type="text"
                  value={value as string}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newHeaders = { ...data.authentication?.config?.customHeaders };
                    delete newHeaders[key];
                    updateAuthConfig({ customHeaders: newHeaders });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const key = prompt('Enter header name:');
                const value = key ? prompt('Enter header value:') : null;
                if (key && value) {
                  updateAuthConfig({
                    customHeaders: {
                      ...data.authentication?.config?.customHeaders,
                      [key]: value
                    }
                  });
                }
              }}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Custom Header
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Step 3: Endpoint Configuration
const EndpointStep: React.FC<{
  data: Partial<APIConfig>;
  onChange: (data: Partial<APIConfig>) => void;
}> = ({ data, onChange }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  
  const endpoints = data.endpoints || [];
  
  const updateEndpoint = (id: string, updates: Partial<APIEndpoint>) => {
    onChange({
      ...data,
      endpoints: endpoints.map(ep => ep.id === id ? { ...ep, ...updates } : ep)
    });
  };
  
  const addEndpoint = () => {
    const newEndpoint: APIEndpoint = {
      id: `ep-${Date.now()}`,
      path: '',
      method: 'GET',
      description: '',
      parameters: [],
      responses: [],
      examples: []
    };
    onChange({
      ...data,
      endpoints: [...endpoints, newEndpoint]
    });
    setSelectedEndpoint(newEndpoint.id);
  };
  
  const removeEndpoint = (id: string) => {
    onChange({
      ...data,
      endpoints: endpoints.filter(ep => ep.id !== id)
    });
    if (selectedEndpoint === id) {
      setSelectedEndpoint(null);
    }
  };
  
  const selectedEndpointData = endpoints.find(ep => ep.id === selectedEndpoint);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">API Endpoints</h3>
        <button
          type="button"
          onClick={addEndpoint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Endpoint
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Endpoints</h4>
          {endpoints.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No endpoints added yet</p>
              <p className="text-sm">Click "Add Endpoint" to get started</p>
            </div>
          ) : (
            endpoints.map(endpoint => (
              <div
                key={endpoint.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedEndpoint === endpoint.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEndpoint(endpoint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-medium text-gray-900">{endpoint.path || '/path'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEndpoint(endpoint.id);
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {endpoint.description && (
                  <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Endpoint Editor */}
        {selectedEndpointData && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Edit Endpoint</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Method
                </label>
                <select
                  value={selectedEndpointData.method}
                  onChange={(e) => updateEndpoint(selectedEndpointData.id, {
                    method: e.target.value as APIEndpoint['method']
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Path
                </label>
                <input
                  type="text"
                  value={selectedEndpointData.path}
                  onChange={(e) => updateEndpoint(selectedEndpointData.id, {
                    path: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="/users/{id}"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedEndpointData.description}
                  onChange={(e) => updateEndpoint(selectedEndpointData.id, {
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="What this endpoint does"
                />
              </div>
              
              {/* Parameters section would go here */}
              {/* Responses section would go here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Step 4: Testing
const TestingStep: React.FC<{
  data: Partial<APIConfig>;
  onChange: (data: Partial<APIConfig>) => void;
}> = ({ data, onChange }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  
  const runTest = async () => {
    setIsTesting(true);
    
    try {
      // Mock API test - replace with real testing logic
      const result: TestResult = {
        timestamp: new Date().toISOString(),
        statusCode: 200,
        responseTime: Math.random() * 1000,
        success: true,
        responseBody: { status: 'success', data: 'test data' }
      };
      
      setTestResults([...testResults, result]);
      
      // Update endpoint with test results
      const endpoint = data.endpoints?.find(ep => ep.id === selectedEndpoint);
      if (endpoint) {
        const updatedEndpoints = data.endpoints?.map(ep => 
          ep.id === selectedEndpoint 
            ? { ...ep, testResults: [...(ep.testResults || []), result] }
            : ep
        );
        onChange({ ...data, endpoints: updatedEndpoints });
      }
    } catch (error) {
      setTestResults([...testResults, {
        timestamp: new Date().toISOString(),
        statusCode: 0,
        responseTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Endpoint to Test
        </label>
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select an endpoint</option>
          {data.endpoints?.map(endpoint => (
            <option key={endpoint.id} value={endpoint.id}>
              {endpoint.method} {endpoint.path}
            </option>
          ))}
        </select>
      </div>
      
      {selectedEndpoint && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Test Parameters</h4>
          <div className="space-y-3">
            {data.endpoints?.find(ep => ep.id === selectedEndpoint)?.parameters?.map(param => (
              <div key={param.name}>
                <label className="block text-sm text-gray-600 mb-1">
                  {param.name} {param.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={testParams[param.name] || ''}
                  onChange={(e) => setTestParams({
                    ...testParams,
                    [param.name]: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={param.defaultValue?.toString() || ''}
                />
              </div>
            ))}
          </div>
          
          <button
            onClick={runTest}
            disabled={isTesting}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 inline mr-2" />
            )}
            {isTesting ? 'Testing...' : 'Run Test'}
          </button>
        </div>
      )}
      
      {testResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Status: {result.statusCode}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {result.responseTime.toFixed(0)}ms
                  </span>
                </div>
                {result.error && (
                  <p className="text-sm text-red-600 mt-1">{result.error}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 5: Documentation
const DocumentationStep: React.FC<{
  data: Partial<APIConfig>;
  onChange: (data: Partial<APIConfig>) => void;
}> = ({ data, onChange }) => {
  const updateDoc = (section: keyof APIDocumentation, content: string) => {
    onChange({
      ...data,
      documentation: {
        ...data.documentation,
        [section]: content
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overview
        </label>
        <textarea
          value={data.documentation?.overview || ''}
          onChange={(e) => updateDoc('overview', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Provide a general overview of your API..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Authentication
        </label>
        <textarea
          value={data.documentation?.authentication || ''}
          onChange={(e) => updateDoc('authentication', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Explain how to authenticate with your API..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Usage Examples
        </label>
        <textarea
          value={data.documentation?.examples || ''}
          onChange={(e) => updateDoc('examples', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
          placeholder="Provide code examples for common use cases..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Changelog
        </label>
        <textarea
          value={data.documentation?.changelog || ''}
          onChange={(e) => updateDoc('changelog', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Document changes and version history..."
        />
      </div>
    </div>
  );
};

// Wizard steps configuration
const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Configure basic API details',
    component: BasicInfoStep,
    validation: (data) => !!(data.name && data.baseUrl)
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Set up API authentication',
    component: AuthenticationStep,
    validation: () => true // Always valid, can have no auth
  },
  {
    id: 'endpoints',
    title: 'Endpoints',
    description: 'Define API endpoints',
    component: EndpointStep,
    validation: (data) => !!(data.endpoints && data.endpoints.length > 0)
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Test API endpoints',
    component: TestingStep,
    validation: () => true // Testing is optional
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Generate API documentation',
    component: DocumentationStep,
    validation: () => true // Documentation is optional
  }
];

// Main Component
export const APIExtractorWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiConfig, setApiConfig] = useState<Partial<APIConfig>>({
    authentication: { type: 'none', config: {} },
    endpoints: [],
    documentation: {
      overview: '',
      authentication: '',
      usage: '',
      examples: '',
      changelog: ''
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: '',
      tags: [],
      status: 'active'
    }
  });
  
  const [savedAPIs, setSavedAPIs] = useState<APIConfig[]>(MOCK_APIS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const currentStepConfig = WIZARD_STEPS[currentStep];
  const CurrentStepComponent = currentStepConfig.component;
  
  const canGoNext = currentStepConfig.validation(apiConfig);
  const canGoBack = currentStep > 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  
  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Mock save - replace with real API call
      const newAPI: APIConfig = {
        ...apiConfig,
        id: `api-${Date.now()}`,
        metadata: {
          ...apiConfig.metadata!,
          updatedAt: new Date().toISOString()
        }
      } as APIConfig;
      
      setSavedAPIs([...savedAPIs, newAPI]);
      
      // Reset wizard
      setCurrentStep(0);
      setApiConfig({
        authentication: { type: 'none', config: {} },
        endpoints: [],
        documentation: {
          overview: '',
          authentication: '',
          usage: '',
          examples: '',
          changelog: ''
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: '',
          tags: [],
          status: 'active'
        }
      });
      
      alert('API configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save API configuration:', error);
      alert('Failed to save API configuration');
    } finally {
      setIsSaving(false);
    }
  };
  
  const exportAPI = (api: APIConfig) => {
    const dataStr = JSON.stringify(api, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${api.name.replace(/\s+/g, '-').toLowerCase()}-api-config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                API Extractor Wizard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Automatically extract and configure APIs for your applications
              </p>
            </div>
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Folder className="w-4 h-4 inline mr-2" />
              Saved APIs ({savedAPIs.length})
            </button>
          </div>
        </div>
        
        {/* Step Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                    index === currentStep
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : index < currentStep
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    index === currentStep ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {showSaved ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Saved API Configurations</h3>
              {savedAPIs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No saved API configurations</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedAPIs.map(api => (
                    <div key={api.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{api.name}</h4>
                          <p className="text-sm text-gray-600">{api.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{api.baseUrl}</span>
                            <span className={`px-2 py-1 rounded ${
                              api.metadata.status === 'active' ? 'bg-green-100 text-green-800' :
                              api.metadata.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {api.metadata.status}
                            </span>
                            <span>Created: {new Date(api.metadata.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportAPI(api)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Export"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowSaved(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create New API Configuration
              </button>
            </div>
          ) : (
            <div>
              <CurrentStepComponent
                data={apiConfig}
                onChange={setApiConfig}
              />
              
              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className={`px-4 py-2 rounded-lg ${
                    canGoBack
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Previous
                </button>
                
                <div className="flex space-x-3">
                  {isLastStep ? (
                    <button
                      onClick={handleSave}
                      disabled={!canGoNext || isSaving}
                      className={`px-6 py-2 rounded-lg ${
                        canGoNext && !isSaving
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 inline mr-2" />
                      )}
                      Save API Configuration
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className={`px-6 py-2 rounded-lg ${
                        canGoNext
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 inline ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};