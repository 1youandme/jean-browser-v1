import React, { useState } from 'react';

interface Tab {
  id: string;
  title: string;
  url: string;
  type: 'local' | 'proxy' | 'web' | 'mobile';
  isActive: boolean;
  isPinned: boolean;
}

interface TabsStripRedesignedProps {
  tabs: Tab[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabPin: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabsStripRedesigned: React.FC<TabsStripRedesignedProps> = ({
  tabs,
  onTabClick,
  onTabClose,
  onTabPin,
  onNewTab
}) => {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);

  const getTabIcon = (type: string) => {
    const icons = {
      local: '💻',
      proxy: '🌐',
      web: '🌍',
      mobile: '📱'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getTabColor = (type: string) => {
    const colors = {
      local: 'from-green-500 to-emerald-500',
      proxy: 'from-purple-500 to-pink-500',
      web: 'from-blue-500 to-cyan-500',
      mobile: 'from-orange-500 to-red-500'
    };
    return colors[type as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    // Handle tab reordering logic here
    setDraggedTab(null);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Pinned Tabs */}
        <div className="flex items-center border-r border-gray-700">
          {tabs.filter(tab => tab.isPinned).map((tab) => (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onClick={() => onTabClick(tab.id)}
              className={`group relative flex items-center px-3 py-2 cursor-pointer transition-all duration-200 border-r border-gray-700 ${
                tab.isActive
                  ? 'bg-gray-700/50 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {/* Tab Icon */}
              <span className="text-sm mr-2">{getTabIcon(tab.type)}</span>
              
              {/* Tab Title */}
              <span className="text-sm font-medium truncate max-w-32">
                {tab.title}
              </span>
              
              {/* Pin Indicator */}
              <div className="ml-2 text-xs">📌</div>
              
              {/* Active Indicator */}
              {tab.isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getTabColor(tab.type)}`}></div>
              )}
              
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500/20 rounded p-1"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          ))}
        </div>

        {/* Regular Tabs */}
        <div className="flex items-center">
          {tabs.filter(tab => !tab.isPinned).map((tab) => (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onClick={() => onTabClick(tab.id)}
              className={`group relative flex items-center px-3 py-2 cursor-pointer transition-all duration-200 ${
                tab.isActive
                  ? 'bg-gray-700/50 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              {/* Tab Icon */}
              <span className="text-sm mr-2">{getTabIcon(tab.type)}</span>
              
              {/* Tab Title */}
              <span className="text-sm font-medium truncate max-w-40">
                {tab.title}
              </span>
              
              {/* Active Indicator */}
              {tab.isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getTabColor(tab.type)}`}></div>
              )}
              
              {/* Pin Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabPin(tab.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-yellow-500/20 rounded p-1"
              >
                <span className="text-xs">📌</span>
              </button>
              
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500/20 rounded p-1"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>
          ))}
        </div>

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded-lg transition-all duration-200 border border-gray-600 hover:border-gray-500"
        >
          <span className="text-lg">+</span>
        </button>

        {/* Tab Actions */}
        <div className="ml-auto flex items-center space-x-1 px-2">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded transition-all duration-200"
            title="قائمة التبويبات"
          >
            <span className="text-sm">📋</span>
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/30 rounded transition-all duration-200"
            title="إغلاق الكل"
          >
            <span className="text-sm">🗑️</span>
          </button>
        </div>
      </div>

      {/* Tab Info Bar */}
      <div className="bg-gray-900/30 px-4 py-1 text-xs text-gray-400 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>📑 {tabs.length} تبويب</span>
            <span>📌 {tabs.filter(t => t.isPinned).length} مثبت</span>
            <span>🌐 {tabs.filter(t => t.type === 'web').length} ويب</span>
            <span>💻 {tabs.filter(t => t.type === 'local').length} محلي</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>⚡ الذاكرة: 45 MB</span>
            <span>🔄 التحديث التلقائي: مفعل</span>
          </div>
        </div>
      </div>
    </div>
  );
};