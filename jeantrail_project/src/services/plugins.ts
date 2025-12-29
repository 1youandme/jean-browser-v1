// Plugin System Service Interface and Implementation
export interface Plugin {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author?: string;
  manifest: PluginManifest;
  entryPoint?: string;
  permissions: string[];
  isActive: boolean;
  isSystem: boolean;
  installedAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords: string[];
  entry: string;
  permissions: PluginPermission[];
  apiVersion: string;
  minJeantrailVersion: string;
  maxJeantrailVersion?: string;
  dependencies: Record<string, string>;
  resources: PluginResources;
}

export interface PluginPermission {
  name: string;
  description: string;
  required: boolean;
}

export interface PluginResources {
  cssFiles: string[];
  jsFiles: string[];
  assets: string[];
  icons: PluginIcons;
}

export interface PluginIcons {
  icon16x16?: string;
  icon32x32?: string;
  icon48x48?: string;
  icon128x128?: string;
}

export interface UserPluginSettings {
  id: string;
  userId: string;
  pluginId: string;
  settings: Record<string, any>;
  isEnabled: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePluginRequest {
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author?: string;
  manifest: PluginManifest;
  entryPoint?: string;
  permissions: string[];
}

export interface UpdatePluginRequest {
  displayName?: string;
  description?: string;
  version?: string;
  manifest?: PluginManifest;
  entryPoint?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UpdateUserPluginSettingsRequest {
  settings: Record<string, any>;
  isEnabled: boolean;
}

export interface InstallPluginRequest {
  url: string;
  autoActivate: boolean;
}

export interface PluginCommand {
  action: string;
  parameters: Record<string, any>;
}

export interface ListPluginsQuery {
  isActive?: boolean;
  isSystem?: boolean;
  author?: string;
}

export interface PluginService {
  // Plugin management
  getPlugins: (query?: ListPluginsQuery) => Promise<Plugin[]>;
  getPlugin: (id: string) => Promise<Plugin>;
  createPlugin: (request: CreatePluginRequest) => Promise<Plugin>;
  updatePlugin: (id: string, request: UpdatePluginRequest) => Promise<Plugin>;
  deletePlugin: (id: string) => Promise<void>;
  activatePlugin: (id: string) => Promise<{ success: boolean; message: string }>;
  deactivatePlugin: (id: string) => Promise<{ success: boolean; message: string }>;
  
  // Plugin installation
  installPluginFromUrl: (request: InstallPluginRequest) => Promise<{ success: boolean; pluginId: string }>;
  validatePluginManifest: (manifest: PluginManifest) => Promise<{ valid: boolean; errors: string[] }>;
  
  // User plugin settings
  getUserPluginSettings: (userId: string, pluginId: string) => Promise<UserPluginSettings>;
  updateUserPluginSettings: (userId: string, pluginId: string, request: UpdateUserPluginSettingsRequest) => Promise<UserPluginSettings>;
  
  // Plugin execution
  executePluginCommand: (pluginId: string, userId: string, command: PluginCommand) => Promise<{
    success: boolean;
    result: string;
    commandId: string;
  }>;
  
  // Plugin API bridge
  bridgePluginApiRequest: (pluginId: string, userId: string, apiEndpoint: string, request: Record<string, any>) => Promise<{
    success: boolean;
    data: string;
  }>;
}

class PluginServiceImpl implements PluginService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async getPlugins(query?: ListPluginsQuery): Promise<Plugin[]> {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query?.isSystem !== undefined) params.append('isSystem', query.isSystem.toString());
    if (query?.author) params.append('author', query.author);

    const response = await fetch(`${this.baseUrl}/api/plugins?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch plugins: ${response.statusText}`);
    return response.json();
  }

  async getPlugin(id: string): Promise<Plugin> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch plugin: ${response.statusText}`);
    return response.json();
  }

  async createPlugin(request: CreatePluginRequest): Promise<Plugin> {
    const response = await fetch(`${this.baseUrl}/api/plugins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create plugin: ${response.statusText}`);
    return response.json();
  }

  async updatePlugin(id: string, request: UpdatePluginRequest): Promise<Plugin> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update plugin: ${response.statusText}`);
    return response.json();
  }

  async deletePlugin(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete plugin: ${response.statusText}`);
  }

  async activatePlugin(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${id}/activate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to activate plugin: ${response.statusText}`);
    return response.json();
  }

  async deactivatePlugin(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${id}/deactivate`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to deactivate plugin: ${response.statusText}`);
    return response.json();
  }

  async installPluginFromUrl(request: InstallPluginRequest): Promise<{ success: boolean; pluginId: string }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to install plugin: ${response.statusText}`);
    return response.json();
  }

  async validatePluginManifest(manifest: PluginManifest): Promise<{ valid: boolean; errors: string[] }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    if (!response.ok) throw new Error(`Failed to validate plugin manifest: ${response.statusText}`);
    return response.json();
  }

  async getUserPluginSettings(userId: string, pluginId: string): Promise<UserPluginSettings> {
    const response = await fetch(`${this.baseUrl}/api/plugins/users/${userId}/${pluginId}`);
    if (!response.ok) throw new Error(`Failed to fetch user plugin settings: ${response.statusText}`);
    return response.json();
  }

  async updateUserPluginSettings(userId: string, pluginId: string, request: UpdateUserPluginSettingsRequest): Promise<UserPluginSettings> {
    const response = await fetch(`${this.baseUrl}/api/plugins/users/${userId}/${pluginId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to update user plugin settings: ${response.statusText}`);
    return response.json();
  }

  async executePluginCommand(pluginId: string, userId: string, command: PluginCommand): Promise<{
    success: boolean;
    result: string;
    commandId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${pluginId}/users/${userId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    if (!response.ok) throw new Error(`Failed to execute plugin command: ${response.statusText}`);
    return response.json();
  }

  async bridgePluginApiRequest(pluginId: string, userId: string, apiEndpoint: string, request: Record<string, any>): Promise<{
    success: boolean;
    data: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/plugins/${pluginId}/users/${userId}/api/${apiEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to bridge plugin API request: ${response.statusText}`);
    return response.json();
  }
}

// Singleton instance
export const pluginService = new PluginServiceImpl();

// React hook
export const usePluginService = (): PluginService => {
  return pluginService;
};

// Plugin sandbox implementation
export class PluginSandbox {
  private pluginId: string;
  private userId: string;
  private allowedPermissions: string[];

  constructor(pluginId: string, userId: string, allowedPermissions: string[]) {
    this.pluginId = pluginId;
    this.userId = userId;
    this.allowedPermissions = allowedPermissions;
  }

  // Check if plugin has permission for specific action
  hasPermission(permission: string): boolean {
    return this.allowedPermissions.includes(permission);
  }

  // Safe API call wrapper
  async safeApiCall(apiEndpoint: string, data: Record<string, any>): Promise<any> {
    if (!this.hasPermission(`api.${apiEndpoint}`)) {
      throw new Error(`Plugin does not have permission for API endpoint: ${apiEndpoint}`);
    }

    return pluginService.bridgePluginApiRequest(this.pluginId, this.userId, apiEndpoint, data);
  }

  // Generate sandbox iframe URL
  getSandboxUrl(entryPoint: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/plugins/${this.pluginId}${entryPoint}?userId=${this.userId}&sandbox=true`;
  }
}

// Helper functions
export function createPluginSandbox(plugin: Plugin, userId: string): PluginSandbox {
  return new PluginSandbox(plugin.id, userId, plugin.permissions);
}

export function validatePluginPermission(permission: string): boolean {
  const validPermissions = [
    'jean.chat',
    'jean.actions',
    'tabs.read',
    'tabs.write',
    'proxy.read',
    'proxy.write',
    'files.read',
    'files.write',
    'network.request',
    'storage.read',
    'storage.write',
    'ui.panel',
    'ui.modal',
    'notifications.show',
  ];

  return validPermissions.includes(permission);
}

export function getPluginPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    'jean.chat': 'Access Jean AI chat functionality',
    'jean.actions': 'Execute Jean AI actions',
    'tabs.read': 'Read browser tab information',
    'tabs.write': 'Modify browser tabs',
    'proxy.read': 'Read proxy network status',
    'proxy.write': 'Control proxy network settings',
    'files.read': 'Read local files',
    'files.write': 'Write local files',
    'network.request': 'Make network requests',
    'storage.read': 'Read local storage data',
    'storage.write': 'Write local storage data',
    'ui.panel': 'Create UI panels',
    'ui.modal': 'Show modal dialogs',
    'notifications.show': 'Show notifications',
  };

  return descriptions[permission] || permission;
}

// Plugin development helpers
export function createPluginManifest(manifest: Partial<PluginManifest>): PluginManifest {
  return {
    name: manifest.name || '',
    version: manifest.version || '1.0.0',
    description: manifest.description,
    author: manifest.author,
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    keywords: manifest.keywords || [],
    entry: manifest.entry || 'index.html',
    permissions: manifest.permissions || [],
    apiVersion: manifest.apiVersion || 'v1',
    minJeantrailVersion: manifest.minJeantrailVersion || '1.0.0',
    maxJeantrailVersion: manifest.maxJeantrailVersion,
    dependencies: manifest.dependencies || {},
    resources: manifest.resources || {
      cssFiles: [],
      jsFiles: [],
      assets: [],
      icons: {},
    },
  };
}

export function generatePluginTemplate(name: string): CreatePluginRequest {
  const manifest = createPluginManifest({
    name: name.toLowerCase().replace(/\s+/g, '-'),
    displayName: name,
    description: `A ${name} plugin for JeanTrail`,
    version: '1.0.0',
    author: 'JeanTrail Plugin Developer',
    entry: '/index.html',
    permissions: [],
  });

  return {
    name: manifest.name,
    displayName: name,
    description: manifest.description,
    version: manifest.version,
    author: manifest.author,
    manifest,
    entryPoint: manifest.entry,
    permissions: [],
  };
}