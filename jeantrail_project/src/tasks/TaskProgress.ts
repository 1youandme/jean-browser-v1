import { UserTaskProgress, TaskDefinition, TaskAuditEvent, PointUnlockRule } from './TaskTypes';
import { buildTaskAudit, canCompleteTask, applyTaskCompletion, validateUnlockRule } from './TaskRules';

const progressStore: Map<string, UserTaskProgress> = new Map();

export function getUserProgress(userHash: string): UserTaskProgress {
  const existing = progressStore.get(userHash);
  if (existing) return existing;
  const init: UserTaskProgress = { userHash, completedTaskIds: [], points: 0, unlocks: [] };
  progressStore.set(userHash, init);
  return init;
}

export function completeTask(userHash: string, task: TaskDefinition, proofs: TaskDefinition['completionCriteria']): { progress: UserTaskProgress; audit: TaskAuditEvent } {
  const allowed = canCompleteTask(task, proofs);
  if (!allowed.allowed) {
    const audit: TaskAuditEvent = {
      id: `task-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      event: 'task_completed',
      userHash,
      taskId: task.taskId,
      category: task.category
    };
    return { progress: getUserProgress(userHash), audit };
  }
  const current = getUserProgress(userHash);
  const updated = applyTaskCompletion(current, task);
  progressStore.set(userHash, updated);
  const audit = buildTaskAudit(userHash, task.taskId, task.category);
  return { progress: updated, audit };
}

export function addUnlock(userHash: string, rule: PointUnlockRule): UserTaskProgress {
  const val = validateUnlockRule(rule);
  const current = getUserProgress(userHash);
  if (!val.valid) return current;
  const unlocks = current.unlocks.slice();
  unlocks.push(rule);
  const updated = { ...current, unlocks };
  progressStore.set(userHash, updated);
  return updated;
}
