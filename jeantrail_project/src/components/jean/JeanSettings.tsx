import React, { useState, useEffect } from 'react';
import { Settings, Shield, Brain, Globe, Bell, Database } from 'lucide-react';
import { jeanCoreService } from '../../services/jean/jeanCore';

interface JeanSettingsProps {
  userId: string;
  onSettingsChange?: (settings: JeanUserSettings) => void;
}

interface JeanUserSettings {
  initiativeLevel: 'low' | 'medium' | 'high';
  language: string;
  theme: 'light' | 'dark' | 'auto';
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
  traAgentPreferences: TRAEAgentPreferences;
}

interface PrivacySettings {
  shareAnonymousData: boolean;
  storeConversations: boolean;
  allowMemoryAccess: boolean;
  privateFolders: string[];
  dataRetentionDays: number;
}

interface NotificationSettings {
  enableNotifications: boolean;
  actionConfirmations: boolean;
  errorAlerts: boolean;
  taskCompletions: boolean;
  securityAlerts: boolean;
}

interface TRAEAgentPreferences {
  enabledAgents: string[];
  autoInvokeThreshold: 'low' | 'medium' | 'high';
  preferredAgentProviders: Record<string, string>;
}

export const JeanSettings: React.FC<JeanSettingsProps> = ({
  userId,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<JeanUserSettings>({
    initiativeLevel: 'medium',
    language: 'en',
    theme: 'auto',
    privacySettings: {
      shareAnonymousData: true,
      storeConversations: true,
      allowMemoryAccess: true,
      privateFolders: [],
      dataRetentionDays: 90
    },
    notificationSettings: {
      enableNotifications: true,
      actionConfirmations: true,
      errorAlerts: true,
      taskCompletions: false,
      securityAlerts: true
    },
    traAgentPreferences: {
      enabledAgents: [],
      autoInvokeThreshold: 'medium',
      preferredAgentProviders: {}
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const userSettings = await jeanCoreService.getUserSettings(userId);
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Failed to load Jean settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await jeanCoreService.updateUserSettings(userId, settings);
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Failed to save Jean settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      initiativeLevel: 'medium',
      language: 'en',
      theme: 'auto',
      privacySettings: {
        shareAnonymousData: true,
        storeConversations: true,
        allowMemoryAccess: true,
        privateFolders: [],
        dataRetentionDays: 90
      },
      notificationSettings: {
        enableNotifications: true,
        actionConfirmations: true,
        errorAlerts: true,
        taskCompletions: false,
        securityAlerts: true
      },
      traAgentPreferences: {
        enabledAgents: [],
        autoInvokeThreshold: 'medium',
        preferredAgentProviders: {}
      }
    });
    setShowResetConfirm(false);
  };

  const updateSetting = <K extends keyof JeanUserSettings>(
    key: K,
    value: JeanUserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePrivacySetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, [key]: value }
    }));
  };

  const updateNotificationSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, [key]: value }
    }));
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'trae-agents', label: 'TRAE Agents', icon: Brain },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Globe }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jean Settings</h2>
            <p className="text-gray-600 mt-1">Configure your AI assistant preferences and permissions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex space-x-1 px-6 pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initiative Level
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Control how proactive Jean is in suggesting actions and improvements
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'low', label: 'Low', desc: 'Respond only when asked' },
                  { value: 'medium', label: 'Medium', desc: 'Periodic suggestions' },
                  { value: 'high', label: 'High', desc: 'Proactive assistance' }
                ].map(level => (
                  <label key={level.value} className="relative">
                    <input
                      type="radio"
                      name="initiative"
                      value={level.value}
                      checked={settings.initiativeLevel === level.value}
                      onChange={(e) => updateSetting('initiativeLevel', e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      settings.initiativeLevel === level.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-sm text-gray-500">{level.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'auto', label: 'Auto' }
                ].map(theme => (
                  <label key={theme.value} className="relative">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) => updateSetting('theme', e.target.value as any)}
                      className="sr-only"
                    />
                    <div className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                      settings.theme === theme.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      {theme.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Controls</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">Share Anonymous Usage Data</div>
                    <div className="text-sm text-gray-500">Help improve Jean by sharing anonymous usage statistics</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.shareAnonymousData}
                    onChange={(e) => updatePrivacySetting('shareAnonymousData', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">Store Conversation History</div>
                    <div className="text-sm text-gray-500">Keep a record of your conversations with Jean</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.storeConversations}
                    onChange={(e) => updatePrivacySetting('storeConversations', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">Allow Memory Access</div>
                    <div className="text-sm text-gray-500">Let Jean access stored memories for context</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacySettings.allowMemoryAccess}
                    onChange={(e) => updatePrivacySetting('allowMemoryAccess', e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention Period
              </label>
              <select
                value={settings.privacySettings.dataRetentionDays}
                onChange={(e) => updatePrivacySetting('dataRetentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                How long to keep conversation history and memory data
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Enable Notifications</div>
                  <div className="text-sm text-gray-500">Receive notifications from Jean</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.enableNotifications}
                  onChange={(e) => updateNotificationSetting('enableNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Action Confirmations</div>
                  <div className="text-sm text-gray-500">Get notified when actions need confirmation</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.actionConfirmations}
                  onChange={(e) => updateNotificationSetting('actionConfirmations', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Error Alerts</div>
                  <div className="text-sm text-gray-500">Receive notifications for errors and failures</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.errorAlerts}
                  onChange={(e) => updateNotificationSetting('errorAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Task Completions</div>
                  <div className="text-sm text-gray-500">Get notified when tasks are completed</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.taskCompletions}
                  onChange={(e) => updateNotificationSetting('taskCompletions', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Security Alerts</div>
                  <div className="text-sm text-gray-500">Important security-related notifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notificationSettings.securityAlerts}
                  onChange={(e) => updateNotificationSetting('securityAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'trae-agents' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">TRAE Agent Configuration</h3>
            <p className="text-gray-600">
              Configure which TRAE agents can be automatically invoked by Jean
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Invoke Threshold
              </label>
              <select
                value={settings.traAgentPreferences.autoInvokeThreshold}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  traAgentPreferences: {
                    ...prev.traAgentPreferences,
                    autoInvokeThreshold: e.target.value as any
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low - Conservative agent usage</option>
                <option value="medium">Medium - Balanced approach</option>
                <option value="high">High - Proactive agent assistance</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Data & Storage Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Memory Storage</h4>
                <p className="text-sm text-gray-500 mb-3">Conversation history and context data</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Memory Usage →
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Cache Data</h4>
                <p className="text-sm text-gray-500 mb-3">Temporary files and cached responses</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Clear Cache →
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
                <p className="text-sm text-gray-500 mb-3">Download your Jean data</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Export All Data →
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Delete Data</h4>
                <p className="text-sm text-gray-500 mb-3">Permanently remove your Jean data</p>
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  Delete All Data →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Advanced Configuration</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Developer Mode</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Enable advanced features for development and debugging
                </p>
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-yellow-900">Enable Developer Mode</span>
                </label>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">API Configuration</h4>
                <p className="text-sm text-gray-500 mb-3">Configure external API endpoints</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Configure APIs →
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Performance Settings</h4>
                <p className="text-sm text-gray-500 mb-3">Optimize Jean's performance and resource usage</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Performance Settings →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset to Defaults?</h3>
            <p className="text-gray-600 mb-6">
              This will reset all Jean settings to their default values. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetToDefaults}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};