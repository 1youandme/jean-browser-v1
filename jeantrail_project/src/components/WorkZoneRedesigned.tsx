import React, { useState } from 'react';

interface WorkZoneRedesignedProps {
  type: 'local' | 'proxy' | 'web' | 'mobile';
  isActive?: boolean;
}

export const WorkZoneRedesigned: React.FC<WorkZoneRedesignedProps> = ({ 
  type, 
  isActive = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState('');

  const getZoneConfig = (zoneType: string) => {
    const configs = {
      local: {
        title: 'الجهاز المحلي',
        subtitle: 'تصفح الملفات والمجلدات المحلية',
        icon: '💻',
        color: 'from-green-500 to-emerald-500',
        bgGradient: 'from-green-900/20 to-emerald-900/20',
        borderColor: 'border-green-500/30'
      },
      proxy: {
        title: 'شبكة الوكيل',
        subtitle: 'اتصال آمن وخاص عبر الشبكة الوسيطة',
        icon: '🌐',
        color: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-900/20 to-pink-900/20',
        borderColor: 'border-purple-500/30'
      },
      web: {
        title: 'الويب العادي',
        subtitle: 'تصفح الإنترنت بالكامل',
        icon: '🌍',
        color: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-900/20 to-cyan-900/20',
        borderColor: 'border-blue-500/30'
      },
      mobile: {
        title: 'تطبيقات الموبايل',
        subtitle: 'تجربة تطبيقات الجوال',
        icon: '📱',
        color: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-900/20 to-red-900/20',
        borderColor: 'border-orange-500/30'
      }
    };
    return configs[zoneType as keyof typeof configs] || configs.web;
  };

  const config = getZoneConfig(type);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={`work-zone-redesigned flex-1 bg-gradient-to-br ${config.bgGradient} backdrop-blur-sm border-l ${config.borderColor} transition-all duration-300 ${
      isActive ? 'opacity-100' : 'opacity-70'
    }`}>
      {/* Zone Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
              <span className="text-xl">{config.icon}</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{config.title}</h2>
              <p className="text-gray-400 text-sm">{config.subtitle}</p>
            </div>
          </div>
          
          {/* Zone Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${isActive ? 'bg-green-400' : 'bg-yellow-400'} rounded-full animate-pulse`}></div>
            <span className={`text-xs ${isActive ? 'text-green-400' : 'text-yellow-400'} font-medium`}>
              {isActive ? 'نشط' : 'جاهز'}
            </span>
          </div>
        </div>

        {/* Address Bar for this zone */}
        <form onSubmit={handleUrlSubmit} className="mt-3">
          <div className="flex items-center bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-600 focus-within:border-blue-500 transition-colors">
            <span className="text-gray-400 mr-2">{config.icon}</span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`أدخل عنوان URL لـ ${config.title}...`}
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
            />
            <button
              type="submit"
              className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              اذهب
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">جارٍ التحميل...</p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {/* Zone-specific content would go here */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className={`w-20 h-20 bg-gradient-to-r ${config.color} rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-xl`}>
                  {config.icon}
                </div>
                <h3 className="text-white text-xl font-bold mb-2">{config.title}</h3>
                <p className="text-gray-400 text-sm mb-6">
                  {config.subtitle}. ابدأ بإدخال عنوان URL أو استخدم الأدوات المتاحة.
                </p>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 text-sm py-2 px-4 rounded-lg transition-all duration-200 border border-gray-600/50" onClick={() => console.log('browse')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('browse'); }}>
                    📂 تصفح
                  </button>
                  <button className="bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 text-sm py-2 px-4 rounded-lg transition-all duration-200 border border-gray-600/50" onClick={() => console.log('search')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('search'); }}>
                    🔍 بحث
                  </button>
                  <button className="bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 text-sm py-2 px-4 rounded-lg transition-all duration-200 border border-gray-600/50" onClick={() => console.log('settings')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('settings'); }}>
                    ⚙️ إعدادات
                  </button>
                  <button className="bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 text-sm py-2 px-4 rounded-lg transition-all duration-200 border border-gray-600/50" onClick={() => console.log('stats')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('stats'); }}>
                    📊 إحصائيات
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone Footer */}
      <div className="bg-gray-800/30 backdrop-blur-sm border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-3">
            <span>{config.icon} {config.title}</span>
            <span>🔒 آمن</span>
            <span>⚡ سريع</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>📊 0 MB</span>
            <span>🕐 {new Date().toLocaleTimeString('ar-SA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Zone-specific components
export const LocalDeviceZone: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
  <WorkZoneRedesigned type="local" isActive={isActive} />
);

export const ProxyNetworkZone: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
  <WorkZoneRedesigned type="proxy" isActive={isActive} />
);

export const WebBrowserZone: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
  <WorkZoneRedesigned type="web" isActive={isActive} />
);

export const MobileEmulatorZone: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
  <WorkZoneRedesigned type="mobile" isActive={isActive} />
);
