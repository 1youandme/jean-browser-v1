import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, Home, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Tab } from '../types';

interface MobileFrameProps {
  tab?: Tab;
}

type DevicePreset = 'iphone' | 'android' | 'tablet';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  userAgent: string;
}

const deviceConfigs: Record<DevicePreset, DeviceConfig> = {
  iphone: {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    aspectRatio: '19.5:9',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  android: {
    name: 'Android Pixel',
    width: 393,
    height: 851,
    aspectRatio: '20:9',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36'
  },
  tablet: {
    name: 'iPad',
    width: 768,
    height: 1024,
    aspectRatio: '4:3',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  }
};

export const MobileFrame: React.FC<MobileFrameProps> = ({ tab }) => {
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('iphone');
  const [isRotated, setIsRotated] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(tab?.url || 'https://example.com');

  const currentDevice = deviceConfigs[devicePreset];
  const frameWidth = isRotated ? currentDevice.height : currentDevice.width;
  const frameHeight = isRotated ? currentDevice.width : currentDevice.height;

  useEffect(() => {
    if (tab?.url) {
      setCurrentUrl(tab.url);
    }
  }, [tab?.url]);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
    // Would navigate the iframe/webview here
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 items-center justify-center p-4">
      {/* Mobile Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-4">
          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-600" />
            <select
              value={devicePreset}
              onChange={(e) => setDevicePreset(e.target.value as DevicePreset)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="iphone">iPhone</option>
              <option value="android">Android</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>

          {/* Rotation Control */}
          <button
            onClick={() => setIsRotated(!isRotated)}
            className={`p-2 rounded transition-colors ${
              isRotated ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title={isRotated ? 'Rotate to portrait' : 'Rotate to landscape'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Device Info */}
          <div className="text-xs text-gray-600">
            {currentDevice.name} • {frameWidth}×{frameHeight}
          </div>
        </div>
      </div>

      {/* Mobile Device Frame */}
      <div className="relative">
        {/* Device Bezel */}
        <div
          className="bg-gray-900 rounded-3xl shadow-2xl p-4 relative"
          style={{
            width: `${frameWidth + 32}px`, // Add padding for bezel
            height: `${frameHeight + 80}px`, // Add extra space for controls
          }}
        >
          {/* Status Bar */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full z-10">
            <div className="flex items-center gap-4">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span>📶</span>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
          </div>

          {/* Browser Chrome */}
          <div className="bg-white rounded-t-2xl overflow-hidden">
            {/* Browser Toolbar */}
            <div className="h-12 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2">
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                <Home className="w-4 h-4" />
              </button>
              
              {/* Address Bar */}
              <div className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                {currentUrl}
              </div>
            </div>

            {/* Web Content */}
            <div
              className="bg-white overflow-hidden"
              style={{
                width: `${frameWidth}px`,
                height: `${frameHeight - 48}px`, // Subtract toolbar height
              }}
            >
              {currentUrl ? (
                <iframe
                  src={currentUrl}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  style={{
                    transform: `scale(${Math.min(1, (frameWidth - 20) / 400)})`,
                    transformOrigin: 'top left',
                  }}
                  title="Mobile Web Content"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-gray-600 text-sm">No URL loaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
        </div>

        {/* Device Shadow */}
        <div
          className="absolute inset-0 bg-black/20 rounded-3xl blur-xl -z-10"
          style={{
            transform: 'translateY(8px)',
          }}
        ></div>
      </div>

      {/* Mobile Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>User Agent:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {currentDevice.userAgent.split(' ').slice(0, 3).join(' ')}...
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};