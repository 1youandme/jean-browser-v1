export type TaskCategory = 'educational' | 'discovery';
export type TaskMode = 'symbolic' | 'assisted';

export interface CompletionCriterion {
  type: 'view' | 'preview' | 'compare' | 'explain';
  target?: string;
  details?: Record<string, unknown>;
}

export interface TaskDefinition {
  taskId: string;
  category: TaskCategory;
  description: string;
  mode: TaskMode;
  completionCriteria: CompletionCriterion[];
  rewardPoints: number;
  explanationText: string;
}

export interface TaskAuditEvent {
  id: string;
  timestamp: string;
  event: 'task_completed';
  userHash: string;
  taskId: string;
  category: TaskCategory;
}

export type PointUnlockType = 'preview_access' | 'discount' | 'subscription_reduction' | 'cosmetic';

export interface PointUnlockRule {
  type: PointUnlockType;
  value?: number;
  conditions?: Record<string, unknown>;
}

export interface UserTaskProgress {
  userHash: string;
  completedTaskIds: string[];
  points: number;
  unlocks: PointUnlockRule[];
}
