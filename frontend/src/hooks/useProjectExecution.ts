// frontend/src/hooks/useProjectExecution.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { projectApi, StatusResponse  } from '../services/projectApi';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';
  message: string;
  step?: string;
}

export function useProjectExecution(projectId: string) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const logStreamRef = useRef<EventSource | null>(null);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);

  // Generate execution plan and execute
  const executeProject = useCallback(async (
    workflowId: string, 
    nodes: any[], 
    edges: any[],
    priority: number = 1
  ) => {
    setLoading(true);
    setError(null);
    setLogs([]);
    
    try {
      // POST: /api/:projectId/execute
      console.log("POST request to a backend endpoint");
      const result = await projectApi.executeCompleteWorkflow(
        projectId, workflowId, nodes, edges, priority
      );
      console.log("Execution result:", result);
      setRunning(true);
      
      // Start log streaming
      startLogStreaming();
      
      // Start status polling
      startStatusPolling();
      
      return result;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  }, [projectId]);

  // Start real-time log streaming
  const startLogStreaming = useCallback(() => {
    if (logStreamRef.current) {
      logStreamRef.current.close();
    }

    setIsStreaming(true);
    logStreamRef.current = projectApi.createLogStream(projectId);
    
    logStreamRef.current.onmessage = (event) => {
      try {
        const logData = JSON.parse(event.data);
        const logEntry: LogEntry = {
          timestamp: logData.timestamp || new Date().toISOString(),
          level: logData.level || 'INFO',
          message: logData.message || logData.data || event.data,
          step: logData.step
        };
        
        setLogs(prev => [...prev, logEntry]);
      } catch (error) {
        // Plain text log entry
        const logEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: event.data
        };
        setLogs(prev => [...prev, logEntry]);
      }
    };

    logStreamRef.current.onerror = (error) => {
      console.error('Log streaming error:', error);
      setIsStreaming(false);
      // Fallback to periodic log fetching
      fetchLogsManually();
    };
  }, [projectId]);

  // Start status polling
  const startStatusPolling = useCallback(() => {
    const pollStatus = async () => {
      try {
        const statusData = await projectApi.getProjectStatus(projectId);
        setStatus(statusData);
        
        if (statusData.status === 'completed' || 
            statusData.status === 'failed' || 
            statusData.status === 'timeout') {
          setRunning(false);
          setLoading(false);
          stopStreaming();
          
          if (statusPollRef.current) {
            clearInterval(statusPollRef.current);
            statusPollRef.current = null;
          }
        }
      } catch (err) {
        console.warn('Status polling error:', err);
      }
    };

    pollStatus(); // Initial poll
    statusPollRef.current = setInterval(pollStatus, 2000);
  }, [projectId]);

  // Fallback log fetching
  const fetchLogsManually = useCallback(async () => {
    try {
      const logData = await projectApi.getExecutionLogs(projectId);
      const logEntries = logData.logs.map((logLine) => ({
        timestamp: new Date().toISOString(),
        level: 'INFO' as const,
        message: logLine
      }));
      setLogs(logEntries);
    } catch (error) {
      console.warn('Manual log fetch failed:', error);
    }
  }, [projectId]);

  // Stop all streaming
  const stopStreaming = useCallback(() => {
    if (logStreamRef.current) {
      logStreamRef.current.close();
      logStreamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Retry execution
  const retryExecution = useCallback(async (fromStep?: string) => {
    setError(null);
    setLogs([]);
    
    try {
      await projectApi.retryExecution(projectId, fromStep);
      setRunning(true);
      startLogStreaming();
      startStatusPolling();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  }, [projectId, startLogStreaming, startStatusPolling]);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
      }
    };
  }, [stopStreaming]);

  return {
    status,
    loading,
    error,
    running,
    logs,
    isStreaming,
    executeProject,
    retryExecution,
    clearLogs,
    fetchLogsManually
  };
}
