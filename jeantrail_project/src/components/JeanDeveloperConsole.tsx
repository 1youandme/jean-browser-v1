import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, Clock, Activity, Users, DollarSign, Package, Shield, Mail, Key, Settings, MessageSquare } from 'lucide-react';
import { JeanChatPanel } from './JeanChatPanel';
import { Dashboard } from './Dashboard';
import { AgentManagementPanel } from './AgentManagementPanel';
import { EcommercePanel } from './EcommercePanel';
import { PaymentPanel } from './PaymentPanel';
import { SecurityAuditPanel } from './SecurityAuditPanel';
import { EmailManagementPanel } from './EmailManagementPanel';
import { APIKeysManagementPanel } from './APIKeysManagementPanel';

interface SystemStatus {
  orchestrator_status: string;
  docker_monitoring: boolean;
  services_running: number;
  services_healthy: number;
  active_permissions: number;
  recent_actions: number;
  memory_entries: number;
  new_products: number;
  active_promos: number;
  uptime_seconds: number;
}

interface TraeAgent {
  id: string;
  name: string;
  role: string;
  email: string;
  capabilities: string[];
  status: 'active' | 'idle' | 'error' | 'paused';
  last_run?: string;
  docker_container?: string;
  priority: number;
  current_tasks: number;
  max_concurrent_tasks: number;
}

export const JeanDeveloperConsole: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [agents, setAgents] = useState<TraeAgent[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Load initial data
  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Load system status
      const statusResponse = await fetch('/api/jean/system/status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setSystemStatus(status);
      }

      // Load TRAE agents
      const agentsResponse = await fetch('/api/agents');
      if (agentsResponse.ok) {
        const agentsList = await agentsResponse.json();
        setAgents(agentsList);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'idle':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (agent: TraeAgent) => {
    const variant = agent.status === 'active' ? 'default' : 
                   agent.status === 'idle' ? 'secondary' :
                   agent.status === 'error' ? 'destructive' : 'outline';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(agent.status)}
        {agent.status}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Jean Developer Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">JEAN DEVELOPER CONSOLE</h1>
              <Badge variant="outline" className="text-xs">
                JeanTrail Admin
              </Badge>
              {systemStatus && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Uptime: {formatUptime(systemStatus.uptime_seconds)}</span>
                  <span>•</span>
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {systemStatus && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{systemStatus.services_running}/{systemStatus.services_healthy}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{agents.filter(a => a.status === 'active').length} active</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>{systemStatus.active_permissions} perms</span>
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Navigation */}
          <div className="col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'agents' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('agents')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Agents Management
                </Button>
                <Button
                  variant={activeTab === 'ecommerce' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('ecommerce')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  E-commerce
                </Button>
                <Button
                  variant={activeTab === 'payments' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payments')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Button>
                <Button
                  variant={activeTab === 'security' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('security')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security Audit
                </Button>
                <Button
                  variant={activeTab === 'email' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Management
                </Button>
                <Button
                  variant={activeTab === 'apikeys' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('apikeys')}
                >
                  <Key className="h-4 w-4 mr-2" />
                  API Keys
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Run Scraper
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Apply Pricing
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Emails
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9">
            <div className="space-y-6">
              {/* Tab Content */}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'agents' && <AgentManagementPanel />}
              {activeTab === 'ecommerce' && <EcommercePanel />}
              {activeTab === 'payments' && <PaymentPanel />}
              {activeTab === 'security' && <SecurityAuditPanel />}
              {activeTab === 'email' && <EmailManagementPanel />}
              {activeTab === 'apikeys' && <APIKeysManagementPanel />}
            </div>
          </div>
        </div>

        {/* Jean Chat Area - Fixed Bottom Right */}
        <div className="fixed bottom-4 right-4 z-50">
          <JeanChatPanel />
        </div>
      </div>
    </div>
  );
};

export default JeanDeveloperConsole;