// Developer Hub Service Interface and Implementation
export interface Project {
  id: string;
  name: string;
  description: string;
  repository: {
    url: string;
    provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
    branch: string;
    commitSha?: string;
  };
  language: string;
  framework?: string;
  status: 'active' | 'archived' | 'on_hold';
  visibility: 'public' | 'private';
  tags: string[];
  contributors: Contributor[];
  statistics: ProjectStatistics;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

export interface Contributor {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'viewer';
  contributions: number;
  lastCommit?: Date;
  joinedAt: Date;
}

export interface ProjectStatistics {
  commits: number;
  branches: number;
  releases: number;
  issues: {
    open: number;
    closed: number;
    total: number;
  };
  pullRequests: {
    open: number;
    merged: number;
    total: number;
  };
  stars: number;
  forks: number;
  watchers: number;
}

export interface ProjectSettings {
  autoDeploy: boolean;
  continuousIntegration: boolean;
  codeAnalysis: boolean;
  vulnerabilityScanning: boolean;
  testCoverage: boolean;
  dependenciesCheck: boolean;
  deployBranch: string;
  environmentVariables: Record<string, string>;
}

export interface Deployment {
  id: string;
  projectId: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed' | 'rolled_back';
  url?: string;
  commit: {
    sha: string;
    message: string;
    author: string;
    branch: string;
  };
  buildLog?: string;
  duration?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface CodeAnalysis {
  id: string;
  projectId: string;
  commitSha: string;
  timestamp: Date;
  metrics: {
    linesOfCode: number;
    complexity: number;
    duplication: number;
    maintainabilityIndex: number;
    testCoverage: number;
    securityIssues: number;
    codeSmells: number;
  };
  issues: AnalysisIssue[];
  trends: AnalysisTrend[];
}

export interface AnalysisIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'blocker' | 'critical' | 'major' | 'minor' | 'info';
  category: 'security' | 'performance' | 'maintainability' | 'reliability' | 'style';
  rule: string;
  message: string;
  file: string;
  line?: number;
  suggestions: string[];
}

export interface AnalysisTrend {
  metric: string;
  currentValue: number;
  previousValue: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  url?: string;
  variables: EnvironmentVariable[];
  services: Service[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  type: 'database' | 'cache' | 'storage' | 'queue' | 'api' | 'frontend';
  status: 'running' | 'stopped' | 'error';
  version?: string;
  endpoints?: string[];
  healthCheck?: HealthCheck;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface HealthCheck {
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastChecked: Date;
  responseTime: number;
}

export interface DeveloperHubService {
  // Project management
  getProjects: () => Promise<Project[]>;
  getProject: (id: string) => Promise<Project>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  
  // Repository operations
  syncRepository: (projectId: string) => Promise<void>;
  getBranches: (projectId: string) => Promise<string[]>;
  getCommits: (projectId: string, branch?: string, limit?: number) => Promise<Commit[]>;
  getCommit: (projectId: string, sha: string) => Promise<Commit>;
  createBranch: (projectId: string, branchName: string, fromBranch: string) => Promise<void>;
  deleteBranch: (projectId: string, branchName: string) => Promise<void>;
  
  // Deployments
  getDeployments: (projectId: string) => Promise<Deployment[]>;
  getDeployment: (id: string) => Promise<Deployment>;
  deployProject: (projectId: string, branch: string, environment: string) => Promise<Deployment>;
  rollbackDeployment: (deploymentId: string) => Promise<Deployment>;
  getDeploymentLogs: (deploymentId: string) => Promise<string>;
  
  // Code analysis
  getCodeAnalysis: (projectId: string, commitSha?: string) => Promise<CodeAnalysis>;
  runCodeAnalysis: (projectId: string) => Promise<CodeAnalysis>;
  getAnalysisHistory: (projectId: string, limit?: number) => Promise<CodeAnalysis[]>;
  getAnalysisTrends: (projectId: string) => Promise<AnalysisTrend[]>;
  
  // Environment management
  getEnvironments: (projectId: string) => Promise<Environment[]>;
  getEnvironment: (id: string) => Promise<Environment>;
  createEnvironment: (projectId: string, environment: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Environment>;
  updateEnvironment: (id: string, updates: Partial<Environment>) => Promise<Environment>;
  deleteEnvironment: (id: string) => Promise<void>;
  
  // Environment variables
  getEnvironmentVariables: (environmentId: string) => Promise<EnvironmentVariable[]>;
  setEnvironmentVariable: (environmentId: string, variable: EnvironmentVariable) => Promise<void>;
  updateEnvironmentVariable: (environmentId: string, key: string, variable: Partial<EnvironmentVariable>) => Promise<void>;
  deleteEnvironmentVariable: (environmentId: string, key: string) => Promise<void>;
  
  // Service management
  getServices: (environmentId: string) => Promise<Service[]>;
  getService: (id: string) => Promise<Service>;
  startService: (id: string) => Promise<void>;
  stopService: (id: string) => Promise<void>;
  restartService: (id: string) => Promise<void>;
  getServiceLogs: (id: string, lines?: number) => Promise<string>;
  getServiceMetrics: (id: string) => Promise<ServiceMetrics>;
  
  // Team management
  getProjectContributors: (projectId: string) => Promise<Contributor[]>;
  addContributor: (projectId: string, username: string, role: string) => Promise<Contributor>;
  updateContributorRole: (projectId: string, userId: string, role: string) => Promise<void>;
  removeContributor: (projectId: string, userId: string) => Promise<void>;
  
  // Integrations
  getIntegrations: (projectId: string) => Promise<Integration[]>;
  addIntegration: (projectId: string, integration: IntegrationConfig) => Promise<Integration>;
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => Promise<Integration>;
  removeIntegration: (id: string) => Promise<void>;
  
  // Webhooks
  getWebhooks: (projectId: string) => Promise<Webhook[]>;
  createWebhook: (projectId: string, webhook: WebhookConfig) => Promise<Webhook>;
  updateWebhook: (id: string, updates: Partial<WebhookConfig>) => Promise<Webhook>;
  deleteWebhook: (id: string) => Promise<void>;
  testWebhook: (id: string) => Promise<WebhookTestResult>;
  
  // Analytics and monitoring
  getProjectMetrics: (projectId: string, timeRange?: string) => Promise<ProjectMetrics>;
  getPerformanceMetrics: (projectId: string, timeRange?: string) => Promise<PerformanceMetrics>;
  getErrorLogs: (projectId: string, filters?: LogFilters) => Promise<ErrorLog[]>;
  
  // Marketplace
  getMarketplaceTemplates: () => Promise<ProjectTemplate[]>;
  getMarketplaceIntegrations: () => Promise<IntegrationTemplate[]>;
  installTemplate: (templateId: string, config: TemplateConfig) => Promise<Project>;
}

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    username?: string;
    avatar?: string;
  };
  date: Date;
  branch: string;
  additions: number;
  deletions: number;
  files: string[];
}

export interface ServiceMetrics {
  cpu: {
    current: number;
    average: number;
    peak: number;
  };
  memory: {
    current: number;
    average: number;
    peak: number;
  };
  requests: {
    total: number;
    success: number;
    error: number;
    averageResponseTime: number;
  };
  uptime: number;
  lastRestart: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
  configuration: Record<string, any>;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  name: string;
  type: string;
  provider: string;
  configuration: Record<string, any>;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  lastTriggered?: Date;
  deliveryCount: number;
  createdAt: Date;
}

export interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active?: boolean;
}

export interface WebhookTestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  response?: string;
  error?: string;
}

export interface ProjectMetrics {
  deployments: {
    total: number;
    success: number;
    failed: number;
    averageTime: number;
  };
  commits: {
    total: number;
    perDay: number;
    contributors: number;
  };
  issues: {
    opened: number;
    closed: number;
    averageResolutionTime: number;
  };
  pullRequests: {
    opened: number;
    merged: number;
    averageReviewTime: number;
  };
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requests: number;
    errors: number;
  };
  availability: {
    uptime: number;
    downtime: number;
  };
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  service: string;
  environment: string;
  stackTrace?: string;
  metadata: Record<string, any>;
}

export interface LogFilters {
  level?: string[];
  service?: string[];
  environment?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  framework?: string;
  features: string[];
  author: string;
  downloads: number;
  rating: number;
  imageUrl?: string;
  repositoryUrl?: string;
  createdAt: Date;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  type: string;
  features: string[];
  author: string;
  installs: number;
  rating: number;
  iconUrl?: string;
  documentationUrl?: string;
  createdAt: Date;
}

export interface TemplateConfig {
  name: string;
  description?: string;
  customizations: Record<string, any>;
}

class DeveloperHubServiceImpl implements DeveloperHubService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects`);
    if (!response.ok) throw new Error('Failed to get projects');
    return response.json();
  }

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${id}`);
    if (!response.ok) throw new Error('Failed to get project');
    return response.json();
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'lastActivity'>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
  }

  async archiveProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${id}/archive`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to archive project');
  }

  async syncRepository(projectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/sync`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync repository');
  }

  async getBranches(projectId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/branches`);
    if (!response.ok) throw new Error('Failed to get branches');
    return response.json();
  }

  async getCommits(projectId: string, branch?: string, limit?: number): Promise<Commit[]> {
    const params = new URLSearchParams();
    if (branch) params.append('branch', branch);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/commits?${params}`);
    if (!response.ok) throw new Error('Failed to get commits');
    return response.json();
  }

  async getCommit(projectId: string, sha: string): Promise<Commit> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/commits/${sha}`);
    if (!response.ok) throw new Error('Failed to get commit');
    return response.json();
  }

  async createBranch(projectId: string, branchName: string, fromBranch: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: branchName, from: fromBranch }),
    });
    if (!response.ok) throw new Error('Failed to create branch');
  }

  async deleteBranch(projectId: string, branchName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/branches/${branchName}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete branch');
  }

  async getDeployments(projectId: string): Promise<Deployment[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/deployments`);
    if (!response.ok) throw new Error('Failed to get deployments');
    return response.json();
  }

  async getDeployment(id: string): Promise<Deployment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/deployments/${id}`);
    if (!response.ok) throw new Error('Failed to get deployment');
    return response.json();
  }

  async deployProject(projectId: string, branch: string, environment: string): Promise<Deployment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch, environment }),
    });
    if (!response.ok) throw new Error('Failed to deploy project');
    return response.json();
  }

  async rollbackDeployment(deploymentId: string): Promise<Deployment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/deployments/${deploymentId}/rollback`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to rollback deployment');
    return response.json();
  }

  async getDeploymentLogs(deploymentId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/deployments/${deploymentId}/logs`);
    if (!response.ok) throw new Error('Failed to get deployment logs');
    return response.text();
  }

  async getCodeAnalysis(projectId: string, commitSha?: string): Promise<CodeAnalysis> {
    const params = commitSha ? `?commit=${commitSha}` : '';
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/analysis${params}`);
    if (!response.ok) throw new Error('Failed to get code analysis');
    return response.json();
  }

  async runCodeAnalysis(projectId: string): Promise<CodeAnalysis> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/analysis`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to run code analysis');
    return response.json();
  }

  async getAnalysisHistory(projectId: string, limit?: number): Promise<CodeAnalysis[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/analysis/history${params}`);
    if (!response.ok) throw new Error('Failed to get analysis history');
    return response.json();
  }

  async getAnalysisTrends(projectId: string): Promise<AnalysisTrend[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/analysis/trends`);
    if (!response.ok) throw new Error('Failed to get analysis trends');
    return response.json();
  }

  async getEnvironments(projectId: string): Promise<Environment[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/environments`);
    if (!response.ok) throw new Error('Failed to get environments');
    return response.json();
  }

  async getEnvironment(id: string): Promise<Environment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${id}`);
    if (!response.ok) throw new Error('Failed to get environment');
    return response.json();
  }

  async createEnvironment(projectId: string, environment: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Environment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(environment),
    });
    if (!response.ok) throw new Error('Failed to create environment');
    return response.json();
  }

  async updateEnvironment(id: string, updates: Partial<Environment>): Promise<Environment> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update environment');
    return response.json();
  }

  async deleteEnvironment(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete environment');
  }

  async getEnvironmentVariables(environmentId: string): Promise<EnvironmentVariable[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${environmentId}/variables`);
    if (!response.ok) throw new Error('Failed to get environment variables');
    return response.json();
  }

  async setEnvironmentVariable(environmentId: string, variable: EnvironmentVariable): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${environmentId}/variables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable),
    });
    if (!response.ok) throw new Error('Failed to set environment variable');
  }

  async updateEnvironmentVariable(environmentId: string, key: string, variable: Partial<EnvironmentVariable>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${environmentId}/variables/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variable),
    });
    if (!response.ok) throw new Error('Failed to update environment variable');
  }

  async deleteEnvironmentVariable(environmentId: string, key: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${environmentId}/variables/${key}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete environment variable');
  }

  async getServices(environmentId: string): Promise<Service[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/environments/${environmentId}/services`);
    if (!response.ok) throw new Error('Failed to get services');
    return response.json();
  }

  async getService(id: string): Promise<Service> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}`);
    if (!response.ok) throw new Error('Failed to get service');
    return response.json();
  }

  async startService(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}/start`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start service');
  }

  async stopService(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}/stop`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop service');
  }

  async restartService(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}/restart`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to restart service');
  }

  async getServiceLogs(id: string, lines?: number): Promise<string> {
    const params = lines ? `?lines=${lines}` : '';
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}/logs${params}`);
    if (!response.ok) throw new Error('Failed to get service logs');
    return response.text();
  }

  async getServiceMetrics(id: string): Promise<ServiceMetrics> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/services/${id}/metrics`);
    if (!response.ok) throw new Error('Failed to get service metrics');
    return response.json();
  }

  async getProjectContributors(projectId: string): Promise<Contributor[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/contributors`);
    if (!response.ok) throw new Error('Failed to get project contributors');
    return response.json();
  }

  async addContributor(projectId: string, username: string, role: string): Promise<Contributor> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/contributors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, role }),
    });
    if (!response.ok) throw new Error('Failed to add contributor');
    return response.json();
  }

  async updateContributorRole(projectId: string, userId: string, role: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/contributors/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to update contributor role');
  }

  async removeContributor(projectId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/contributors/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove contributor');
  }

  async getIntegrations(projectId: string): Promise<Integration[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/integrations`);
    if (!response.ok) throw new Error('Failed to get integrations');
    return response.json();
  }

  async addIntegration(projectId: string, integration: IntegrationConfig): Promise<Integration> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/integrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(integration),
    });
    if (!response.ok) throw new Error('Failed to add integration');
    return response.json();
  }

  async updateIntegration(id: string, updates: Partial<IntegrationConfig>): Promise<Integration> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/integrations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update integration');
    return response.json();
  }

  async removeIntegration(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/integrations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove integration');
  }

  async getWebhooks(projectId: string): Promise<Webhook[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/webhooks`);
    if (!response.ok) throw new Error('Failed to get webhooks');
    return response.json();
  }

  async createWebhook(projectId: string, webhook: WebhookConfig): Promise<Webhook> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhook),
    });
    if (!response.ok) throw new Error('Failed to create webhook');
    return response.json();
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<Webhook> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/webhooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update webhook');
    return response.json();
  }

  async deleteWebhook(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/webhooks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete webhook');
  }

  async testWebhook(id: string): Promise<WebhookTestResult> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/webhooks/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test webhook');
    return response.json();
  }

  async getProjectMetrics(projectId: string, timeRange?: string): Promise<ProjectMetrics> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/metrics${params}`);
    if (!response.ok) throw new Error('Failed to get project metrics');
    return response.json();
  }

  async getPerformanceMetrics(projectId: string, timeRange?: string): Promise<PerformanceMetrics> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/performance${params}`);
    if (!response.ok) throw new Error('Failed to get performance metrics');
    return response.json();
  }

  async getErrorLogs(projectId: string, filters?: LogFilters): Promise<ErrorLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/dev-hub/projects/${projectId}/logs?${params}`);
    if (!response.ok) throw new Error('Failed to get error logs');
    return response.json();
  }

  async getMarketplaceTemplates(): Promise<ProjectTemplate[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/marketplace/templates`);
    if (!response.ok) throw new Error('Failed to get marketplace templates');
    return response.json();
  }

  async getMarketplaceIntegrations(): Promise<IntegrationTemplate[]> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/marketplace/integrations`);
    if (!response.ok) throw new Error('Failed to get marketplace integrations');
    return response.json();
  }

  async installTemplate(templateId: string, config: TemplateConfig): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/api/dev-hub/marketplace/templates/${templateId}/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to install template');
    return response.json();
  }
}

export const developerHubService = new DeveloperHubServiceImpl();
export const useDeveloperHubService = () => developerHubService;