import React, { useState, useEffect } from 'react';
import { Shield, Play, Square, Plus, Settings, RefreshCw, Globe, Lock } from 'lucide-react';
import { Tab, ProxyNode } from '../types';

interface ProxyPanelProps {
  tab?: Tab;
}

export const ProxyPanel: React.FC<ProxyPanelProps> = ({ tab }) => {
  const [proxyNodes, setProxyNodes] = useState<ProxyNode[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);

  useEffect(() => {
    // Load proxy nodes from backend
    loadProxyNodes();
  }, []);

  const loadProxyNodes = async () => {
    try {
      // Would call actual API here
      const mockNodes: ProxyNode[] = [
        {
          id: '1',
          userId: 'user1',
          host: 'proxy1.example.com',
          port: 8080,
          protocol: 'http',
          status: 'active',
          lastCheckedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          host: 'proxy2.example.com',
          port: 1080,
          protocol: 'socks5',
          status: 'inactive',
          lastCheckedAt: new Date(),
          createdAt: new Date(),
        },
      ];
      setProxyNodes(mockNodes);
    } catch (error) {
      console.error('Failed to load proxy nodes:', error);
    }
  };

  const handleConnectProxy = async (nodeId: string) => {
    try {
      // Would start proxy session here
      setActiveNodeId(nodeId);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to proxy:', error);
    }
  };

  const handleDisconnectProxy = async () => {
    try {
      // Would stop proxy session here
      setActiveNodeId(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from proxy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '⚪';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Proxy Network</span>
          {isConnected && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Connected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadProxyNodes}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh proxy nodes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddNode(!showAddNode)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Add proxy node"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Proxy settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Node Form */}
      {showAddNode && (
        <div className="border-b border-gray-200 bg-blue-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                placeholder="proxy.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  placeholder="8080"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Protocol
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Add Node
              </button>
              <button
                onClick={() => setShowAddNode(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Lock className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-green-700">Proxy Active</div>
                  <div className="text-sm text-gray-600">
                    {proxyNodes.find(n => n.id === activeNodeId)?.host}:{proxyNodes.find(n => n.id === activeNodeId)?.port}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-700">Direct Connection</div>
                  <div className="text-sm text-gray-600">Not using proxy</div>
                </div>
              </>
            )}
          </div>
          
          {isConnected ? (
            <button
              onClick={handleDisconnectProxy}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              disabled={proxyNodes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Proxy Nodes List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Available Proxy Nodes</h3>
          
          {proxyNodes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛡️</div>
              <p className="text-gray-500 mb-4">No proxy nodes configured</p>
              <button
                onClick={() => setShowAddNode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add First Proxy Node
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {proxyNodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(node.status)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {node.host}:{node.port}
                        </div>
                        <div className="text-sm text-gray-600">
                          {node.protocol.toUpperCase()} • {node.status}
                        </div>
                        {node.lastCheckedAt && (
                          <div className="text-xs text-gray-500">
                            Last checked: {node.lastCheckedAt.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {node.status === 'active' && !isConnected && (
                        <button
                          onClick={() => handleConnectProxy(node.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Connect
                        </button>
                      )}
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Traffic Stats */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Upload</div>
            <div className="font-medium">0 MB</div>
          </div>
          <div>
            <div className="text-gray-600">Download</div>
            <div className="font-medium">0 MB</div>
          </div>
        </div>
      </div>
    </div>
  );
};