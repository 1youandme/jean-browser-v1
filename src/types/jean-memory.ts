import { Uuid } from './common';

export interface MemoryFolder {
  id: Uuid;
  user_id: Uuid;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: Uuid;
  folder_path: string[];
  is_system_folder: boolean;
  sort_order: number;
  memory_count: number;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: Uuid;
  user_id: Uuid;
  folder_id?: Uuid;
  title?: string;
  memory_type: 'note' | 'conversation' | 'file' | 'link' | 'task' | 'preference' | 'context';
  content: Record<string, any>;
  text_content?: string;
  context_tags: string[];
  metadata: Record<string, any>;
  
  // File attachments
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  
  // Access control
  is_private: boolean;
  is_encrypted: boolean;
  is_favorite: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  
  // Relationships
  parent_memory_id?: Uuid;
  linked_memory_ids: Uuid[];
  
  // Search and relevance
  relevance_score?: number;
  access_count: number;
  last_accessed?: string;
  
  // Session tracking
  session_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MemorySearchRequest {
  user_id: Uuid;
  query?: string;
  folder_id?: Uuid;
  memory_types?: string[];
  tags?: string[];
  is_favorite?: boolean;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'created_at' | 'last_accessed' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface MemoryCreateRequest {
  user_id: Uuid;
  folder_id?: Uuid;
  title?: string;
  memory_type: string;
  content: Record<string, any>;
  context_tags: string[];
  metadata?: Record<string, any>;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_private?: boolean;
  is_encrypted?: boolean;
  session_id?: string;
  parent_memory_id?: Uuid;
}

export interface MemoryUpdateRequest {
  id: Uuid;
  user_id: Uuid;
  folder_id?: Uuid;
  title?: string;
  content?: Record<string, any>;
  context_tags?: string[];
  metadata?: Record<string, any>;
  is_private?: boolean;
  is_encrypted?: boolean;
  is_favorite?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface MemoryLink {
  id: Uuid;
  user_id: Uuid;
  source_memory_id: Uuid;
  target_memory_id: Uuid;
  link_type: string;
  strength: number;
  bidirectional: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MemoryTag {
  id: Uuid;
  user_id: Uuid;
  name: string;
  color?: string;
  usage_count: number;
  created_at: string;
}