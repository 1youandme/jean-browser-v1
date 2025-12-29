/**
 * ExtensionSandbox.ts
 * 
 * Provides a secure, revocable environment for browser extensions.
 * - Enforces "Extension Ecosystem" rules:
 *   - Must declare capabilities.
 *   - Must run sandboxed (simulated via strict interface).
 *   - Must be revocable instantly.
 * 
 * - Supports Local Device Extensions:
 *   - Local file access (gated)
 *   - Emulators (gated)
 *   - Device simulators (gated)
 */

export type ExtensionCapability = 
  | 'local_file_read' 
  | 'local_file_write' 
  | 'network_proxy' 
  | 'emulator_control' 
  | 'device_simulation'
  | 'dom_read' 
  | 'dom_write';

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  requiredCapabilities: ExtensionCapability[];
}

export interface RunningExtension {
  manifest: ExtensionManifest;
  status: 'active' | 'suspended' | 'terminated';
  grantedCapabilities: Set<ExtensionCapability>;
  sandboxId: string;
  // In a real implementation, this would be a Worker or iframe reference
  instance: any; 
}

export class ExtensionSandbox {
  private extensions: Map<string, RunningExtension>;

  constructor() {
    this.extensions = new Map();
  }

  /**
   * Installs an extension but does NOT grant permissions automatically.
   */
  public install(manifest: ExtensionManifest): void {
    if (this.extensions.has(manifest.id)) {
      throw new Error(`Extension ${manifest.id} is already installed.`);
    }

    this.extensions.set(manifest.id, {
      manifest,
      status: 'suspended',
      grantedCapabilities: new Set(),
      sandboxId: `sandbox_${Date.now()}_${manifest.id}`,
      instance: null
    });
  }

  /**
   * Explicit Permission Gate.
   * User must approve each capability.
   */
  public grantPermission(extensionId: string, capability: ExtensionCapability): void {
    const ext = this.extensions.get(extensionId);
    if (!ext) throw new Error(`Extension ${extensionId} not found.`);

    if (!ext.manifest.requiredCapabilities.includes(capability)) {
      throw new Error(`Extension ${extensionId} does not declare capability ${capability}.`);
    }

    ext.grantedCapabilities.add(capability);
  }

  /**
   * Instant Revocation.
   * If a critical capability is revoked, the extension is terminated.
   */
  public revokePermission(extensionId: string, capability: ExtensionCapability): void {
    const ext = this.extensions.get(extensionId);
    if (!ext) return;

    if (ext.grantedCapabilities.has(capability)) {
      ext.grantedCapabilities.delete(capability);
      
      // If the extension is running and relies on this, we might need to kill it
      if (ext.status === 'active') {
        this.terminate(extensionId, `Permission ${capability} revoked.`);
      }
    }
  }

  /**
   * Runs the extension in a "sandbox".
   * Checks if all required permissions are granted (or handles partial grants).
   */
  public async run(extensionId: string, context: any): Promise<void> {
    const ext = this.extensions.get(extensionId);
    if (!ext) throw new Error(`Extension ${extensionId} not found.`);

    if (ext.status === 'terminated') {
      throw new Error(`Extension ${extensionId} is terminated.`);
    }

    // Check if we have minimum viable permissions? 
    // For this strict model, we might enforce ALL declared required capabilities 
    // or rely on the extension to handle missing ones. 
    // Here we strictly check if at least one requested capability is granted if any are required.
    if (ext.manifest.requiredCapabilities.length > 0 && ext.grantedCapabilities.size === 0) {
      throw new Error(`Extension ${extensionId} has no granted permissions.`);
    }

    ext.status = 'active';
    
    // In a real system, we would spin up a Web Worker here.
    // console.log(`[Sandbox] Running ${ext.manifest.name} in ${ext.sandboxId}`);
  }

  /**
   * All capability invocations must pass through the OSExecutionBridge.
   */
  public async invokeCapability(
    extensionId: string,
    capability: ExtensionCapability,
    target: string,
    contract: import('../runtime/ExecutionContextTypes').ExecutionContract,
    confirmationToken: string
  ): Promise<void> {
    const ext = this.extensions.get(extensionId);
    if (!ext) throw new Error(`Extension ${extensionId} not found.`);
    if (!ext.grantedCapabilities.has(capability)) {
      throw new Error(`Capability ${capability} not granted for ${extensionId}.`);
    }
    const route: import('../runtime/ExecutionContextTypes').ExecutionRouteResult = {
      accepted: true,
      reason: 'extension',
      contextId: contract.contextId,
      mode: 'symbolic',
      audit: {
        id: `route-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        event: 'extension_route',
        contextId: contract.contextId
      }
    };
    const intent: import('../os/OSActionTypes').OSIntent = {
      action: (await import('../os/OSActionTypes')).OSActionType.system_query,
      target,
      timestamp: new Date().toISOString()
    };
    const OSExecutionBridge = (await import('../os/OSExecutionBridge')).OSExecutionBridge;
    await OSExecutionBridge.execute(route, intent, {
      confirmationToken,
      expectedContext: contract.contextId,
      workspaceId: 'unknown',
      userId: undefined,
      contract
    });
  }

  /**
   * Kill switch.
   */
  public terminate(extensionId: string, reason: string = 'User request'): void {
    const ext = this.extensions.get(extensionId);
    if (!ext) return;

    ext.status = 'terminated';
    ext.instance = null; // Drop reference to GC
    ext.grantedCapabilities.clear();
    const createExecutionAudit = require('../os/ExecutionAudit').createExecutionAudit;
    const OSActionType = require('../os/OSActionTypes').OSActionType;
    createExecutionAudit(
      OSActionType.system_query,
      `extension:${extensionId}:terminate`,
      'success',
      'web',
      undefined,
      { eventType: 'extension_capabilities_revoked', reason }
    );
    // console.log(`[Sandbox] Terminated ${ext.manifest.name}: ${reason}`);
  }

  /**
   * Returns the list of installed extensions and their status for UI.
   */
  public getInstalledExtensions(): RunningExtension[] {
    return Array.from(this.extensions.values());
  }
}
