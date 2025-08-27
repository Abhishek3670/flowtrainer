import { useState, useEffect, useCallback } from 'react';
import { projectApi } from '../services/projectApi';

interface SystemStatus {
  max_concurrent_executions: number;
  running_executions: number;
  queued_executions: number;
  capacity_utilization: number;
  queue: QueuedExecution[];
  running: RunningExecution[];
}

interface QueuedExecution {
  project_id: string;
  priority: number;
  queued_at: string;
}

interface RunningExecution {
  project_id: string;
  current_step?: string;
  progress?: number;
  started_at: string;
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Resolve projectId from URL/localStorage if available
      const projectId =
        (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('projectId')) ||
        (typeof window !== 'undefined' && localStorage.getItem('projectId')) ||
        '';

      let response: any = {};
      if (projectId && projectApi.getProjectStatus) {
        response = await projectApi.getProjectStatus(projectId);
      }
      // Handle both direct response and wrapped response from backend
      const statusData = response.system || response;
      
      // Convert SystemStatusResponse to SystemStatus
      const convertedStatus: SystemStatus = {
        max_concurrent_executions: statusData.max_concurrent_executions || 0,
        running_executions: statusData.running_executions || 0,
        queued_executions: statusData.queued_executions || 0,
        capacity_utilization: statusData.capacity_utilization || 0,
        queue: statusData.queue || [],
        running: statusData.running || []
      };
      setSystemStatus(convertedStatus);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      // Set default values on error
      setSystemStatus({
        max_concurrent_executions: 0,
        running_executions: 0,
        queued_executions: 0,
        capacity_utilization: 0,
        queue: [],
        running: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time updates via Server-Sent Events
  useEffect(() => {
    // Use the same URL format that works with the proxy
    const eventSource = new EventSource('/api/projects/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'system_status') {
          setSystemStatus(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('System status SSE error:', error);
      // Fallback to polling
      const interval = setInterval(fetchSystemStatus, 5000);
      return () => clearInterval(interval);
    };

    return () => eventSource.close();
  }, [fetchSystemStatus]);

  // Initial load
  useEffect(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  return { systemStatus, loading, error, refetch: fetchSystemStatus };
}
