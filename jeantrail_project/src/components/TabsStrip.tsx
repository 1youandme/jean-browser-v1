import React from 'react';
import { X, Pin } from 'lucide-react';
import { Tab, ViewType } from '../types';

interface TabsStripProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onCreateTab: (type: ViewType) => void;
  isRTL: boolean;
}

export const TabsStrip: React.FC<TabsStripProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onCreateTab,
  isRTL,
}) => {
  const getTabIcon = (type: ViewType) => {
    switch (type) {
      case 'local':
        return '📁';
      case 'proxy':
        return '🛡️';
      case 'web':
        return '🌐';
      case 'mobile':
        return '📱';
      default:
        return '📄';
    }
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  const groupedTabs = tabs.reduce((acc, tab) => {
    if (!acc[tab.type]) acc[tab.type] = [];
    acc[tab.type].push(tab);
    return acc;
  }, {} as Record<ViewType, Tab[]>);

  return (
    <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center overflow-x-auto">
      {/* Pinned Tabs */}
      <div className="flex items-center h-full">
        {tabs
          .filter(tab => tab.isPinned)
          .map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`group flex items-center gap-2 px-3 py-2 h-full border-r border-gray-300 min-w-fit transition-colors ${
                tab.id === activeTabId
                  ? 'bg-white text-blue-600'
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Pin className="w-3 h-3 text-gray-500" />
              <span className="text-sm">
                {getTabIcon(tab.type)}
              </span>
              <span className="text-xs font-medium">
                {truncateTitle(tab.title)}
              </span>
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 rounded transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          ))}
      </div>

      {/* Regular Tabs by Type */}
      {(['local', 'proxy', 'web', 'mobile'] as ViewType[]).map(type => {
        const typeTabs = groupedTabs[type]?.filter(tab => !tab.isPinned) || [];
        if (typeTabs.length === 0) return null;

        return (
          <div key={type} className="flex items-center h-full">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {type}
            </div>
            {typeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabSelect(tab.id)}
                className={`group flex items-center gap-2 px-3 py-2 h-full border-r border-gray-300 min-w-fit transition-colors ${
                  tab.id === activeTabId
                    ? 'bg-white text-blue-600'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="text-sm">
                  {tab.favicon || getTabIcon(tab.type)}
                </span>
                <span className="text-xs font-medium">
                  {truncateTitle(tab.title)}
                </span>
                <button
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 rounded transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        );
      })}

      {/* Add New Tab Buttons */}
      <div className="flex items-center ml-auto h-full border-l border-gray-300">
        {(['web', 'local', 'proxy', 'mobile'] as ViewType[]).map(type => (
          <button
            key={`new-${type}`}
            onClick={() => onCreateTab(type)}
            className="px-3 py-2 h-full hover:bg-gray-200 text-gray-600 transition-colors border-r border-gray-300"
            title={`New ${type} tab`}
          >
            <span className="text-lg">
              {getTabIcon(type)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};