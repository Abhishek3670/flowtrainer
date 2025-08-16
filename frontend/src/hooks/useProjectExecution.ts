// frontend/src/hooks/useProjectExecution.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { projectApi, ExecutionStatus, SystemStatus } from '../services/projectApi';

interface UseProjectExecutionReturn {
  // Execution state
  isExecuting: boolean;
  executionStatus: ExecutionStatus | null;
  executionError: string | null;
  
  // System state
  systemStatus: SystemStatus | null;
  systemError: string | null;
  
  // Actions
  executeProject: (
    projectId: string, 
    workflowId: string, 
    nodes: any[], 
    edges: any[],
    priority?: number,
    timeoutMinutes?: number
  ) => Promise<void>;
  
  getProjectStatus: (projectId: string) => Promise<ExecutionStatus | null>;
  retryExecution: (projectId: string, fromStep?: string) => Promise<void>;
  cleanupProject: (projectId: string) => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
  
  // Real-time updates
  subscribeToUpdates: (projectId: string) => () => void;
  subscribeToSystemEvents: () => () => void;
}

export const useProjectExecution = (): UseProjectExecutionReturn => {
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // System state
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemError, setSystemError] = useState<string | null>(null);
  
  // Real-time subscriptions
  const eventSourceRef = useRef<EventSource | null>(null);
  const systemEventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up event sources
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (systemEventSourceRef.current) {
        systemEventSourceRef.current.close();
      }
      // Stop polling
      if (pollingRef.current) {
        pollingRef.current();
      }
    };
  }, []);

  /** Execute project workflow */
  const executeProject = useCallback(async (
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[],
    priority: number = 1
  ): Promise<void> => {
    try {
      setIsExecuting(true);
      setExecutionError(null);
      setExecutionStatus({
        project_id: projectId,
        execution_id: 'pending',
        status: 'queued',
        started_at: new Date().toISOString()
      });

      // Execute complete workflow (generate plan + execute)
      await projectApi.executeCompleteWorkflow(
        projectId,
        workflowId,
        nodes,
        edges,
        priority
      );

      // Start real-time status polling
      startStatusPolling(projectId);
      
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
      setExecutionStatus(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString()
      } : null);
      setIsExecuting(false);
    }
  }, []);

  /** Start polling for execution status */
  const startStatusPolling = useCallback(async (projectId: string) => {
    // Stop any existing polling
    if (pollingRef.current) {
      pollingRef.current();
    }

    pollingRef.current = await projectApi.pollExecutionStatus(
      projectId,
      // On status update
      (status: any) => {
        setExecutionStatus(status);
      },
      // On complete
      () => {
        setIsExecuting(false);
        pollingRef.current = null;
      },
      // On error
      (error: any) => {
        setExecutionError(error.message);
      }
    );
  }, []);

  /** Get project status */
  const getProjectStatus = useCallback(async (
    projectId: string
  ): Promise<ExecutionStatus | null> => {
    try {
      const status = await projectApi.getProjectStatus(projectId);
      setExecutionStatus(status);
      return status;
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }, []);

  /** Retry failed execution */
  const retryExecution = useCallback(async (
    projectId: string,
    fromStep?: string
  ): Promise<void> => {
    try {
      setExecutionError(null);
      await projectApi.retryExecution(projectId, fromStep);
      
      // Restart status polling
      setIsExecuting(true);
      startStatusPolling(projectId);
      
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [startStatusPolling]);

  /** Clean up project */
  const cleanupProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      await projectApi.cleanupProject(projectId);
      
      // Reset status if it's the current project
      if (executionStatus?.project_id === projectId) {
        setExecutionStatus(null);
        setIsExecuting(false);
      }
      
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [executionStatus]);

  /** Refresh system status */
  const refreshSystemStatus = useCallback(async (): Promise<void> => {
    try {
      setSystemError(null);
      const response = await projectApi.getSystemStatus();
      // Handle both direct response and wrapped response from backend
      const statusData = response.system || response;
      
      // Convert SystemStatusResponse to SystemStatus
      const convertedStatus: SystemStatus = {
        max_concurrent_executions: statusData.max_concurrent_executions || 0,
        running_executions: statusData.running_executions || 0,
        queued_executions: statusData.queued_executions || 0,
        capacity_utilization: statusData.capacity_utilization || 0,
        total_projects: (statusData.running_executions || 0) + (statusData.queued_executions || 0), // Calculate total
        queue: statusData.queue || [],
        running: statusData.running || []
      };
      setSystemStatus(convertedStatus);
    } catch (error) {
      setSystemError(error instanceof Error ? error.message : 'Unknown error');
      // Set default values on error
      setSystemStatus({
        max_concurrent_executions: 0,
        running_executions: 0,
        queued_executions: 0,
        capacity_utilization: 0,
        total_projects: 0,
        queue: [],
        running: []
      });
    }
  }, []);

  /** Subscribe to real-time execution updates */
  const subscribeToUpdates = useCallback((projectId: string): (() => void) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = projectApi.createLogStream(projectId);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different event types
        if (data.type === 'status_update') {
          setExecutionStatus(prev => prev ? { ...prev, ...data.status } : data.status);
        } else if (data.type === 'error') {
          setExecutionError(data.error);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setExecutionError('Lost connection to server');
    };

    // Return cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  /** Subscribe to system-wide events */
  const subscribeToSystemEvents = useCallback((): (() => void) => {
    // Close existing connection
    if (systemEventSourceRef.current) {
      systemEventSourceRef.current.close();
    }

    const eventSource = projectApi.createEventStream();
    systemEventSourceRef.current = eventSource;

    eventSource.addEventListener('execution_queued', (event) => {
      const data = JSON.parse(event.data);
      console.log('Execution queued:', data);
      // Refresh system status when executions are queued
      refreshSystemStatus();
    });

    eventSource.addEventListener('execution_progress', (event) => {
      const data = JSON.parse(event.data);
      console.log('Execution progress:', data);
      
      // Update current execution status if it matches
      if (executionStatus?.project_id === data.projectId) {
        setExecutionStatus(prev => prev ? {
          ...prev,
          current_step: data.step,
          progress: data.progress
        } : null);
      }
    });

    eventSource.addEventListener('execution_completed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Execution completed:', data);
      
      // Update current execution status if it matches
      if (executionStatus?.project_id === data.projectId) {
        setExecutionStatus(prev => prev ? {
          ...prev,
          status: 'completed',
          completed_at: new Date().toISOString()
        } : null);
        setIsExecuting(false);
      }
      
      refreshSystemStatus();
    });

    eventSource.addEventListener('execution_failed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Execution failed:', data);
      
      // Update current execution status if it matches
      if (executionStatus?.project_id === data.projectId) {
        setExecutionStatus(prev => prev ? {
          ...prev,
          status: 'failed',
          error: data.error,
          completed_at: new Date().toISOString()
        } : null);
        setIsExecuting(false);
        setExecutionError(data.error);
      }
      
      refreshSystemStatus();
    });

    eventSource.onerror = (error) => {
      console.error('System events SSE error:', error);
      setSystemError('Lost connection to system events');
    };

    // Return cleanup function
    return () => {
      if (systemEventSourceRef.current) {
        systemEventSourceRef.current.close();
        systemEventSourceRef.current = null;
      }
    };
  }, [executionStatus, refreshSystemStatus]);

  return {
    // State
    isExecuting,
    executionStatus,
    executionError,
    systemStatus,
    systemError,
    
    // Actions
    executeProject,
    getProjectStatus,
    retryExecution,
    cleanupProject,
    refreshSystemStatus,
    
    // Real-time subscriptions
    subscribeToUpdates,
    subscribeToSystemEvents
  };
};
