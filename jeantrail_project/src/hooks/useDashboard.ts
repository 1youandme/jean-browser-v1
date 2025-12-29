import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store';
import { ServiceStatus, SystemMetrics, Task } from '@/types';

export const useDashboard = () => {
  const { language } = useUIStore();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    gpu: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  const isRTL = language === 'ar';

  // Fetch service statuses
  const fetchServiceStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch service statuses:', error);
    }
  }, []);

  // Fetch system metrics
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  }, []);

  // Fetch active tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  // Initialize dashboard data
  const initializeDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchServiceStatuses(),
        fetchSystemMetrics(),
        fetchTasks(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchServiceStatuses, fetchSystemMetrics, fetchTasks]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await initializeDashboard();
  }, [initializeDashboard]);

  // Start/stop service
  const toggleService = useCallback(async (serviceName: string) => {
    try {
      const response = await fetch(`/api/dashboard/services/${serviceName}/toggle`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchServiceStatuses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle service:', error);
      return false;
    }
  }, [fetchServiceStatuses]);

  // Cancel task
  const cancelTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/dashboard/tasks/${taskId}/cancel`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchTasks();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel task:', error);
      return false;
    }
  }, [fetchTasks]);

  // Restart service
  const restartService = useCallback(async (serviceName: string) => {
    try {
      const response = await fetch(`/api/dashboard/services/${serviceName}/restart`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchServiceStatuses();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to restart service:', error);
      return false;
    }
  }, [fetchServiceStatuses]);

  // Get service status color
  const getServiceStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      case 'loading':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }, []);

  // Get task status color
  const getTaskStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'running':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }, []);

  // Format bytes
  const formatBytes = useCallback((bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }, []);

  // Calculate system health
  const getSystemHealth = useCallback(() => {
    const onlineServices = services.filter(s => s.status === 'online').length;
    const totalServices = services.length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const runningTasks = tasks.filter(t => t.status === 'running').length;
    
    let healthScore = 100;
    
    // Deduct points for offline services
    if (totalServices > 0) {
      healthScore -= ((totalServices - onlineServices) / totalServices) * 40;
    }
    
    // Deduct points for failed tasks
    if (tasks.length > 0) {
      healthScore -= (failedTasks / tasks.length) * 30;
    }
    
    // Deduct points for high resource usage
    if (metrics.cpu > 90) healthScore -= 10;
    if (metrics.memory > 90) healthScore -= 10;
    if (metrics.disk > 90) healthScore -= 10;
    
    return Math.max(0, Math.round(healthScore));
  }, [services, tasks, metrics]);

  // Get metrics trend (mock implementation)
  const getMetricsTrend = useCallback((metric: keyof SystemMetrics) => {
    // In a real implementation, this would compare with historical data
    const trends = {
      cpu: 'up',
      memory: 'stable',
      disk: 'up',
      network: 'down',
      gpu: 'stable',
    };
    
    return trends[metric] || 'stable';
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Set up auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  // Auto-refresh interval management
  useEffect(() => {
    // Increase refresh interval when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRefreshInterval(30000); // 30 seconds
      } else {
        setRefreshInterval(5000); // 5 seconds
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    // State
    services,
    metrics,
    tasks,
    isLoading,
    refreshInterval,

    // Computed values
    systemHealth: getSystemHealth(),
    onlineServicesCount: services.filter(s => s.status === 'online').length,
    runningTasksCount: tasks.filter(t => t.status === 'running').length,
    failedTasksCount: tasks.filter(t => t.status === 'failed').length,

    // Actions
    refreshData,
    toggleService,
    cancelTask,
    restartService,
    setRefreshInterval,

    // Utilities
    getServiceStatusColor,
    getTaskStatusColor,
    formatBytes,
    getMetricsTrend,
  };
};