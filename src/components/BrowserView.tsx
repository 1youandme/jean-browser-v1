import React, { useEffect, useRef } from 'react';
import { Tab } from '../types';

interface BrowserViewProps {
  tab?: Tab;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ tab }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && tab?.url) {
      // In a real implementation, you'd handle webview navigation here
      // For now, we'll just set the iframe src
      if (iframeRef.current.src !== tab.url) {
        iframeRef.current.src = tab.url;
      }
    }
  }, [tab?.url]);

  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Web Browser</h2>
          <p className="text-gray-500">Open a tab to start browsing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Browser Toolbar */}
      <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>🔒</span>
          <span>Secure</span>
        </div>
        <div className="flex-1 text-center text-sm text-gray-600 truncate">
          {tab.url || 'No URL loaded'}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-gray-100 rounded" title="Reload">
            🔄
          </button>
          <button className="p-1 hover:bg-gray-100 rounded" title="Open in external browser">
            🔗
          </button>
        </div>
      </div>

      {/* Web Content */}
      <div className="flex-1 bg-white">
        {tab.url ? (
          <iframe
            ref={iframeRef}
            src={tab.url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={tab.title}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No URL loaded</h3>
              <p className="text-gray-500">Enter a URL in the address bar to start browsing</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center px-4">
        <div className="flex-1 text-xs text-gray-600 truncate">
          {tab.url ? new URL(tab.url).hostname : 'Ready'}
        </div>
        <div className="text-xs text-gray-500">
          Loaded
        </div>
      </div>
    </div>
  );
};