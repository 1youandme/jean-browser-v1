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

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  data?: any;
  refreshInterval?: number;
  lastUpdated?: string;
}

export type WidgetType = 
  | 'system_metrics'
  | 'service_status'
  | 'active_tasks'
  | 'ai_usage'
  | 'network_traffic'
  | 'storage_usage'
  | 'error_logs'
  | 'performance_chart'
  | 'user_activity'
  | 'notifications';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  theme?: 'light' | 'dark';
  showLegend?: boolean;
  refreshInterval?: number;
  filters?: Record<string, any>;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
}

export interface Notification {
  id: string;
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

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface NetworkTraffic {
  timestamp: string;
  inbound: number;
  outbound: number;
  total: number;
  connections: number;
  requestsPerSecond: number;
}

export interface StorageUsage {
  total: number;
  used: number;
  available: number;
  percentage: number;
  breakdown: StorageBreakdown[];
}

export interface StorageBreakdown {
  category: string;
  size: number;
  count: number;
  percentage: number;
}

export interface UserActivity {
  userId: string;
  username: string;
  lastSeen: string;
  activeSessions: number;
  actions: number;
  duration: number;
  pages: string[];
  ipAddress: string;
}

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'cards';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  widgets: DashboardWidget[];
  filters: {
    timeRange: string;
    services: string[];
    users: string[];
    status: string[];
  };
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
    canExport: boolean;
  };
}

export interface DashboardAlert {
  id: string;
  type: 'system' | 'performance' | 'security' | 'usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'performance' | 'usage' | 'security' | 'custom';
  description: string;
  format: 'pdf' | 'csv' | 'json' | 'html';
  parameters: ReportParameters;
  generatedAt: string;
  generatedBy: string;
  fileUrl?: string;
  size?: number;
}

export interface ReportParameters {
  dateRange: {
    start: string;
    end: string;
  };
  services: string[];
  metrics: string[];
  filters: Record<string, any>;
  format: string;
}