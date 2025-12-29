import { TaskDefinition, TaskMode, TaskCategory, CompletionCriterion, TaskAuditEvent, UserTaskProgress, PointUnlockRule, PointUnlockType } from './TaskTypes';

function nowIso(): string {
  return new Date().toISOString();
}

export function validateTaskNonExecuting(task: TaskDefinition): { valid: boolean; reason?: string } {
  if (task.mode !== 'symbolic' && task.mode !== 'assisted') return { valid: false, reason: 'invalid_mode' };
  if (!Array.isArray(task.completionCriteria) || task.completionCriteria.length === 0) return { valid: false, reason: 'missing_criteria' };
  for (const c of task.completionCriteria) {
    if (c.type === 'view' || c.type === 'preview' || c.type === 'compare' || c.type === 'explain') continue;
    return { valid: false, reason: 'unsupported_criterion' };
  }
  return { valid: true };
}

export function isPointsNonCurrency(points: number): boolean {
  if (!Number.isFinite(points) || points < 0) return false;
  return true;
}

export function validateUnlockRule(rule: PointUnlockRule): { valid: boolean; reason?: string } {
  const allowed: Set<PointUnlockType> = new Set(['preview_access', 'discount', 'subscription_reduction', 'cosmetic']);
  if (!allowed.has(rule.type)) return { valid: false, reason: 'unsupported_unlock' };
  return { valid: true };
}

export function buildTaskAudit(userHash: string, taskId: string, category: TaskCategory): TaskAuditEvent {
  return {
    id: `task-${Date.now().toString(36)}`,
    timestamp: nowIso(),
    event: 'task_completed',
    userHash,
    taskId,
    category
  };
}

export function canCompleteTask(task: TaskDefinition, proofs: CompletionCriterion[]): { allowed: boolean; reason?: string } {
  const val = validateTaskNonExecuting(task);
  if (!val.valid) return { allowed: false, reason: val.reason };
  const set = new Set(task.completionCriteria.map(c => c.type));
  for (const p of proofs) {
    if (!set.has(p.type)) return { allowed: false, reason: 'criterion_mismatch' };
  }
  return { allowed: true };
}

export function applyTaskCompletion(progress: UserTaskProgress, task: TaskDefinition): UserTaskProgress {
  const completed = new Set(progress.completedTaskIds);
  if (!completed.has(task.taskId)) {
    completed.add(task.taskId);
  }
  const points = progress.points + task.rewardPoints;
  return { ...progress, completedTaskIds: Array.from(completed), points };
}
