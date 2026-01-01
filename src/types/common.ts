// Common utility types used across Jean modules

export type Uuid = string; // Simplified UUID type for frontend

export type DateTime = string; // ISO 8601 date string

export type Decimal = string; // String representation of decimal numbers

// Generic database entity base
export interface BaseEntity {
  id: Uuid;
  created_at: DateTime;
  updated_at: DateTime;
}

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Sort options
export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic search interface
export interface SearchRequest extends SortOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

// User reference
export interface UserRef {
  id: Uuid;
  username?: string;
  email?: string;
}

// File attachment interface
export interface FileAttachment {
  id: Uuid;
  name: string;
  path: string;
  size: number;
  mime_type?: string;
  url?: string;
}

// Metadata interface
export interface Metadata extends Record<string, any> {
  tags?: string[];
  category?: string;
  priority?: number;
  source?: string;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// WebSocket message interface
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: DateTime;
  id?: Uuid;
}

// Enum types for common values
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AccessLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};