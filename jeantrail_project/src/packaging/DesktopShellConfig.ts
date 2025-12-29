import { JeanKernel } from '../kernel/JeanKernel';
import { ExecutionContextId } from '../runtime/ExecutionContextTypes';

export type ShellPrivilege = 'fs_read' | 'fs_write' | 'process_launch' | 'clipboard' | 'network';

export interface DesktopShellConfig {
  kernel: JeanKernel;
  contexts: ExecutionContextId[];
  privileges: ShellPrivilege[];
  allowOSExecution: boolean;
  sandboxed: boolean;
}

export function createDefaultDesktopShellConfig(kernel: JeanKernel): DesktopShellConfig {
  return {
    kernel,
    contexts: ['local'],
    privileges: [],
    allowOSExecution: false,
    sandboxed: true
  };
}

export function withPrivileges(config: DesktopShellConfig, privileges: ShellPrivilege[]): DesktopShellConfig {
  return {
    ...config,
    privileges: Array.from(new Set([...config.privileges, ...privileges]))
  };
}

export function enableOSExecution(config: DesktopShellConfig): DesktopShellConfig {
  return { ...config, allowOSExecution: true };
}

export function disableOSExecution(config: DesktopShellConfig): DesktopShellConfig {
  return { ...config, allowOSExecution: false };
}

