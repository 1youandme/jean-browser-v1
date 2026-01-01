import { GovernanceTag } from '../../types';

/**
 * JEAN HARDWARE ABSTRACTION LAYER (HAL)
 * 
 * Philosophy: Hardware is a privilege, not a right.
 * The OS does not grant direct driver access to apps.
 * It grants access to "Capabilities" which are mediated by the Governance Engine.
 */

export type HardwareModuleType = 
  | 'compute_core'       // CPU/NPU
  | 'visual_sensor'      // Camera/Lidar
  | 'audio_sensor'       // Mic
  | 'radio_interface'    // 5G/WiFi/BT
  | 'location_provider'  // GPS/Galileo
  | 'secure_element'     // HSM/TPM
  | 'display_surface';   // Screen/Projector

export type ModuleStatus = 
  | 'physically_disconnected' // Removed by user
  | 'hardware_switch_off'     // Kill switch engaged
  | 'software_disabled'       // OS policy blocked
  | 'active_idle'             // Ready, low power
  | 'active_processing';      // In use

/**
 * A physical modular component that can be swapped or upgraded.
 */
export interface ModularComponent {
  id: string; // Unique Serial (e.g., UUID from hardware ROM)
  type: HardwareModuleType;
  manufacturer: string;
  firmwareVersion: string;
  
  // The capabilities this module provides
  capabilities: string[];
  
  // Hardware-enforced constraints
  isHotSwappable: boolean;
  hasPhysicalKillSwitch: boolean;
  
  // Trust level of the hardware itself
  supplyChainProof?: string; // Signed attestation of origin
}

/**
 * The Governance Interface for Hardware
 * Every hardware request must pass through this gate.
 */
export interface HardwareGovernanceGate {
  /**
   * Request access to a hardware module.
   * @param appId The application requesting access
   * @param moduleType The type of hardware needed
   * @param intent Why is this needed? (User visible string)
   * @param durationMs How long? (Time bound access)
   */
  requestAccess(
    appId: string, 
    moduleType: HardwareModuleType, 
    intent: string, 
    durationMs: number
  ): Promise<HardwareAccessGrant>;

  /**
   * Revoke access immediately (e.g., user pressed a button)
   */
  emergencyRevoke(moduleType: HardwareModuleType): void;
}

export interface HardwareAccessGrant {
  grantToken: string;
  expiresAt: number;
  module: ModularComponent;
  // Limitations on the raw stream (e.g., blurred video, reduced sample rate)
  dataFilters: GovernanceTag[]; 
}

/**
 * OS-Kernel Interaction Model
 * The Kernel maintains the "Registry of Truth" about what hardware exists.
 */
export interface HardwareRegistry {
  modules: Map<string, ModularComponent>;
  
  registerModule(component: ModularComponent): void;
  reportStatusChange(componentId: string, status: ModuleStatus): void;
  
  // Verify that the hardware hasn't been tampered with
  performAttestation(componentId: string): Promise<boolean>;
}
