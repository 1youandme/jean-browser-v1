import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Globe,
  Server,
  Activity,
  Lock,
  Unlock,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Thermometer,
  Wind
} from 'lucide-react';

// Types
interface ProxyNode {
  id: string;
  ip: string;
  port: number;
  country: string;
  city: string;
  type: 'tor' | 'vpn' | 'socks5' | 'http' | 'https';
  status: 'online' | 'offline' | 'connecting' | 'error';
  latency: number;
  bandwidth: number;
  uptime: number;
  lastChecked: string;
  anonymity: 'low' | 'medium' | 'high';
  encryption: boolean;
  logsEnabled: boolean;
  trafficUsed: number;
  trafficLimit: number;
}

interface NetworkConfig {
  autoRotate: boolean;
  rotationInterval: number; // minutes
  preferredCountries: string[];
  blockedCountries: string[];
  maxLatency: number;
  minBandwidth: number;
  enableKillSwitch: boolean;
  dnsLeakProtection: boolean;
  customDNS: string[];
  proxyProtocol: 'auto' | 'tor' | 'vpn' | 'mixed';
}

interface TrafficStats {
  totalDownload: number;
  totalUpload: number;
  currentSpeed: number;
  peakSpeed: number;
  connectedTime: number;
  dataSaved: number;
  requestsBlocked: number;
}

// Mock data
const MOCK_PROXY_NODES: ProxyNode[] = [
  {
    id: 'node-1',
    ip: '185.220.101.182',
    port: 443,
    country: 'Germany',
    city: 'Berlin',
    type: 'tor',
    status: 'online',
    latency: 145,
    bandwidth: 85.5,
    uptime: 99.8,
    lastChecked: new Date().toISOString(),
    anonymity: 'high',
    encryption: true,
    logsEnabled: false,
    trafficUsed: 1024 * 1024 * 512, // 512 MB
    trafficLimit: 1024 * 1024 * 1024 * 10 // 10 GB
  },
  {
    id: 'node-2',
    ip: '198.245.60.25',
    port: 8080,
    country: 'USA',
    city: 'New York',
    type: 'socks5',
    status: 'online',
    latency: 89,
    bandwidth: 125.3,
    uptime: 98.5,
    lastChecked: new Date().toISOString(),
    anonymity: 'medium',
    encryption: true,
    logsEnabled: false,
    trafficUsed: 1024 * 1024 * 256, // 256 MB
    trafficLimit: 1024 * 1024 * 1024 * 5 // 5 GB
  },
  {
    id: 'node-3',
    ip: '45.132.238.93',
    port: 1080,
    country: 'Netherlands',
    city: 'Amsterdam',
    type: 'vpn',
    status: 'online',
    latency: 67,
    bandwidth: 200.7,
    uptime: 99.9,
    lastChecked: new Date().toISOString(),
    anonymity: 'high',
    encryption: true,
    logsEnabled: false,
    trafficUsed: 1024 * 1024 * 128, // 128 MB
    trafficLimit: 1024 * 1024 * 1024 * 20 // 20 GB
  },
  {
    id: 'node-4',
    ip: '103.231.92.85',
    port: 3128,
    country: 'Singapore',
    city: 'Singapore',
    type: 'http',
    status: 'connecting',
    latency: 0,
    bandwidth: 0,
    uptime: 95.2,
    lastChecked: new Date().toISOString(),
    anonymity: 'low',
    encryption: false,
    logsEnabled: true,
    trafficUsed: 1024 * 1024 * 64, // 64 MB
    trafficLimit: 1024 * 1024 * 1024 * 2 // 2 GB
  }
];

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  autoRotate: true,
  rotationInterval: 30,
  preferredCountries: ['Germany', 'Netherlands', 'Switzerland'],
  blockedCountries: ['China', 'Russia', 'Iran'],
  maxLatency: 200,
  minBandwidth: 50,
  enableKillSwitch: true,
  dnsLeakProtection: true,
  customDNS: ['1.1.1.1', '8.8.8.8'],
  proxyProtocol: 'auto'
};

const MOCK_TRAFFIC_STATS: TrafficStats = {
  totalDownload: 1024 * 1024 * 1024 * 2.5, // 2.5 GB
  totalUpload: 1024 * 1024 * 512, // 512 MB
  currentSpeed: 15.6, // MB/s
  peakSpeed: 45.2, // MB/s
  connectedTime: 3600 * 4, // 4 hours
  dataSaved: 1024 * 1024 * 128, // 128 MB
  requestsBlocked: 1234
};

export const ProxyNetworkPanel: React.FC = () => {
  const [proxyNodes, setProxyNodes] = useState<ProxyNode[]>(MOCK_PROXY_NODES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig>(DEFAULT_NETWORK_CONFIG);
  const [trafficStats, setTrafficStats] = useState<TrafficStats>(MOCK_TRAFFIC_STATS);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time to human readable
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Get status color
  const getStatusColor = (status: ProxyNode['status']): string => {
    switch (status) {
      case 'online': return 'text-green-500 bg-green-100';
      case 'offline': return 'text-red-500 bg-red-100';
      case 'connecting': return 'text-yellow-500 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  // Get anonymity badge
  const getAnonymityBadge = (level: ProxyNode['anonymity']): string => {
    switch (level) {
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Connect to proxy node
  const handleConnect = useCallback(async (nodeId: string) => {
    const node = proxyNodes.find(n => n.id === nodeId);
    if (!node || node.status !== 'online') return;

    // Mock connection
    setProxyNodes(prev => prev.map(n => ({
      ...n,
      status: n.id === nodeId ? 'connecting' : n.status
    })));

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setProxyNodes(prev => prev.map(n => ({
      ...n,
      status: n.id === nodeId ? 'online' : n.status === 'connecting' ? 'offline' : n.status
    })));

    setSelectedNode(nodeId);
    setIsConnected(true);
  }, [proxyNodes]);

  // Disconnect from proxy
  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setSelectedNode(null);
  }, []);

  // Scan for new nodes
  const handleScanNodes = useCallback(async () => {
    setIsScanning(true);
    
    // Mock scanning
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Add some new mock nodes
    const newNodes: ProxyNode[] = [
      {
        id: 'node-' + Date.now(),
        ip: '103.231.92.86',
        port: 1080,
        country: 'Japan',
        city: 'Tokyo',
        type: 'socks5',
        status: 'online',
        latency: 156,
        bandwidth: 95.2,
        uptime: 97.8,
        lastChecked: new Date().toISOString(),
        anonymity: 'medium',
        encryption: true,
        logsEnabled: false,
        trafficUsed: 0,
        trafficLimit: 1024 * 1024 * 1024 * 8 // 8 GB
      }
    ];

    setProxyNodes(prev => [...prev, ...newNodes]);
    setIsScanning(false);
  }, []);

  // Test proxy speed
  const handleTestSpeed = useCallback(async (nodeId: string) => {
    setProxyNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, status: 'connecting' as const } : n
    ));

    // Mock speed test
    await new Promise(resolve => setTimeout(resolve, 2000));

    setProxyNodes(prev => prev.map(n => 
      n.id === nodeId ? { 
        ...n, 
        status: 'online' as const,
        latency: Math.floor(Math.random() * 200) + 50,
        bandwidth: Math.floor(Math.random() * 200) + 50
      } : n
    ));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              Proxy Network Manager
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Tor-like anonymous browsing with enhanced privacy
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                showStats 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-1" />
              Stats
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                showConfig 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Config
            </button>
            <button
              onClick={handleScanNodes}
              disabled={isScanning}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />
              ) : (
                <Search className="w-4 h-4 inline mr-1" />
              )}
              {isScanning ? 'Scanning...' : 'Scan Nodes'}
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Bar */}
      <div className={`px-6 py-3 border-b ${
        isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected to Proxy' : 'Not Connected'}
            </span>
            {isConnected && selectedNode && (
              <span className="text-sm text-gray-600">
                via {proxyNodes.find(n => n.id === selectedNode)?.ip}:{proxyNodes.find(n => n.id === selectedNode)?.port}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Speed: {trafficStats.currentSpeed} MB/s
            </span>
            <span className="text-sm text-gray-600">
              Protected: {trafficStats.requestsBlocked} requests
            </span>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <Unlock className="w-3 h-3 inline mr-1" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => selectedNode && handleConnect(selectedNode)}
                disabled={!selectedNode}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
              >
                <Lock className="w-3 h-3 inline mr-1" />
                Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Statistics */}
      {showStats && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Download className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-gray-500">Download</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatBytes(trafficStats.totalDownload)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Upload className="w-5 h-5 text-green-500" />
                <span className="text-xs text-gray-500">Upload</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatBytes(trafficStats.totalUpload)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-xs text-gray-500">Peak Speed</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {trafficStats.peakSpeed} MB/s
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-gray-500">Data Saved</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {formatBytes(trafficStats.dataSaved)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Configuration */}
      {showConfig && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Network Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto Rotate</label>
                <button
                  onClick={() => setNetworkConfig(prev => ({...prev, autoRotate: !prev.autoRotate}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    networkConfig.autoRotate ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      networkConfig.autoRotate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotation Interval (minutes)
                </label>
                <input
                  type="number"
                  value={networkConfig.rotationInterval}
                  onChange={(e) => setNetworkConfig(prev => ({...prev, rotationInterval: parseInt(e.target.value) || 30}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1440"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Latency (ms)
                </label>
                <input
                  type="number"
                  value={networkConfig.maxLatency}
                  onChange={(e) => setNetworkConfig(prev => ({...prev, maxLatency: parseInt(e.target.value) || 200}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Bandwidth (MB/s)
                </label>
                <input
                  type="number"
                  value={networkConfig.minBandwidth}
                  onChange={(e) => setNetworkConfig(prev => ({...prev, minBandwidth: parseInt(e.target.value) || 50}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Kill Switch</label>
                <button
                  onClick={() => setNetworkConfig(prev => ({...prev, enableKillSwitch: !prev.enableKillSwitch}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    networkConfig.enableKillSwitch ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      networkConfig.enableKillSwitch ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">DNS Leak Protection</label>
                <button
                  onClick={() => setNetworkConfig(prev => ({...prev, dnsLeakProtection: !prev.dnsLeakProtection}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    networkConfig.dnsLeakProtection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      networkConfig.dnsLeakProtection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proxy Protocol
                </label>
                <select
                  value={networkConfig.proxyProtocol}
                  onChange={(e) => setNetworkConfig(prev => ({...prev, proxyProtocol: e.target.value as any}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto Select</option>
                  <option value="tor">Tor Only</option>
                  <option value="vpn">VPN Only</option>
                  <option value="mixed">Mixed Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom DNS (comma separated)
                </label>
                <input
                  type="text"
                  value={networkConfig.customDNS.join(', ')}
                  onChange={(e) => setNetworkConfig(prev => ({...prev, customDNS: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1.1.1.1, 8.8.8.8"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proxy Nodes List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Available Proxy Nodes</h3>
          <span className="text-sm text-gray-500">
            {proxyNodes.filter(n => n.status === 'online').length} of {proxyNodes.length} online
          </span>
        </div>

        <div className="space-y-3">
          {proxyNodes.map(node => (
            <div
              key={node.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedNode === node.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      node.status === 'online' ? 'bg-green-500' :
                      node.status === 'connecting' ? 'bg-yellow-500' :
                      node.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{node.country}</span>
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{node.city}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAnonymityBadge(node.anonymity)}`}>
                      {node.anonymity} anon
                    </span>
                    {node.encryption && (
                      <Lock className="w-3 h-3 text-green-500" title="Encrypted" />
                    )}
                  </div>

                  <div>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {node.ip}:{node.port}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{node.latency}ms</p>
                    <p className="text-xs text-gray-500">latency</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">{node.bandwidth}MB/s</p>
                    <p className="text-xs text-gray-500">bandwidth</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">{node.uptime}%</p>
                    <p className="text-xs text-gray-500">uptime</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSpeed(node.id);
                      }}
                      disabled={node.status !== 'online'}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:text-gray-400"
                      title="Test Speed"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    
                    {node.status === 'online' && selectedNode !== node.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(node.id);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Connect
                      </button>
                    )}
                    
                    {selectedNode === node.id && isConnected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect();
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Traffic Usage Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Traffic Usage</span>
                  <span>{formatBytes(node.trafficUsed)} / {formatBytes(node.trafficLimit)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(node.trafficUsed / node.trafficLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};