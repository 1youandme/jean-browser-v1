import { ActionType } from '../action/ActionTypes';

export type ExecutionReceiptMode = 'symbolic' | 'real';
export type ExecutionReceiptStatus = 'success' | 'skipped' | 'blocked' | 'error';

export interface ExecutionReceipt {
  id: string;
  timestamp: string;
  mode: ExecutionReceiptMode;
  status: ExecutionReceiptStatus;
  action?: ActionType;
  toolId?: string;
  reversible: boolean;
  report?: string;
  data?: Record<string, unknown>;
}

export function createReceipt(
  mode: ExecutionReceiptMode,
  status: ExecutionReceiptStatus,
  opts?: {
    action?: ActionType;
    toolId?: string;
    reversible?: boolean;
    report?: string;
    data?: Record<string, unknown>;
  }
): ExecutionReceipt {
  const now = new Date().toISOString();
  const id = `rcpt-${Date.now().toString(36)}`;
  return {
    id,
    timestamp: now,
    mode,
    status,
    action: opts?.action,
    toolId: opts?.toolId,
    reversible: opts?.reversible ?? false,
    report: opts?.report,
    data: opts?.data
  };
}

