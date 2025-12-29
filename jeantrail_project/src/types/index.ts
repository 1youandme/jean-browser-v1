// Re-export all types from individual modules
export * from './auth';
export * from './projects';
export * from './ai';
export * from './dashboard';

// Essential basic types for immediate compilation
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  role: 'user' | 'developer' | 'admin';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

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

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  acceptTerms: boolean;
}

export interface AIService {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'image' | 'audio' | 'multimodal';
  status: 'online' | 'offline' | 'loading';
  capabilities: AICapability[];
  endpoint: string;
  model: string;
  provider: string;
  version: string;
  pricing: AIPricing;
  limits: AILimits;
  metrics: AIMetrics;
  config: AIConfig;
}

export type AICapability = 
  | 'text_generation'
  | 'image_generation'
  | 'speech_to_text'
  | 'text_to_speech'
  | 'translation'
  | 'summarization'
  | 'classification'
  | 'extraction'
  | 'code_generation'
  | 'data_analysis';

export interface AIPricing {
  currency: string;
  unit: 'tokens' | 'requests' | 'seconds' | 'images';
  price: number;
  freeQuota: number;
}

export interface AILimits {
  maxTokens: number;
  maxRequestsPerMinute: number;
  maxFileSize: number;
  maxConcurrentRequests: number;
  timeout: number;
}

export interface AIMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  successRate: number;
  totalRequests: number;
  totalCost: number;
  uptime: number;
}

export interface AIConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  stopSequences: string[];
  systemPrompt?: string;
}

export interface AIRequest {
  message: string;
  serviceId: string;
  type?: 'text' | 'image' | 'audio';
  context?: string;
  parameters?: Record<string, any>;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
    cost: number;
  };
  stream?: AsyncGenerator<string>;
  attachments?: AIAttachment[];
}

export interface AIAttachment {
  id: string;
  type: 'image' | 'audio' | 'file' | 'video';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'loading';
  url: string;
  port: number;
  responseTime?: number;
  uptime?: string;
  lastCheck: string;
  version?: string;
  memory?: number;
  cpu?: number;
  dependencies?: string[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  gpu?: number;
  temperature?: number;
  processes?: number;
  uptime?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  error?: string;
  metadata?: Record<string, any>;
  dependencies?: string[];
  assignedTo?: string;
  createdBy: string;
}

export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url?: string;
    handler?: string;
  };
  metadata?: Record<string, any>;
}

export interface CreateProjectData {
  name: string;
  description: string;
  type: ProjectType;
  tags?: string[];
  config: Partial<ProjectConfig>;
  repository?: string;
}

// Common types used across the application
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  status: number;
}

// UI State types
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: any;
}

export interface ToastState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

// File types
export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ImageUpload extends FileUpload {
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnail?: string;
}

// Chart types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    x?: any;
    y?: any;
  };
}

// Theme types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  payload?: any;
}

export interface UserEvent extends BaseEvent {
  userId: string;
  sessionId: string;
  action: string;
  resource?: string;
}

export interface SystemEvent extends BaseEvent {
  service: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

// Context types
export interface AppContext {
  user: User | null;
  isAuthenticated: boolean;
  theme: Theme;
  language: string;
  notifications: ToastState[];
  modals: ModalState[];
  loading: LoadingState;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  layout?: React.ComponentType;
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  badge?: number | string;
  children?: NavigationItem[];
  disabled?: boolean;
  external?: boolean;
}

// Additional missing types for existing components
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}