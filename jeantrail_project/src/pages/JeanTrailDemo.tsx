import React, { useEffect, useState } from 'react';
import { JeanAvatar3D } from '../components/JeanAvatar3D';
import { HeaderRedesigned } from '../components/HeaderRedesigned';
import { TabsStripRedesigned } from '../components/TabsStripRedesigned';
import { WorkZoneRedesigned } from '../components/WorkZoneRedesigned';

type Mode = 'local' | 'proxy' | 'web' | 'mobile';

interface TabItem {
  id: string;
  title: string;
  url?: string;
  type: Mode;
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JEAN_RECOVERY_MODE = false;

export const JeanTrailDemo: React.FC = () => {
  const [isJeanActive, setIsJeanActive] = useState(true);
  const [activeStrip, setActiveStrip] = useState<Mode>('web');

  const handleJeanClick = () => {
    setIsJeanActive(!isJeanActive);
  };

  const handleJeanMessage = (message: string) => {
    console.log(message);
  };

  const demoTabs: TabItem[] = [
    {
      id: '1',
      title: 'JeanTrail OS الرئيسية',
      url: 'https://jeantrail.ai',
      type: 'web',
      isActive: true,
      isPinned: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'الملفات المحلية',
      url: 'file:///',
      type: 'local',
      isActive: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'شبكة الوكيل',
      url: 'proxy://jeantrail.network',
      type: 'proxy',
      isActive: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'متجر التطبيقات',
      url: 'mobile://appstore',
      type: 'mobile',
      isActive: false,
      isPinned: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const [tabs, setTabs] = useState<TabItem[]>(demoTabs);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const [currentUrl, setCurrentUrl] = useState<string>(activeTab?.url ?? '');
  useEffect(() => {
    setCurrentUrl(activeTab?.url ?? '');
  }, [activeTabId]);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId, updatedAt: new Date() })));
    const t = tabs.find(x => x.id === tabId);
    if (t) setActiveStrip(t.type);
  };

  const handleTabClose = (tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      let nextActiveId = activeTabId;
      if (tabId === activeTabId) {
        nextActiveId = filtered.length ? filtered[0].id : '';
      }
      setActiveTabId(nextActiveId);
      return filtered.map(t => ({ ...t, isActive: t.id === nextActiveId, updatedAt: new Date() }));
    });
  };

  const handleTabPin = (tabId: string) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned, updatedAt: new Date() } : t));
  };

  const handleNewTab = () => {
    const newId = String(Date.now());
    const newTab: TabItem = {
      id: newId,
      title: 'تبويب جديد',
      url: 'https://jeantrail.ai',
      type: 'web',
      isActive: true,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTabs(prev => prev.map(t => ({ ...t, isActive: false, updatedAt: new Date() })).concat(newTab));
    setActiveTabId(newId);
    setActiveStrip('web');
  };

  const handleNavigate = (action: string) => {
    if (action === 'refresh') {
      setActiveTabId(prev => prev);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20" dir="rtl">
      <HeaderRedesigned
        onJeanClick={handleJeanClick}
        isJeanActive={isJeanActive}
        currentUrl={currentUrl}
        onUrlChange={setCurrentUrl}
        onNavigate={handleNavigate}
        activeMode={activeStrip}
        onModeChange={setActiveStrip}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 bg-gradient-to-b from-gray-900 via-blue-900/50 to-purple-900/50 border-l border-blue-500/30 backdrop-blur-sm flex flex-col">
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

          <div className="flex-1 p-6 flex items-center justify-center">
            {!JEAN_RECOVERY_MODE && (
              <JeanAvatar3D
                isActive={isJeanActive}
                onChatMessage={handleJeanMessage}
                className="w-full max-w-sm"
              />
            )}
          </div>

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

        <div className="flex-1 flex flex-col bg-gray-900/30 backdrop-blur-sm">
          <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
            <TabsStripRedesigned
              tabs={tabs}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onTabPin={handleTabPin}
              onNewTab={handleNewTab}
            />
          </div>

          <div className="flex-1 p-6">
            <div className="h-full">
              <WorkZoneRedesigned
                type={activeTab.type}
                isActive={true}
              />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 px-4 py-1">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>🌐 JeanTrail OS v1.0</span>
                <span>🔒 اتصال آمن</span>
                <span>⚡ AI: {isJeanActive ? 'نشط' : 'غير نشط'}</span>
                <span>📊 العرض: مفرد</span>
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
