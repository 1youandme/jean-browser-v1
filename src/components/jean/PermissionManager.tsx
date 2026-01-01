import React, { useState, useEffect } from 'react';
import { Shield, Plus, Clock, AlertCircle, Check, X, Settings } from 'lucide-react';
import { jeanPermissionsService } from '../../services/jean/permissions';

interface PermissionManagerProps {
  userId: string;
}

interface Permission {
  id: string;
  actionType: string;
  scope: string;
  maxAmount?: number;
  maxUsage?: number;
  usageCount: number;
  expiresAt: string;
  grantedAt: string;
  description: string;
  isActive: boolean;
}

interface PermissionTemplate {
  name: string;
  description: string;
  actionType: string;
  defaultDuration: number;
  requiresCustomization: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({ userId }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customParams, setCustomParams] = useState<Record<string, any>>({});
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const permissionTemplates: PermissionTemplate[] = [
    {
      name: 'File Manager',
      description: 'File management operations (copy, move, rename)',
      actionType: 'file_operations',
      defaultDuration: 24,
      requiresCustomization: false
    },
    {
      name: 'Purchasing Agent',
      description: 'Financial transactions and purchases',
      actionType: 'financial_transaction',
      defaultDuration: 168,
      requiresCustomization: true
    },
    {
      name: 'System Administrator',
      description: 'System operations (Docker, services)',
      actionType: 'system_operations',
      defaultDuration: 4,
      requiresCustomization: false
    },
    {
      name: 'Browser Controller',
      description: 'Advanced browser controls and automation',
      actionType: 'browser_control',
      defaultDuration: 12,
      requiresCustomization: false
    }
  ];

  useEffect(() => {
    loadPermissions();
  }, [userId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const userPermissions = await jeanPermissionsService.listUserPermissions(userId);
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantPermission = async (templateName: string, params: Record<string, any> = {}) => {
    try {
      await jeanPermissionsService.grantPermissionTemplate(userId, templateName, params);
      setShowGrantModal(false);
      setSelectedTemplate('');
      setCustomParams({});
      loadPermissions();
    } catch (error) {
      console.error('Failed to grant permission:', error);
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      await jeanPermissionsService.revokePermission(permissionId, userId);
      loadPermissions();
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    }
  };

  const renewPermission = async (permissionId: string) => {
    setRenewingId(permissionId);
    try {
      await jeanPermissionsService.renewPermission(permissionId, userId);
      loadPermissions();
    } catch (error) {
      console.error('Failed to renew permission:', error);
    } finally {
      setRenewingId(null);
    }
  };

  const getStatusColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 2) return 'text-red-600 bg-red-50 border-red-200';
    if (hoursUntilExpiry < 24) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 1) return 'Expires soon';
    if (hoursUntilExpiry < 24) return `Expires in ${Math.floor(hoursUntilExpiry)}h`;
    return `Expires in ${Math.floor(hoursUntilExpiry / 24)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Permission Manager</h2>
          <p className="text-gray-600 mt-1">Manage Jean's permissions and access controls</p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Grant Permission</span>
        </button>
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Permissions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Permissions that Jean currently has access to
          </p>
        </div>

        {permissions.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Permissions</h3>
            <p className="text-gray-500 mb-4">
              Jean doesn't have any special permissions beyond default capabilities
            </p>
            <button
              onClick={() => setShowGrantModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Grant First Permission
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {permissions.map((permission) => (
              <div key={permission.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {permission.actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(permission.expiresAt)}`}>
                        {getStatusText(permission.expiresAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{permission.description}</p>
                    
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Scope:</span>
                        <span className="ml-2 font-medium">{permission.scope}</span>
                      </div>
                      {permission.maxAmount && (
                        <div>
                          <span className="text-gray-500">Max Amount:</span>
                          <span className="ml-2 font-medium">${permission.maxAmount}</span>
                        </div>
                      )}
                      {permission.maxUsage && (
                        <div>
                          <span className="text-gray-500">Usage:</span>
                          <span className="ml-2 font-medium">
                            {permission.usageCount}/{permission.maxUsage}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Expires:</span>
                        <span className="ml-2 font-medium">
                          {new Date(permission.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {permission.maxUsage && permission.usageCount > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">Usage Progress</span>
                          <span className="font-medium">
                            {Math.round((permission.usageCount / permission.maxUsage) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              permission.usageCount / permission.maxUsage > 0.8
                                ? 'bg-red-600'
                                : permission.usageCount / permission.maxUsage > 0.5
                                ? 'bg-yellow-600'
                                : 'bg-green-600'
                            }`}
                            style={{
                              width: `${Math.min((permission.usageCount / permission.maxUsage) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => renewPermission(permission.id)}
                      disabled={renewingId === permission.id}
                      className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      title="Renew Permission"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => revokePermission(permission.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Revoke Permission"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permission Templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Templates</h3>
          <p className="text-sm text-gray-500 mt-1">
            Pre-configured permission sets for common use cases
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionTemplates.map((template) => (
              <div
                key={template.name}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Duration: {template.defaultDuration}h</span>
                      {template.requiresCustomization && (
                        <span className="flex items-center">
                          <Settings className="h-3 w-3 mr-1" />
                          Customizable
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template.name);
                      if (template.requiresCustomization) {
                        setCustomParams({});
                      } else {
                        grantPermission(template.name);
                      }
                    }}
                    className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Grant
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grant Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grant Permission</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a template...</option>
                  {permissionTemplates.map(template => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {permissionTemplates.find(t => t.name === selectedTemplate)?.description}
                  </p>
                </div>
              )}

              {selectedTemplate && 
                permissionTemplates.find(t => t.name === selectedTemplate)?.requiresCustomization && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Amount ($)
                      </label>
                      <input
                        type="number"
                        value={customParams.maxAmount || ''}
                        onChange={(e) => setCustomParams(prev => ({
                          ...prev,
                          maxAmount: parseFloat(e.target.value) || undefined
                        }))}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Transactions
                      </label>
                      <input
                        type="number"
                        value={customParams.maxTransactions || ''}
                        onChange={(e) => setCustomParams(prev => ({
                          ...prev,
                          maxTransactions: parseInt(e.target.value) || undefined
                        }))}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={customParams.durationHours || ''}
                        onChange={(e) => setCustomParams(prev => ({
                          ...prev,
                          durationHours: parseInt(e.target.value) || 168
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )
              }
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedTemplate('');
                  setCustomParams({});
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedTemplate) {
                    grantPermission(selectedTemplate, customParams);
                  }
                }}
                disabled={!selectedTemplate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Grant Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};