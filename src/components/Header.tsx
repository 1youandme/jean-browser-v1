import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Bookmark, Settings, Bot, Globe, Shield, Smartphone, Folder, Plus, X, GripVertical } from 'lucide-react';
import { Tab, ViewType } from '../types';

interface HeaderProps {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onJeanToggle: () => void;
  onAddressChange: (address: string) => void;
  onTabCreate: (type: ViewType) => void;
  isRTL: boolean;
  onRTLToggle: () => void;
}

// Strip configurations
const STRIP_CONFIG = {
  RowA: { type: 'local' as ViewType, label: 'Local Desktop', icon: Folder, color: 'bg-gray-900' },
  RowB: { type: 'proxy' as ViewType, label: 'Proxy Network', icon: Shield, color: 'bg-blue-900' },
  RowC: { type: 'web' as ViewType, label: 'Web Browser', icon: Globe, color: 'bg-green-900' },
  RowD: { type: 'mobile' as ViewType, label: 'JeanTrail', icon: Smartphone, color: 'bg-purple-900' }
};

export const Header: React.FC<HeaderProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onJeanToggle,
  onAddressChange,
  onTabCreate,
  isRTL,
  onRTLToggle,
}) => {
  const [address, setAddress] = useState('');
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Get current address based on active tab
  const getCurrentAddress = () => {
    if (!activeTab) return '';
    if (activeTab.type === 'local' && activeTab.path) {
      return activeTab.path;
    }
    if (activeTab.url) {
      return activeTab.url;
    }
    return '';
  };

  useEffect(() => {
    setAddress(getCurrentAddress());
  }, [activeTab]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddressChange(address);
  };

  const handleTabDragStart = (tabId: string) => {
    setDraggedTab(tabId);
  };

  const handleTabDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedTab(null);
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getTabsForStrip = (type: ViewType) => {
    return tabs.filter(tab => tab.type === type);
  };

  return (
    <div className="h-auto bg-white border-b border-gray-200">
      {/* Top Navigation Bar */}
      <div className="h-14 flex items-center px-4 gap-4">
        {/* Left: Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Show Saved Pages"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Address Bar */}
        <form onSubmit={handleAddressSubmit} className="flex-1 max-w-2xl">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {activeTab && (
                <>
                  {activeTab.type === 'local' && <Folder className="w-4 h-4" />}
                  {activeTab.type === 'proxy' && <Shield className="w-4 h-4" />}
                  {activeTab.type === 'web' && <Globe className="w-4 h-4" />}
                  {activeTab.type === 'mobile' && <Smartphone className="w-4 h-4" />}
                </>
              )}
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address..."
            />
          </div>
        </form>

        {/* Right: Jean & Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={onJeanToggle}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors relative"
            title="Jean Assistant"
          >
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onRTLToggle}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-xs"
            title={isRTL ? "Switch to LTR" : "Switch to RTL"}
          >
            {isRTL ? 'RTL' : 'LTR'}
          </button>
        </div>
      </div>

      {/* 4-Strip Tab Rows */}
      <div className="border-t border-gray-200">
        {Object.entries(STRIP_CONFIG).map(([stripName, config]) => (
          <div key={stripName} className={`${config.color} border-b border-gray-700`}>
            <div className="flex items-center px-2 py-1 min-h-[32px]">
              {/* Strip Label */}
              <div className="flex items-center gap-2 px-2 py-1 text-white text-xs font-medium">
                <config.icon className="w-3 h-3" />
                <span>{config.label}</span>
              </div>

              {/* Tabs for this strip */}
              <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                {getTabsForStrip(config.type).map((tab) => (
                  <div
                    key={tab.id}
                    draggable
                    onDragStart={() => handleTabDragStart(tab.id)}
                    onDrop={handleTabDrop}
                    onDragOver={handleTabDragOver}
                    className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-all ${
                      activeTabId === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                    onClick={() => onTabSelect(tab.id)}
                  >
                    <GripVertical className="w-3 h-3 opacity-50" />
                    <span className="text-xs truncate max-w-[120px]">{tab.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add Tab Button */}
                <button
                  onClick={() => onTabCreate(config.type)}
                  className="flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title={`New ${config.label} Tab`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-xs">+</span>
                </button>
              </div>

              {/* Right side actions for this strip */}
              <div className="flex items-center gap-1">
                {config.type === 'web' && (
                  <button
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="New Incognito Tab"
                  >
                    <Globe className="w-3 h-3" />
                  </button>
                )}
                {config.type === 'mobile' && (
                  <button
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="JeanTrail Homepage"
                  >
                    <Smartphone className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};