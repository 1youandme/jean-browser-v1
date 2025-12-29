export enum OSActionType {
  file_open = 'file_open',
  file_write = 'file_write',
  app_launch = 'app_launch',
  clipboard_write = 'clipboard_write',
  system_query = 'system_query'
}

export type ExecutionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface OSActionDescriptor {
  type: OSActionType;
  requiredPermission: string;
  reversible: boolean;
  riskLevel: ExecutionRiskLevel;
  description: string;
}

export const OS_ACTION_DESCRIPTORS: Record<OSActionType, OSActionDescriptor> = {
  [OSActionType.file_open]: {
    type: OSActionType.file_open,
    requiredPermission: 'fs:read',
    reversible: true,
    riskLevel: 'low',
    description: 'Read file content from the local file system.'
  },
  [OSActionType.file_write]: {
    type: OSActionType.file_write,
    requiredPermission: 'fs:write',
    reversible: false,
    riskLevel: 'high',
    description: 'Write content to a file on the local file system.'
  },
  [OSActionType.app_launch]: {
    type: OSActionType.app_launch,
    requiredPermission: 'app:launch',
    reversible: false,
    riskLevel: 'medium',
    description: 'Launch an external application.'
  },
  [OSActionType.clipboard_write]: {
    type: OSActionType.clipboard_write,
    requiredPermission: 'clipboard:write',
    reversible: true,
    riskLevel: 'low',
    description: 'Write text to the system clipboard.'
  },
  [OSActionType.system_query]: {
    type: OSActionType.system_query,
    requiredPermission: 'system:read',
    reversible: true,
    riskLevel: 'low',
    description: 'Query system information (OS version, uptime, etc.).'
  }
};

export interface OSIntent {
  action: OSActionType;
  target: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}
