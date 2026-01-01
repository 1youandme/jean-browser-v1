// Auto-API Extractor / Generator Service Interface and Implementation

// Chrome API declarations
declare const chrome: any;
declare global {
  interface Window {
    chrome: any;
  }
}

export interface ApiDiscoveryLog {
  id: string;
  userId?: string;
  session_id?: string;
  domain: string;
  method: string;
  url: string;
  headers: Record<string, any>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
  timestamp: Date;
  processed: boolean;
  apiSpec?: OpenApiSpec;
}

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers: OpenApiServer[];
  paths: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
  patch?: OpenApiOperation;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  tags: string[];
}

export interface OpenApiParameter {
  name: string;
  in: string; // "query", "header", "path", "cookie"
  required: boolean;
  schema: Record<string, any>;
}

export interface OpenApiRequestBody {
  content: Record<string, OpenApiMediaType>;
  required?: boolean;
}

export interface OpenApiMediaType {
  schema: Record<string, any>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiComponents {
  schemas?: Record<string, Record<string, any>>;
}

export interface LogApiRequestRequest {
  session_id?: string;
  domain: string;
  method: string;
  url: string;
  headers: Record<string, any>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, any>;
  responseBody?: string;
}

export interface GetDiscoveredApisQuery {
  domain?: string;
  processed?: boolean;
  limit?: number;
  offset?: number;
}

export interface GenerateClientStubsQuery {
  languages: string[];
}

export interface ClientStub {
  language: string;
  content: string;
  filename: string;
}

export interface AutoApiService {
  // API discovery logging
  logApiRequest: (request: LogApiRequestRequest) => Promise<{
    success: boolean;
    logId: string;
  }>;
  
  // Discovered APIs
  getDiscoveredApis: (query?: GetDiscoveredApisQuery) => Promise<any[]>;
  
  // OpenAPI spec generation
  generateOpenApiSpec: (domain: string) => Promise<OpenApiSpec>;
  
  // Client stub generation
  generateClientStubs: (domain: string, query: GenerateClientStubsQuery) => Promise<{
    domain: string;
    stubs: Record<string, ClientStub>;
  }>;
  downloadClientStub: (domain: string, query: { language: string }) => Promise<Response>;
}

class AutoApiServiceImpl implements AutoApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async logApiRequest(request: LogApiRequestRequest): Promise<{
    success: boolean;
    logId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/auto-api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to log API request: ${response.statusText}`);
    return response.json();
  }

  async getDiscoveredApis(query?: GetDiscoveredApisQuery): Promise<any[]> {
    const params = new URLSearchParams();
    if (query?.domain) params.append('domain', query.domain);
    if (query?.processed !== undefined) params.append('processed', query.processed.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/auto-api/discovered?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch discovered APIs: ${response.statusText}`);
    return response.json();
  }

  async generateOpenApiSpec(domain: string): Promise<OpenApiSpec> {
    const response = await fetch(`${this.baseUrl}/api/auto-api/specs/${domain}`);
    if (!response.ok) throw new Error(`Failed to generate OpenAPI spec: ${response.statusText}`);
    return response.json();
  }

  async generateClientStubs(domain: string, query: GenerateClientStubsQuery): Promise<{
    domain: string;
    stubs: Record<string, ClientStub>;
  }> {
    const params = new URLSearchParams();
    params.append('languages', query.languages.join(','));

    const response = await fetch(`${this.baseUrl}/api/auto-api/stubs/${domain}?${params}`);
    if (!response.ok) throw new Error(`Failed to generate client stubs: ${response.statusText}`);
    return response.json();
  }

  async downloadClientStub(domain: string, query: { language: string }): Promise<Response> {
    const params = new URLSearchParams();
    params.append('language', query.language);

    const response = await fetch(`${this.baseUrl}/api/auto-api/stubs/${domain}/download?${params}`);
    if (!response.ok) throw new Error(`Failed to download client stub: ${response.statusText}`);
    return response;
  }
}

// Singleton instance
export const autoApiService = new AutoApiServiceImpl();

// React hook
export const useAutoApiService = (): AutoApiService => {
  return autoApiService;
};

// Browser extension helper
export interface BrowserExtensionInterface {
  // Extension detection
  isExtensionInstalled: () => boolean;
  
  // Request logging
  startLogging: () => void;
  stopLogging: () => void;
  isLogging: () => boolean;
  
  // Data management
  getLoggedRequests: () => Promise<LogApiRequestRequest[]>;
  clearLoggedRequests: () => void;
  exportRequests: () => Promise<string>;
  
  // Settings
  setFilter: (filter: {
    domains?: string[];
    methods?: string[];
    includeHeaders?: boolean;
    includeBody?: boolean;
  }) => void;
  getFilter: () => any;
}

export function createBrowserExtensionInterface(): BrowserExtensionInterface {
  const extensionId = 'jeantrail-auto-api'; // This would be the actual extension ID
  
  return {
    isExtensionInstalled(): boolean {
      return typeof window !== 'undefined' && 
             window.chrome && 
             window.chrome.runtime && 
             window.chrome.runtime.sendMessage;
    },

    async startLogging(): Promise<void> {
      if (!this.isExtensionInstalled()) {
        throw new Error('Browser extension is not installed');
      }

      return new Promise((resolve, reject) => {
        window.chrome!.runtime.sendMessage(extensionId, {
          action: 'startLogging',
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },

    async stopLogging(): Promise<void> {
      if (!this.isExtensionInstalled()) {
        throw new Error('Browser extension is not installed');
      }

      return new Promise((resolve, reject) => {
        window.chrome!.runtime.sendMessage(extensionId, {
          action: 'stopLogging',
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },

    async isLogging(): Promise<boolean> {
      if (!this.isExtensionInstalled()) {
        return false;
      }

      return new Promise((resolve) => {
        window.chrome!.runtime.sendMessage(extensionId, {
          action: 'getStatus',
        }, (response) => {
          resolve(response?.isLogging || false);
        });
      });
    },

    async getLoggedRequests(): Promise<LogApiRequestRequest[]> {
      if (!this.isExtensionInstalled()) {
        return [];
      }

      return new Promise((resolve) => {
        window.chrome!.runtime.sendMessage(extensionId, {
          action: 'getRequests',
        }, (response) => {
          resolve(response?.requests || []);
        });
      });
    },

    async clearLoggedRequests(): Promise<void> {
      if (!this.isExtensionInstalled()) {
        return;
      }

      return new Promise((resolve, reject) => {
        window.chrome!.runtime.sendMessage(extensionId, {
          action: 'clearRequests',
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },

    async exportRequests(): Promise<string> {
      const requests = await this.getLoggedRequests();
      return JSON.stringify(requests, null, 2);
    },

    setFilter(filter: {
      domains?: string[];
      methods?: string[];
      includeHeaders?: boolean;
      includeBody?: boolean;
    }): void {
      if (!this.isExtensionInstalled()) {
        return;
      }

      window.chrome!.runtime.sendMessage(extensionId, {
        action: 'setFilter',
        filter,
      });
    },

    getFilter(): any {
      if (!this.isExtensionInstalled()) {
        return {};
      }

      // This would need to be async in a real implementation
      return {
        domains: [],
        methods: [],
        includeHeaders: true,
        includeBody: false,
      };
    },
  };
}

// API analysis helpers
export function analyzeApiSpec(spec: OpenApiSpec): {
  totalEndpoints: number;
  methods: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  securityLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
} {
  let totalEndpoints = 0;
  const methods = new Set<string>();
  let complexityScore = 0;
  const recommendations: string[] = [];

  // Analyze paths
  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation) {
        totalEndpoints++;
        methods.add(method.toUpperCase());
        
        // Complexity scoring
        complexityScore += (operation.parameters?.length || 0) * 2;
        if (operation.requestBody) complexityScore += 3;
        complexityScore += Object.keys(operation.responses || {}).length;
        
        // Recommendations
        if (!operation.summary && !operation.description) {
          recommendations.push(`${method.toUpperCase()} ${path}: Add description or summary`);
        }
        
        if (operation.parameters?.some(p => p.required && !p.schema.type)) {
          recommendations.push(`${method.toUpperCase()} ${path}: Define types for required parameters`);
        }
      }
    });
  });

  const complexity = 
    complexityScore < 10 ? 'simple' :
    complexityScore < 25 ? 'moderate' : 'complex';

  // Security assessment
  let securityLevel: 'low' | 'medium' | 'high' = 'low';
  if (spec.paths.some(path => Object.values(path).some(op => op && op.summary?.toLowerCase().includes('auth')))) {
    securityLevel = 'medium';
  }
  if (spec.paths.some(path => Object.values(path).some(op => op && op.parameters?.some(p => p.name.toLowerCase().includes('token'))))) {
    securityLevel = 'high';
  }

  // General recommendations
  if (!spec.info.description) {
    recommendations.push('Add API description in info section');
  }
  
  if (!spec.servers || spec.servers.length === 0) {
    recommendations.push('Define server URLs');
  }
  
  if (totalEndpoints === 0) {
    recommendations.push('No endpoints found - check API discovery configuration');
  }

  return {
    totalEndpoints,
    methods: Array.from(methods),
    complexity,
    securityLevel,
    recommendations,
  };
}

// OpenAPI spec validation
export function validateOpenApiSpec(spec: OpenApiSpec): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!spec.openapi) {
    errors.push('Missing openapi version');
  }
  
  if (!spec.info) {
    errors.push('Missing info object');
  } else {
    if (!spec.info.title) {
      errors.push('Missing API title');
    }
    if (!spec.info.version) {
      errors.push('Missing API version');
    }
  }
  
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    errors.push('No paths defined');
  }

  // Path validation
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    if (!path.startsWith('/')) {
      errors.push(`Path ${path} must start with /`);
    }
    
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (operation && !['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
        errors.push(`Invalid HTTP method ${method} for path ${path}`);
      }
    });
  });

  // Warnings
  if (spec.info && !spec.info.description) {
    warnings.push('Consider adding API description');
  }
  
  if (!spec.servers || spec.servers.length === 0) {
    warnings.push('Consider defining server URLs');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Code generation helpers
export function generateOperationName(method: string, path: string): string {
  const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
  let name = method.toLowerCase();
  
  pathParts.forEach(part => {
    name += part.charAt(0).toUpperCase() + part.slice(1);
  });
  
  if (path.includes('{')) {
    name += 'ById';
  }
  
  return name;
}

export function inferParameterType(name: string, path: string): string {
  if (name.toLowerCase().includes('id')) {
    return 'string';
  }
  
  if (name.toLowerCase().includes('limit') || name.toLowerCase().includes('count')) {
    return 'integer';
  }
  
  if (name.toLowerCase().includes('page')) {
    return 'integer';
  }
  
  if (name.toLowerCase().includes('active') || name.toLowerCase().includes('enabled')) {
    return 'boolean';
  }
  
  if (name.toLowerCase().includes('date') || name.toLowerCase().includes('time')) {
    return 'string'; // Could be Date, but safer to use string
  }
  
  return 'string';
}

export function generateTypeScriptType(schema: Record<string, any>): string {
  if (!schema || !schema.type) {
    return 'any';
  }

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemType = schema.items ? generateTypeScriptType(schema.items) : 'any';
      return `${itemType}[]`;
    case 'object':
      if (schema.properties) {
        const properties = Object.entries(schema.properties)
          .map(([key, prop]) => {
            const optional = !schema.required?.includes(key);
            const type = generateTypeScriptType(prop as Record<string, any>);
            return `${key}${optional ? '?' : ''}: ${type};`;
          })
          .join(' ');
        return `{ ${properties} }`;
      }
      return 'Record<string, any>';
    default:
      return 'any';
  }
}