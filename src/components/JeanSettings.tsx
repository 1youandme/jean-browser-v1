import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { JeanLanguagePreferences, JeanLanguage, JeanDialect } from '../types/jean-multilingual';

interface JeanSettingsProps {
  userId: string;
  onSettingsChange?: (settings: JeanSettingsState) => void;
}

interface JeanSettingsState {
  // Language settings
  language: {
    primary: JeanLanguage;
    primaryDialect?: string;
    ui: JeanLanguage;
    uiDialect?: string;
    speech: JeanLanguage;
    speechDialect?: string;
  };
  
  // Voice settings
  voice: {
    tone: string;
    rate: number;
    pitch: number;
  };
  
  // Behavior settings
  behavior: {
    formalityLevel: string;
    greetingStyle: string;
    useLocalExpressions: boolean;
    respectCulturalNuances: boolean;
  };
  
  // Interface settings
  interface: {
    autoTranslate: boolean;
    showOriginalText: boolean;
    translationThreshold: number;
    timezone: string;
  };
  
  // Avatar settings
  avatar: {
    modelUrl: string;
    voiceId: string;
    autoBlink: boolean;
    responsiveness: number;
  };
  
  // Permissions
  permissions: {
    autoApproveLowRisk: boolean;
    confirmHighRisk: boolean;
    showPermissionHistory: boolean;
  };
  
  // Memory settings
  memory: {
    autoSave: boolean;
    maxMemorySize: number;
    retentionDays: number;
  };
}

const JeanSettings: React.FC<JeanSettingsProps> = ({ userId, onSettingsChange }) => {
  const [settings, setSettings] = useState<JeanSettingsState>({
    language: {
      primary: JeanLanguage.English,
      ui: JeanLanguage.English,
      speech: JeanLanguage.English,
    },
    voice: {
      tone: 'neutral',
      rate: 1.0,
      pitch: 1.0,
    },
    behavior: {
      formalityLevel: 'neutral',
      greetingStyle: 'standard',
      useLocalExpressions: false,
      respectCulturalNuances: true,
    },
    interface: {
      autoTranslate: false,
      showOriginalText: false,
      translationThreshold: 0.8,
      timezone: 'UTC',
    },
    avatar: {
      modelUrl: '/models/jean_avatar.glb',
      voiceId: 'jean_default',
      autoBlink: true,
      responsiveness: 0.8,
    },
    permissions: {
      autoApproveLowRisk: false,
      confirmHighRisk: true,
      showPermissionHistory: true,
    },
    memory: {
      autoSave: true,
      maxMemorySize: 1000,
      retentionDays: 90,
    },
  });

  const [availableLanguages, setAvailableLanguages] = useState<Map<JeanLanguage, JeanDialect[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('language');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadAvailableLanguages();
  }, [userId]);

  // Notify parent of settings changes
  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const prefs = await invoke<JeanLanguagePreferences>('jean_multilingual_get_preferences', { userId });
      
      setSettings(prev => ({
        ...prev,
        language: {
          primary: prefs.primary_language,
          primaryDialect: prefs.primary_dialect || undefined,
          ui: prefs.ui_language,
          uiDialect: prefs.ui_dialect || undefined,
          speech: prefs.speech_language,
          speechDialect: prefs.speech_dialect || undefined,
        },
        voice: {
          tone: prefs.voice_tone,
          rate: prefs.speech_rate,
          pitch: prefs.speech_pitch,
        },
        behavior: {
          formalityLevel: prefs.formality_level,
          greetingStyle: prefs.greeting_style,
          useLocalExpressions: prefs.use_local_expressions,
          respectCulturalNuances: prefs.respect_cultural_nuances,
        },
        interface: {
          autoTranslate: prefs.auto_translate_responses,
          showOriginalText: prefs.show_original_text,
          translationThreshold: prefs.translation_confidence_threshold,
          timezone: prefs.timezone,
        },
      }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableLanguages = async () => {
    try {
      const languages = await invoke('jean_multilingual_get_supported_languages');
      // Type assertion and mapping would go here
      setAvailableLanguages(new Map());
    } catch (error) {
      console.error('Failed to load available languages:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setSaveStatus('saving');
      
      await invoke('jean_multilingual_update_preferences', {
        userId,
        preferences: {
          primary_language: settings.language.primary,
          primary_dialect: settings.language.primaryDialect,
          ui_language: settings.language.ui,
          ui_dialect: settings.language.uiDialect,
          speech_language: settings.language.speech,
          speech_dialect: settings.language.speechDialect,
          voice_tone: settings.voice.tone,
          speech_rate: settings.voice.rate,
          speech_pitch: settings.voice.pitch,
          formality_level: settings.behavior.formalityLevel,
          greeting_style: settings.behavior.greetingStyle,
          use_local_expressions: settings.behavior.useLocalExpressions,
          respect_cultural_nuances: settings.behavior.respectCulturalNuances,
          auto_translate_responses: settings.interface.autoTranslate,
          show_original_text: settings.interface.showOriginalText,
          translation_confidence_threshold: settings.interface.translationThreshold,
          timezone: settings.interface.timezone,
        },
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const updateSetting = <K extends keyof JeanSettingsState>(
    category: K,
    key: keyof JeanSettingsState[K],
    value: JeanSettingsState[K][keyof JeanSettingsState[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const getLanguageDisplay = (lang: JeanLanguage): string => {
    const languageNames = {
      [JeanLanguage.English]: 'English',
      [JeanLanguage.Arabic]: 'العربية',
      [JeanLanguage.Spanish]: 'Español',
      [JeanLanguage.Chinese]: '中文',
      [JeanLanguage.French]: 'Français',
      [JeanLanguage.German]: 'Deutsch',
      [JeanLanguage.Japanese]: '日本語',
      [JeanLanguage.Korean]: '한국어',
      [JeanLanguage.Portuguese]: 'Português',
      [JeanLanguage.Russian]: 'Русский',
      [JeanLanguage.Italian]: 'Italiano',
      [JeanLanguage.Hindi]: 'हिन्दी',
    };
    return languageNames[lang] || lang;
  };

  const getDialectDisplay = (lang: JeanLanguage, dialect?: string): string => {
    if (!dialect) return '';
    
    const dialectNames: Record<string, Record<string, string>> = {
      [JeanLanguage.Arabic]: {
        'eg': 'Egyptian (مصرية)',
        'sa': 'Gulf (خليجية)',
        'ae': 'Emirati (إماراتية)',
        'ma': 'Moroccan (مغربية)',
      },
      [JeanLanguage.English]: {
        'us': 'American',
        'uk': 'British',
        'au': 'Australian',
        'ca': 'Canadian',
      },
    };
    
    return dialectNames[lang]?.[dialect] || dialect;
  };

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Primary Language</label>
        <select
          value={settings.language.primary}
          onChange={(e) => updateSetting('language', 'primary', e.target.value as JeanLanguage)}
          className="w-full p-2 border rounded-lg"
        >
          {Object.values(JeanLanguage).map(lang => (
            <option key={lang} value={lang}>
              {getLanguageDisplay(lang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Interface Language</label>
        <select
          value={settings.language.ui}
          onChange={(e) => updateSetting('language', 'ui', e.target.value as JeanLanguage)}
          className="w-full p-2 border rounded-lg"
        >
          {Object.values(JeanLanguage).map(lang => (
            <option key={lang} value={lang}>
              {getLanguageDisplay(lang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Speech Language</label>
        <select
          value={settings.language.speech}
          onChange={(e) => updateSetting('language', 'speech', e.target.value as JeanLanguage)}
          className="w-full p-2 border rounded-lg"
        >
          {Object.values(JeanLanguage).map(lang => (
            <option key={lang} value={lang}>
              {getLanguageDisplay(lang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Formality Level</label>
        <select
          value={settings.behavior.formalityLevel}
          onChange={(e) => updateSetting('behavior', 'formalityLevel', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="formal">Formal</option>
          <option value="neutral">Neutral</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Greeting Style</label>
        <select
          value={settings.behavior.greetingStyle}
          onChange={(e) => updateSetting('behavior', 'greetingStyle', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="standard">Standard</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
          <option value="friendly">Friendly</option>
        </select>
      </div>
    </div>
  );

  const renderVoiceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Voice Tone</label>
        <select
          value={settings.voice.tone}
          onChange={(e) => updateSetting('voice', 'tone', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="neutral">Neutral</option>
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="warm">Warm</option>
          <option value="energetic">Energetic</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Speech Rate: {settings.voice.rate.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.voice.rate}
          onChange={(e) => updateSetting('voice', 'rate', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Pitch: {settings.voice.pitch.toFixed(1)}
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.voice.pitch}
          onChange={(e) => updateSetting('voice', 'pitch', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderAvatarSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Avatar Model</label>
        <select
          value={settings.avatar.modelUrl}
          onChange={(e) => updateSetting('avatar', 'modelUrl', e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="/models/jean_avatar.glb">Default 3D Avatar</option>
          <option value="/models/jean_avatar_2d.png">2D Avatar</option>
          <option value="/models/jean_minimal.glb">Minimal Avatar</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Responsiveness</label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={settings.avatar.responsiveness}
          onChange={(e) => updateSetting('avatar', 'responsiveness', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500 mt-1">
          How quickly the avatar reacts to stimuli
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoBlink"
          checked={settings.avatar.autoBlink}
          onChange={(e) => updateSetting('avatar', 'autoBlink', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="autoBlink" className="text-sm">
          Enable auto-blinking and idle animations
        </label>
      </div>
    </div>
  );

  const renderPermissionSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoApproveLowRisk"
          checked={settings.permissions.autoApproveLowRisk}
          onChange={(e) => updateSetting('permissions', 'autoApproveLowRisk', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="autoApproveLowRisk" className="text-sm">
          Auto-approve low-risk permission requests
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="confirmHighRisk"
          checked={settings.permissions.confirmHighRisk}
          onChange={(e) => updateSetting('permissions', 'confirmHighRisk', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="confirmHighRisk" className="text-sm">
          Always confirm high-risk actions
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showPermissionHistory"
          checked={settings.permissions.showPermissionHistory}
          onChange={(e) => updateSetting('permissions', 'showPermissionHistory', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="showPermissionHistory" className="text-sm">
          Show permission usage history
        </label>
      </div>
    </div>
  );

  const renderMemorySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoSave"
          checked={settings.memory.autoSave}
          onChange={(e) => updateSetting('memory', 'autoSave', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="autoSave" className="text-sm">
          Auto-save conversations and important context
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Maximum Memory Size: {settings.memory.maxMemorySize} items
        </label>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={settings.memory.maxMemorySize}
          onChange={(e) => updateSetting('memory', 'maxMemorySize', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Retention Period: {settings.memory.retentionDays} days
        </label>
        <input
          type="range"
          min="7"
          max="365"
          step="7"
          value={settings.memory.retentionDays}
          onChange={(e) => updateSetting('memory', 'retentionDays', parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );

  const tabs = [
    { id: 'language', label: 'Language', icon: '🌍' },
    { id: 'voice', label: 'Voice', icon: '🎙️' },
    { id: 'avatar', label: 'Avatar', icon: '👤' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jean Settings</h1>
        <button
          onClick={saveSettings}
          disabled={saveStatus === 'saving'}
          className={`px-4 py-2 rounded-lg font-medium ${
            saveStatus === 'saving' ? 'bg-gray-300' :
            saveStatus === 'saved' ? 'bg-green-500 text-white' :
            saveStatus === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {saveStatus === 'saving' ? 'Saving...' :
           saveStatus === 'saved' ? 'Saved!' :
           saveStatus === 'error' ? 'Error' :
           'Save Settings'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === 'language' && renderLanguageSettings()}
        {activeTab === 'voice' && renderVoiceSettings()}
        {activeTab === 'avatar' && renderAvatarSettings()}
        {activeTab === 'permissions' && renderPermissionSettings()}
        {activeTab === 'memory' && renderMemorySettings()}
      </div>
    </div>
  );
};

export default JeanSettings;