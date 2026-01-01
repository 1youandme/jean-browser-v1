import React, { useState } from 'react';
import { JeanIcon } from '../components/JeanIcon';
import { JeanAvatar3D } from '../components/JeanAvatar3D';
import { HeaderRedesigned } from '../components/HeaderRedesigned';
import { TabsStripRedesigned } from '../components/TabsStripRedesigned';
import { WorkZoneRedesigned, LocalDeviceZone, ProxyNetworkZone, WebBrowserZone, MobileEmulatorZone } from '../components/WorkZoneRedesigned';

export const JeanTrailDemo: React.FC = () => {
  const [isJeanActive, setIsJeanActive] = useState(true);
  const [activeStrip, setActiveStrip] = useState<'local' | 'proxy' | 'web' | 'mobile'>('web');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'split'>('overview');

  const handleJeanClick = () => {
    setIsJeanActive(!isJeanActive);
  };

  const handleJeanMessage = (message: string) => {
    console.log('Jean يقول:', message);
    // هنا يمكن إضافة منطق التعامل مع رسائل Jean
  };

  const demoTabs = [
    {
      id: '1',
      title: 'JeanTrail OS الرئيسية',
      url: 'https://jeantrail.ai',
      type: 'web' as const,
      isActive: true,
      isPinned: true
    },
    {
      id: '2',
      title: 'الملفات المحلية',
      url: 'file:///',
      type: 'local' as const,
      isActive: false,
      isPinned: false
    },
    {
      id: '3',
      title: 'شبكة الوكيل',
      url: 'proxy://jeantrail.network',
      type: 'proxy' as const,
      isActive: false,
      isPinned: false
    },
    {
      id: '4',
      title: 'متجر التطبيقات',
      url: 'mobile://appstore',
      type: 'mobile' as const,
      isActive: false,
      isPinned: true
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20" dir="rtl">
      {/* Header */}
      <HeaderRedesigned 
        onJeanClick={handleJeanClick}
        isJeanActive={isJeanActive}
      />

      {/* View Selector */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedView === 'overview' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              🏠 نظرة عامة
            </button>
            <button
              onClick={() => setSelectedView('detailed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedView === 'detailed' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              📊 عرض مفصل
            </button>
            <button
              onClick={() => setSelectedView('split')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedView === 'split' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              🔄 تقسيم الشاشة
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-xs">الوضع التجريبي - JeanTrail OS v1.0</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Jean Sidebar */}
        <div className="w-96 bg-gradient-to-b from-gray-900 via-blue-900/50 to-purple-900/50 border-l border-blue-500/30 backdrop-blur-sm flex flex-col">
          {/* Jean Header */}
          <div className="p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Jean AI المساعد الذكي
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-green-400 text-xs font-medium">نشط</span>
              </div>
            </div>
            <div className="text-gray-300 text-sm">
              مساعدك الذكي للتصفح والملفات والخدمات المتقدمة
            </div>
          </div>
          
          {/* Jean Avatar */}
          <div className="flex-1 p-6 flex items-center justify-center">
            <JeanAvatar3D 
              isActive={isJeanActive}
              onChatMessage={handleJeanMessage}
              className="w-full max-w-sm"
            />
          </div>
          
          {/* Jean Controls */}
          <div className="p-6 border-t border-blue-500/20 space-y-4">
            <div className="bg-gradient-to-r from-blue-800/50 to-purple-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-bold">متصل</span>
                </div>
                <span className="text-blue-300 text-xs">Qwen-3 AI</span>
              </div>
              <div className="text-gray-300 text-xs leading-relaxed">
                Jean جاهز للمساعدة في التصفح، إدارة الملفات، والخدمات المتقدمة
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs py-2 px-3 rounded-lg transition-all duration-200 border border-blue-500/30">
                📞 ابدأ محادثة
              </button>
              <button className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs py-2 px-3 rounded-lg transition-all duration-200 border border-purple-500/30">
                ⚙️ الإعدادات
              </button>
            </div>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="flex-1 flex flex-col bg-gray-900/30 backdrop-blur-sm">
          {/* Tabs Strip */}
          <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
            <TabsStripRedesigned 
              tabs={demoTabs}
              onTabClick={(tabId) => console.log('Tab clicked:', tabId)}
              onTabClose={(tabId) => console.log('Tab closed:', tabId)}
              onTabPin={(tabId) => console.log('Tab pinned:', tabId)}
              onNewTab={() => console.log('New tab')}
            />
          </div>

          {/* Content based on selected view */}
          <div className="flex-1 p-6">
            {selectedView === 'overview' && (
              <div className="grid grid-cols-2 gap-6 h-full">
                <div className="space-y-6">
                  <LocalDeviceZone isActive={activeStrip === 'local'} />
                  <ProxyNetworkZone isActive={activeStrip === 'proxy'} />
                </div>
                <div className="space-y-6">
                  <WebBrowserZone isActive={activeStrip === 'web'} />
                  <MobileEmulatorZone isActive={activeStrip === 'mobile'} />
                </div>
              </div>
            )}

            {selectedView === 'detailed' && (
              <div className="h-full">
                <WorkZoneRedesigned 
                  type={activeStrip}
                  isActive={true}
                />
              </div>
            )}

            {selectedView === 'split' && (
              <div className="grid grid-cols-4 gap-4 h-full">
                <LocalDeviceZone isActive={true} />
                <ProxyNetworkZone isActive={true} />
                <WebBrowserZone isActive={true} />
                <MobileEmulatorZone isActive={true} />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 px-4 py-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>🌐 JeanTrail OS v1.0</span>
                <span>🔒 اتصال آمن</span>
                <span>⚡ AI: {isJeanActive ? 'نشط' : 'غير نشط'}</span>
                <span>📊 العرض: {selectedView}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>📊 النطاق الترددي: 1.2 MB/s</span>
                <span>🕐 {new Date().toLocaleTimeString('ar-SA')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JeanTrailDemo;