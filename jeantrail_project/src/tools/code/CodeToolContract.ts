import { CodeTask, CodeResult } from './CodeToolTypes';

export function runCodeTool(task: CodeTask): CodeResult {
  if (task.kind !== 'app' && task.kind !== 'site' && task.kind !== 'game') {
    return { status: 'unsupported', reason: 'unsupported_task' };
  }
  return { status: 'symbolic', placeholder: 'no_execution' };
}

