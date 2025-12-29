export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  tags: string[];
  owner: string;
  collaborators: string[];
  technologies: string[];
  repository?: string;
  deployedUrl?: string;
  config: ProjectConfig;
  metrics: ProjectMetrics;
  createdAt: string;
  updatedAt?: string;
}

export type ProjectType = 
  | 'web'
  | 'mobile'
  | 'desktop'
  | 'ai'
  | 'database'
  | 'api'
  | 'microservice'
  | 'library'
  | 'cli'
  | 'other';

export type ProjectStatus = 
  | 'planning'
  | 'development'
  | 'testing'
  | 'deployment'
  | 'maintenance'
  | 'archived';

export interface ProjectConfig {
  framework?: string;
  language: string;
  runtime?: string;
  database?: string;
  hosting?: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ProjectMetrics {
  stars: number;
  forks: number;
  issues: number;
  pullRequests: number;
  commits: number;
  linesOfCode: number;
  testCoverage: number;
  buildStatus: 'passing' | 'failing' | 'pending';
  lastDeployed?: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  type: ProjectType;
  tags?: string[];
  config: Partial<ProjectConfig>;
  repository?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
  collaborators?: string[];
  technologies?: string[];
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  type: 'created' | 'updated' | 'deployed' | 'commit' | 'issue' | 'pull_request';
  message: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'viewer';
  permissions: string[];
  joinedAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  category: string;
  icon: string;
  config: ProjectConfig;
  tags: string[];
  isPublic: boolean;
  downloads: number;
  rating: number;
}

export interface ProjectFilter {
  type?: ProjectType;
  status?: ProjectStatus;
  tags?: string[];
  technologies?: string[];
  owner?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface ProjectSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'stars' | 'commits';
  order: 'asc' | 'desc';
}

export interface ProjectStats {
  total: number;
  byType: Record<ProjectType, number>;
  byStatus: Record<ProjectStatus, number>;
  recentActivity: ProjectActivity[];
  topTechnologies: Array<{
    technology: string;
    count: number;
  }>;
}