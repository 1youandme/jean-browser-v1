import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { PermissionRequestData, EnhancedPermission, PermissionAlert, PermissionTemplate } from '../types/jean-permissions';

interface PermissionManagerProps {
  userId: string;
  onRequestComplete?: (request: PermissionRequestData) => void;
}

interface PermissionManagerState {
  permissions: EnhancedPermission[];
  requests: PermissionRequestData[];
  alerts: PermissionAlert[];
  templates: PermissionTemplate[];
  activeTab: 'permissions' | 'requests' | 'alerts' | 'analytics';
  isLoading: boolean;
  error?: string;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ userId, onRequestComplete }) => {
  const [state, setState] = useState<PermissionManagerState>({
    permissions: [],
    requests: [],
    alerts: [],
    templates: [],
    activeTab: 'permissions',
    isLoading: false,
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<EnhancedPermission | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [permissions, requests, alerts, templates, analytics] = await Promise.all([
        invoke<EnhancedPermission[]>('jean_permissions_enhanced_get_user_permissions', { userId }),
        invoke<PermissionRequestData[]>('jean_permissions_enhanced_get_user_requests', { userId }),
        invoke<PermissionAlert[]>('jean_permissions_enhanced_get_user_alerts', { userId, unreadOnly: false }),
        invoke<PermissionTemplate[]>('jean_permissions_enhanced_get_permission_templates'),
        invoke('jean_permissions_enhanced_get_usage_analytics', { userId, daysBack: 30 }),
      ]);

      setState(prev => ({
        ...prev,
        permissions,
        requests,
        alerts,
        templates,
        isLoading: false,
      }));

      setUsageAnalytics(analytics);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `Failed to load data: ${error}`,
      }));
    }
  };

  const grantPermission = async (request: PermissionRequestData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await invoke('jean_permissions_enhanced_grant_permission', {
        userId: request.user_id,
        permissionType: request.requested_permission_type,
        scope: request.requested_scope,
        resourceId: request.requested_resource_id,
        maxAmount: null,
        maxUsage: 100,
        timeLimitMinutes: 60,
        description: request.reason,
        grantedBy: userId,
        expiresAt: null,
      });

      // Update request status
      await invoke('jean_permissions_enhanced_update_request_status', {
        requestId: request.id,
        status: 'approved',
        reviewedBy: userId,
        reviewNotes: 'Approved by user',
      });

      onRequestComplete?.(request);
      await loadData();
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to grant permission: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const denyPermission = async (request: PermissionRequestData, reason: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await invoke('jean_permissions_enhanced_update_request_status', {
        requestId: request.id,
        status: 'denied',
        reviewedBy: userId,
        reviewNotes: reason,
      });

      onRequestComplete?.(request);
      await loadData();
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to deny permission: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const revokePermission = async (permissionId: string, reason?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await invoke('jean_permissions_enhanced_revoke_permission', {
        permissionId,
        userId,
        reason,
      });

      await loadData();
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to revoke permission: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const applyTemplate = async (templateId: string, templateName: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const count = await invoke('jean_permissions_enhanced_create_from_template', {
        userId,
        templateName,
        grantedBy: userId,
        expiresAt: null,
      });

      console.log(`Applied ${count} permissions from template ${templateName}`);
      await loadData();
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to apply template: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getPermissionTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'filesystem_read': '📁 File System Read',
      'filesystem_write': '✏️ File System Write',
      'filesystem_delete': '🗑️ File System Delete',
      'browser_navigation': '🌐 Browser Navigation',
      'browser_tab_management': '📑 Tab Management',
      'browser_download': '⬇️ Download Files',
      'proxy_control': '🔗 Proxy Control',
      'ecommerce_view': '🛍️ E-commerce View',
      'ecommerce_edit': '✏️ E-commerce Edit',
      'ecommerce_pricing': '💰 Pricing Management',
      'ecommerce_orders': '📦 Order Management',
      'video_jobs_create': '🎬 Create Video Jobs',
      'video_jobs_execute': '▶️ Execute Video Jobs',
      'system_control': '⚙️ System Control',
      'docker_management': '🐳 Docker Management',
      'user_management': '👥 User Management',
      'security_admin': '🔒 Security Admin',
      'memory_read': '🧠 Memory Read',
      'memory_write': '✏️ Memory Write',
    };
    return typeMap[type] || type;
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'expired': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'denied': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderPermissions = () => (
    <div className="space-y-6">
      {/* Permission Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.templates.filter(t => !t.is_system_template).map(template => (
            <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <button
                onClick={() => applyTemplate(template.id, template.name)}
                disabled={state.isLoading}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Apply Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Permissions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Permissions</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.permissions.map(permission => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{getPermissionTypeDisplay(permission.permission_type)}</div>
                    {permission.description && (
                      <div className="text-sm text-gray-500">{permission.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('active')}`}>
                      {permission.scope}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(permission.risk_level)}`}>
                      {permission.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.usage_count}{permission.max_usage ? `/${permission.max_usage}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permission.expires_at 
                      ? new Date(permission.expires_at).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedPermission(permission)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => revokePermission(permission.id, 'User revoked')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.permissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active permissions found
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Permission Requests</h3>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          New Request
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {state.requests.map(request => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{getPermissionTypeDisplay(request.requested_permission_type)}</div>
                  <div className="text-sm text-gray-500">{request.requested_scope}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {request.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(request.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => grantPermission(request)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter reason for denial:');
                          if (reason) denyPermission(request, reason);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deny
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.requests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No permission requests found
          </div>
        )}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Permission Alerts</h3>
      <div className="space-y-3">
        {state.alerts.map(alert => (
          <div key={alert.id} className={`border rounded-lg p-4 ${
            alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
            alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
            alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{alert.message}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {alert.alert_type} • {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getRiskLevelColor(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
      {state.alerts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No alerts found
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Usage Analytics</h3>
      
      {usageAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Usage by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Usage by Permission Type</h4>
            <div className="space-y-2">
              {usageAnalytics.usage_by_type?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{item.permission_type}</span>
                  <span className="text-sm font-medium">{item.usage_count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-medium mb-4">Success Rates</h4>
            <div className="space-y-2">
              {usageAnalytics.usage_by_type?.map((item: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>{item.permission_type}</span>
                    <span>{(item.success_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.success_rate * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'permissions', label: 'Permissions', count: state.permissions.length },
    { id: 'requests', label: 'Requests', count: state.requests.filter(r => r.status === 'pending').length },
    { id: 'alerts', label: 'Alerts', count: state.alerts.filter(a => !a.is_read).length },
    { id: 'analytics', label: 'Analytics', count: 0 },
  ];

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Permission Manager</h1>
        <p className="text-gray-600">Manage Jean's permissions and access control</p>
      </div>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600">{state.error}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
            className={`px-4 py-2 font-medium transition-colors relative ${
              state.activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {state.activeTab === 'permissions' && renderPermissions()}
        {state.activeTab === 'requests' && renderRequests()}
        {state.activeTab === 'alerts' && renderAlerts()}
        {state.activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Permission Details Modal */}
      {selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Permission Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Type:</span> {getPermissionTypeDisplay(selectedPermission.permission_type)}
              </div>
              <div>
                <span className="font-medium">Scope:</span> {selectedPermission.scope}
              </div>
              <div>
                <span className="font-medium">Risk Level:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getRiskLevelColor(selectedPermission.risk_level)}`}>
                  {selectedPermission.risk_level}
                </span>
              </div>
              <div>
                <span className="font-medium">Usage:</span> {selectedPermission.usage_count}{selectedPermission.max_usage ? `/${selectedPermission.max_usage}` : ''}
              </div>
              <div>
                <span className="font-medium">Granted:</span> {new Date(selectedPermission.granted_at).toLocaleString()}
              </div>
              {selectedPermission.expires_at && (
                <div>
                  <span className="font-medium">Expires:</span> {new Date(selectedPermission.expires_at).toLocaleString()}
                </div>
              )}
              {selectedPermission.description && (
                <div>
                  <span className="font-medium">Description:</span> {selectedPermission.description}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => revokePermission(selectedPermission.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Revoke
              </button>
              <button
                onClick={() => setSelectedPermission(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;