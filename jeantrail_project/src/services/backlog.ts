// Backlog / Ideas Management Service Interface and Implementation
export interface BacklogItem {
  id: string;
  questionId?: string;
  title: string;
  summary?: string;
  details?: string;
  technicalDetails?: string;
  category?: string;
  priority: Priority;
  status: Status;
  tags: string[];
  estimatedHours?: number;
  assigneeId?: string;
  creatorId: string;
  source: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'idea' | 'planned' | 'in_progress' | 'completed' | 'archived';

export interface CreateBacklogItemRequest {
  questionId?: string;
  title: string;
  summary?: string;
  details?: string;
  technicalDetails?: string;
  category?: string;
  priority: Priority;
  tags: string[];
  estimatedHours?: number;
  assigneeId?: string;
  source?: string;
}

export interface UpdateBacklogItemRequest {
  title?: string;
  summary?: string;
  details?: string;
  technicalDetails?: string;
  category?: string;
  priority?: Priority;
  status?: Status;
  tags?: string[];
  estimatedHours?: number;
  assigneeId?: string;
  metadata?: Record<string, any>;
}

export interface ListBacklogItemsQuery {
  status?: Status;
  priority?: Priority;
  category?: string;
  assigneeId?: string;
  creatorId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface BacklogStatistics {
  totalItems: number;
  byStatus: Record<Status, number>;
  byPriority: Record<Priority, number>;
  byCategory: Record<string, number>;
  totalEstimatedHours: number;
  completedHours: number;
}

export interface BacklogService {
  // Item management
  getBacklogItems: (query?: ListBacklogItemsQuery) => Promise<BacklogItem[]>;
  getBacklogItem: (id: string) => Promise<BacklogItem>;
  createBacklogItem: (request: CreateBacklogItemRequest) => Promise<BacklogItem>;
  updateBacklogItem: (id: string, request: UpdateBacklogItemRequest) => Promise<BacklogItem>;
  deleteBacklogItem: (id: string) => Promise<void>;
  
  // Import/Export
  importCsvBacklog: (file: File) => Promise<{ importedCount: number; items: BacklogItem[] }>;
  exportCsvBacklog: (query?: ListBacklogItemsQuery) => Promise<string>;
  
  // Analytics
  getBacklogStatistics: () => Promise<BacklogStatistics>;
}

class BacklogServiceImpl implements BacklogService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getBacklogItems(query?: ListBacklogItemsQuery): Promise<BacklogItem[]> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.category) params.append('category', query.category);
    if (query?.assigneeId) params.append('assigneeId', query.assigneeId);
    if (query?.creatorId) params.append('creatorId', query.creatorId);
    if (query?.tags) params.append('tags', query.tags.join(','));
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/backlog?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch backlog items: ${response.statusText}`);
    return response.json();
  }

  async getBacklogItem(id: string): Promise<BacklogItem> {
    const response = await fetch(`${this.baseUrl}/api/backlog/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch backlog item: ${response.statusText}`);
    return response.json();
  }

  async createBacklogItem(request: CreateBacklogItemRequest): Promise<BacklogItem> {
    const response = await fetch(`${this.baseUrl}/api/backlog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create backlog item: ${response.statusText}`);
    return response.json();
  }

  async updateBacklogItem(id: string, request: UpdateBacklogItemRequest): Promise<BacklogItem> {
    const response = await fetch(`${this.baseUrl}/api/backlog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update backlog item: ${response.statusText}`);
    return response.json();
  }

  async deleteBacklogItem(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/backlog/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete backlog item: ${response.statusText}`);
  }

  async importCsvBacklog(file: File): Promise<{ importedCount: number; items: BacklogItem[] }> {
    const formData = new FormData();
    formData.append('csv_file', file);

    const response = await fetch(`${this.baseUrl}/api/backlog/import`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to import CSV backlog: ${response.statusText}`);
    return response.json();
  }

  async exportCsvBacklog(query?: ListBacklogItemsQuery): Promise<string> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.category) params.append('category', query.category);
    if (query?.assigneeId) params.append('assigneeId', query.assigneeId);
    if (query?.tags) params.append('tags', query.tags.join(','));
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/backlog/export?${params}`);
    if (!response.ok) throw new Error(`Failed to export CSV backlog: ${response.statusText}`);
    return response.text();
  }

  async getBacklogStatistics(): Promise<BacklogStatistics> {
    const response = await fetch(`${this.baseUrl}/api/backlog/statistics`);
    if (!response.ok) throw new Error(`Failed to fetch backlog statistics: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const backlogService = new BacklogServiceImpl();

// React hook
export const useBacklogService = (): BacklogService => {
  return backlogService;
};

// Helper functions for CSV parsing
export function parseBacklogFromCSV(csvContent: string): CreateBacklogItemRequest[] {
  const lines = csvContent.split('\n');
  const items: CreateBacklogItemRequest[] = [];
  
  // Skip header and process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (in production, use proper CSV library)
    const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
    
    if (fields.length >= 3) {
      items.push({
        questionId: fields[0] || undefined,
        title: fields[1] || 'Untitled Item',
        summary: fields[2] || undefined,
        priority: 'medium' as Priority,
        tags: [],
        source: 'csv_import',
      });
    }
  }
  
  return items;
}

export function generateBacklogCSV(items: BacklogItem[]): string {
  const headers = ['question_id', 'title', 'summary', 'priority', 'status', 'category', 'tags', 'created_at'];
  const rows = items.map(item => [
    item.questionId || '',
    item.title,
    item.summary || '',
    item.priority,
    item.status,
    item.category || '',
    item.tags.join(';'),
    item.createdAt.toISOString(),
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  return csvContent;
}