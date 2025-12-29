import { ExtensionCapability } from '../browser/ExtensionSandbox';

export interface BundleModuleRef {
  id: 'address_bar_agent' | 'tab_context_manager' | 'extension_sandbox';
  path: string;
  description: string;
}

export interface PrivacyDeclarations {
  noTracking: true;
  noDataExfiltration: true;
  noHiddenPermissions: true;
  userVisibleControls: true;
}

export interface BrowserExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  modules: BundleModuleRef[];
  declaredCapabilities: ExtensionCapability[]; // explicit only
  privacy: PrivacyDeclarations;
  allowedOrigins: string[]; // explicit host permissions, empty by default
}

export function validateManifest(manifest: BrowserExtensionManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1) Capability whitelist check
  const KNOWN: ExtensionCapability[] = [
    'local_file_read',
    'local_file_write',
    'network_proxy',
    'emulator_control',
    'device_simulation',
    'dom_read',
    'dom_write'
  ];
  const unknownCaps = manifest.declaredCapabilities.filter(c => !KNOWN.includes(c));
  if (unknownCaps.length > 0) {
    errors.push(`Unknown capabilities: ${unknownCaps.join(', ')}`);
  }

  // 2) Privacy declarations must all be true
  const p = manifest.privacy;
  if (!(p.noTracking && p.noDataExfiltration && p.noHiddenPermissions && p.userVisibleControls)) {
    errors.push('Privacy declarations must all be true.');
  }

  // 3) Modules paths must be explicit and present
  if (manifest.modules.length === 0) {
    errors.push('No modules declared for the bundle.');
  }
  for (const m of manifest.modules) {
    if (!m.path || !m.description) {
      errors.push(`Module ${m.id} is missing path or description.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export const JeanTrailBrowserExtensionManifest: BrowserExtensionManifest = {
  id: 'jeantrail-browser-extension',
  name: 'JeanTrail Browser Extension',
  version: '0.1.0',
  description: 'Privacy-first extension packaging JeanTrail browser modules with explicit, minimal capabilities.',
  modules: [
    {
      id: 'address_bar_agent',
      path: 'src/browser/AddressBarAgent.ts',
      description: 'Intent analyzer for URL semantics; privacy-aware.'
    },
    {
      id: 'tab_context_manager',
      path: 'src/browser/TabContextManager.ts',
      description: 'Tab sovereignty and session isolation manager.'
    },
    {
      id: 'extension_sandbox',
      path: 'src/browser/ExtensionSandbox.ts',
      description: 'Secure, revocable sandbox for local device extensions.'
    }
  ],
  // Minimal defaults; local device capabilities are granted via explicit gates at runtime
  declaredCapabilities: ['dom_read'],
  privacy: {
    noTracking: true,
    noDataExfiltration: true,
    noHiddenPermissions: true,
    userVisibleControls: true
  },
  allowedOrigins: [] // declare host permissions explicitly when needed
};

