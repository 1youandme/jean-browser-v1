import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store';
import { 
  Globe, 
  Home, 
  Shield, 
  Smartphone, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw,
  Bookmark,
  Search,
  Plus,
  Grid,
  List,
  Settings
} from 'lucide-react';
import { JeanAvatar3D } from '@/components/JeanAvatar3D';
import { HeaderRedesigned } from '@/components/HeaderRedesigned';

export const Browser: React.FC = () => {
  const navigate = useNavigate();
  const { language, sidebarOpen } = useUIStore();
  
  const [activeStrip, setActiveStrip] = useState<'local' | 'proxy' | 'web' | 'mobile'>('web');
  const [url, setUrl] = useState('https://www.google.com');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabs, setTabs] = useState([
    { id: 1, title: 'Google', url: 'https://www.google.com', active: true },
    { id: 2, title: 'JeanTrail OS', url: 'https://jeantrail.com', active: false },
  ]);

  const isRTL = language === 'ar';

  const strips = [
    {
      id: 'local',
      title: isRTL ? 'الجهاز المحلي' : 'Local Device',
      icon: <Home className="h-5 w-5" />,
      description: isRTL ? 'تصفح الملفات المحلية' : 'Browse local files',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'proxy',
      title: isRTL ? 'شبكة الوكيل' : 'Proxy Network',
      icon: <Shield className="h-5 w-5" />,
      description: isRTL ? 'تصفح آمن وخاص' : 'Secure & private browsing',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'web',
      title: isRTL ? 'الويب العادي' : 'Standard Web',
      icon: <Globe className="h-5 w-5" />,
      description: isRTL ? 'تصفح الويب التقليدي' : 'Traditional web browsing',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'mobile',
      title: isRTL ? 'محاكي الجوال' : 'Mobile Emulator',
      icon: <Smartphone className="h-5 w-5" />,
      description: isRTL ? 'تجربة الجوال' : 'Mobile experience',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const handleNavigation = (direction: 'back' | 'forward' | 'refresh') => {
    // Handle browser navigation
    console.log(`Navigating ${direction}`);
  };

  const handleTabSwitch = (tabId: number) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
  };

  const handleNewTab = () => {
    const newTab = {
      id: tabs.length + 1,
      title: isRTL ? 'علامة تبويب جديدة' : 'New Tab',
      url: 'about:blank',
      active: true,
    };
    setTabs([...tabs.map(tab => ({ ...tab, active: false })), newTab]);
  };

  const handleStripChange = (stripId: typeof activeStrip) => {
    setActiveStrip(stripId);
  };

  const currentStrip = strips.find(s => s.id === activeStrip);

  if (isFullscreen) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('back')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('forward')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleNavigation('refresh')}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-96 h-8"
              placeholder={isRTL ? 'أدخل URL...' : 'Enter URL...'}
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(false)}>
            <Grid className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Browser Content */}
        <div className="flex-1 bg-white">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="Browser"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <HeaderRedesigned />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'بيئات التصفح' : 'Browsing Environments'}
            </h3>
            
            <div className="space-y-2">
              {strips.map((strip) => (
                <Button
                  key={strip.id}
                  variant={activeStrip === strip.id ? 'default' : 'ghost'}
                  className={`w-full justify-start h-auto p-3 ${
                    activeStrip === strip.id 
                      ? `bg-gradient-to-r ${strip.color} text-white` 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleStripChange(strip.id as typeof activeStrip)}
                >
                  <div className="flex items-center space-x-3">
                    {strip.icon}
                    <div>
                      <div className="font-medium">{strip.title}</div>
                      <div className="text-xs opacity-75">{strip.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <Bookmark className="mr-2 h-4 w-4" />
                {isRTL ? 'الإشارات المرجعية' : 'Bookmarks'}
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                {isRTL ? 'السجل' : 'History'}
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                {isRTL ? 'الإعدادات' : 'Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Browser Toolbar */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button size="sm" variant="outline" onClick={() => handleNavigation('back')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleNavigation('forward')}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleNavigation('refresh')}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-96"
                  placeholder={isRTL ? 'أدخل URL أو ابحث...' : 'Enter URL or search...'}
                  startIcon={<Search className="h-4 w-4 text-gray-400" />}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={handleNewTab}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="jean" onClick={() => setIsFullscreen(true)}>
                  <Globe className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center space-x-1 mt-3 overflow-x-auto">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={tab.active ? 'default' : 'ghost'}
                  size="sm"
                  className={`flex items-center space-x-2 min-w-max ${
                    tab.active ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleTabSwitch(tab.id)}
                >
                  <Globe className="h-3 w-3" />
                  <span className="truncate max-w-32">{tab.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Browser Content Area */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4">
            {currentStrip && (
              <div className="h-full">
                <div className={`bg-gradient-to-r ${currentStrip.color} text-white p-4 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {currentStrip.icon}
                      <div>
                        <h3 className="font-semibold text-lg">{currentStrip.title}</h3>
                        <p className="text-sm opacity-90">{currentStrip.description}</p>
                      </div>
                    </div>
                    <JeanAvatar3D />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-lg h-full">
                  {activeStrip === 'local' && (
                    <div className="text-center py-12">
                      <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'الجهاز المحلي' : 'Local Device'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'تصفح الملفات والمجلدات المحلية' : 'Browse local files and folders'}
                      </p>
                      <Button onClick={() => navigate('/local')}>
                        {isRTL ? 'فتح متصفح الملفات' : 'Open File Browser'}
                      </Button>
                    </div>
                  )}
                  
                  {activeStrip === 'proxy' && (
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'شبكة الوكيل' : 'Proxy Network'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'تصفح آمن وخاص عبر شبكة الوكيل' : 'Secure and private browsing via proxy network'}
                      </p>
                      <Button onClick={() => navigate('/proxy')}>
                        {isRTL ? 'فتح شبكة الوكيل' : 'Open Proxy Network'}
                      </Button>
                    </div>
                  )}
                  
                  {activeStrip === 'web' && (
                    <div className="h-full">
                      <iframe
                        src={url}
                        className="w-full h-full border rounded-lg"
                        title="Web Browser"
                      />
                    </div>
                  )}
                  
                  {activeStrip === 'mobile' && (
                    <div className="text-center py-12">
                      <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'محاكي الجوال' : 'Mobile Emulator'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isRTL ? 'جرب تطبيقات الجوال وصفحات الويب المحسنة للجوال' : 'Experience mobile apps and mobile-optimized websites'}
                      </p>
                      <Button onClick={() => navigate('/mobile')}>
                        {isRTL ? 'فتح محاكي الجوال' : 'Open Mobile Emulator'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};