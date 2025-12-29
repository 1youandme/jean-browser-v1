import { useState, useCallback } from 'react';
import { Tab, ViewType } from '../types';

export const useTabs = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: 'DuckDuckGo',
      url: 'https://duckduckgo.com',
      type: 'web',
      isActive: true,
      isPinned: false,
      favicon: '🦆',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Local Files',
      path: '/',
      type: 'local',
      isActive: false,
      isPinned: false,
      favicon: '📁',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('1');

  const createTab = useCallback((type: ViewType) => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: type === 'web' ? 'New Tab' : 
            type === 'local' ? 'Local Files' :
            type === 'proxy' ? 'Proxy Network' : 'Mobile View',
      url: type === 'web' ? 'https://duckduckgo.com' : undefined,
      path: type === 'local' ? '/' : undefined,
      type,
      isActive: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTabs(prev => {
      // Set all other tabs to inactive
      const updatedTabs = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updatedTabs, { ...newTab, isActive: true }];
    });
    
    setActiveTabId(newTab.id);
    return newTab;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      
      // If we closed the active tab, activate another one
      const closedTab = prev.find(tab => tab.id === tabId);
      if (closedTab?.isActive && newTabs.length > 0) {
        const nextActiveTab = newTabs.find(tab => tab.type === closedTab.type) || newTabs[0];
        nextActiveTab.isActive = true;
        setActiveTabId(nextActiveTab.id);
      }
      
      return newTabs;
    });
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, ...updates, updatedAt: new Date() }
        : tab
    ));
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    setActiveTabId(tabId);
  }, []);

  const togglePinTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, isPinned: !tab.isPinned, updatedAt: new Date() }
        : tab
    ));
  }, []);

  const duplicateTab = useCallback((tabId: string) => {
    const originalTab = tabs.find(tab => tab.id === tabId);
    if (!originalTab) return;

    const duplicatedTab: Tab = {
      ...originalTab,
      id: Date.now().toString(),
      title: `${originalTab.title} (Copy)`,
      isActive: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTabs(prev => [...prev, duplicatedTab]);
    return duplicatedTab;
  }, [tabs]);

  const getTabsByType = useCallback((type: ViewType) => {
    return tabs.filter(tab => tab.type === type);
  }, [tabs]);

  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId);
  }, [tabs, activeTabId]);

  return {
    tabs,
    activeTabId,
    createTab,
    closeTab,
    updateTab,
    setActiveTab,
    togglePinTab,
    duplicateTab,
    getTabsByType,
    getActiveTab,
  };
};