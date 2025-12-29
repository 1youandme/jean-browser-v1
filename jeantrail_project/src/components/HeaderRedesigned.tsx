import React, { useState, useEffect } from 'react';
import { JeanIcon } from './JeanIcon';

interface HeaderRedesignedProps {
  onJeanClick?: () => void;
  isJeanActive?: boolean;
  currentUrl: string;
  onUrlChange: (url: string) => void;
  onNavigate: (action: string) => void;
  activeMode: 'local' | 'proxy' | 'web' | 'mobile';
  onModeChange: (mode: 'local' | 'proxy' | 'web' | 'mobile') => void;
}

export const HeaderRedesigned: React.FC<HeaderRedesignedProps> = ({ 
  onJeanClick, 
  isJeanActive = false,
  currentUrl,
  onUrlChange,
  onNavigate,
  activeMode,
  onModeChange
}) => {
  const [isRTL, setIsRTL] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const devOnly = import.meta.env.VITE_DEV_ONLY === 'true';

  // Strips configuration
  const strips = [
    { id: 'local', name: 'الجهاز المحلي', icon: '💻', color: '#2ecc71' },
    { id: 'proxy', name: 'شبكة الوكيل', icon: '🌐', color: '#9b59b6' },
    { id: 'web', name: 'الويب العادي', icon: '🌍', color: '#3498db' },
    { id: 'emulator', name: 'المحاكي', icon: '🧪', color: '#e74c3c' }
  ];

  const navigationControls = [
    { icon: '⬅️', action: 'back', tooltip: 'رجوع' },
    { icon: '➡️', action: 'forward', tooltip: 'تقدم' },
    { icon: '🔄', action: 'refresh', tooltip: 'تحديث' },
    { icon: '⭐', action: 'saved', tooltip: 'الصفحات المحفوظة' },
    { icon: '📥', action: 'download', tooltip: 'التحميلات' }
  ];

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [isRTL]);

  const handleStripClick = (stripId: string) => {
    onModeChange(stripId as any);
  };

  const handleGo = () => {
    onNavigate('go');
  };

  return (
    <div className="header-redesigned bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white shadow-2xl border-b border-blue-500/30">
      {devOnly && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 font-bold">
          DEVELOPMENT ONLY - NEVER PACKAGED FOR USERS
        </div>
      )}
      {/* Main Header */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left Section - Navigation */}
        <div className="flex items-center space-x-1">
          {navigationControls.map((control) => (
            <button
              key={control.action}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              title={control.tooltip}
              onClick={() => onNavigate(control.action)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate(control.action); }}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                {control.icon}
              </span>
            </button>
          ))}
        </div>

        {/* Center Section - Address Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className={`relative transition-all duration-300 ${
            isSearchFocused ? 'scale-105' : 'scale-100'
          }`}>
            <div className="flex items-center bg-gray-800/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-inner">
              {/* Strip Indicator */}
              <div className="flex items-center space-x-2 ml-3">
                {strips.map((strip) => (
                  <button
                    key={strip.id}
                    onClick={() => handleStripClick(strip.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStripClick(strip.id); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      activeMode === strip.id
                        ? 'bg-white/20 text-white scale-110'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                    style={{
                      borderLeft: `3px solid ${strip.color}`,
                      boxShadow: activeMode === strip.id ? `0 0 12px ${strip.color}40` : 'none'
                    }}
                  >
                    <span className="ml-1">{strip.icon}</span>
                    {strip.name}
                  </button>
                ))}
              </div>

              {/* URL Input */}
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none mx-4 text-center"
                placeholder="أدخل عنوان URL أو ابحث..."
              />
              
              {/* Search/Go Button */}
              <button className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-all duration-200 hover:scale-110" onClick={handleGo} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGo(); }}>
                <span>🔍</span>
              </button>
            </div>

            {/* Active Strip Indicator */}
            <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60"></div>
          </div>
        </div>

        {/* Right Section - Tools & Jean (subtle) */}
        <div className="flex items-center space-x-3">
          {/* Jean (subtle presence) */}
          <div className="relative">
            <button
              onClick={onJeanClick}
              className={`p-2 rounded-full transition-all duration-300 ${isJeanActive ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'}`}
              title="Jean"
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onJeanClick) onJeanClick(); }}
            >
              <JeanIcon size={20} isActive={isJeanActive} />
            </button>
          </div>
          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200" onClick={() => console.log('settings')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('settings'); }}>
            <span className="text-lg">⚙️</span>
          </button>

          {/* RTL Toggle */}
          <button
            onClick={() => setIsRTL(!isRTL)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
            title={isRTL ? 'Switch to LTR' : 'التبديل لـ RTL'}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsRTL(!isRTL); }}
          >
            <span className="text-lg">{isRTL ? '⬅️' : '➡️'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Info Bar */}
      <div className="bg-black/20 px-4 py-1 text-xs text-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>🌐 JeanTrail OS v1.0</span>
            <span>🔒 اتصال آمن</span>
            <span>⚡ Qwen-3 AI نشط</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>📊 استخدام AI: 2.3MB</span>
            <span>🕐 {new Date().toLocaleTimeString('ar')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
