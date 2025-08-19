import { useState, useCallback, useEffect, useRef } from 'react';
import { projectApi, StatusResponse } from '../services/projectApi';

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
    setRunning(true);
    
    try {
      console.log('🚀 Starting execution for project:', projectId);
      
      // Start log streaming FIRST before executing
      startLogStreaming();
      
      // Start status polling
      startStatusPolling();
      
      // Execute the workflow - this should trigger the backend to start streaming logs
      const result = await projectApi.executeCompleteWorkflow(
        projectId, workflowId, nodes, edges, priority
      );
      
      console.log('✅ Execution started successfully:', result);
      
      return result;
    } catch (err: any) {
      console.error('❌ Execution failed:', err);
      setError(err.response?.data?.error || err.message);
      setLoading(false);
      setRunning(false);
      stopStreaming();
    }
  }, [projectId]);

  // Start real-time log streaming
  const startLogStreaming = useCallback(() => {
    // Close existing stream
    if (logStreamRef.current) {
      logStreamRef.current.close();
    }

    console.log('📡 Starting log streaming for project:', projectId);
    setIsStreaming(true);
    
    // Create EventSource for log streaming
    const logStreamUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/projects/${projectId}/logs/stream`;
    logStreamRef.current = new EventSource(logStreamUrl);
    
    logStreamRef.current.onopen = () => {
      console.log('✅ Log stream connected');
      setIsStreaming(true);
    };
    
    logStreamRef.current.onmessage = (event) => {
      try {
        console.log('📋 Raw log data:', event.data);
        
        // Try to parse as JSON first
        const logData = JSON.parse(event.data);
        
        // Handle different message types
        if (logData.type === 'log') {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: logData.message || 'Unknown log entry'
          };
          setLogs(prev => [...prev, logEntry]);
        } else if (logData.type === 'error') {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: logData.error || 'Execution error'
          };
          setLogs(prev => [...prev, logEntry]);
          setError(logData.error);
        } else if (logData.type === 'done') {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Execution completed successfully'
          };
          setLogs(prev => [...prev, logEntry]);
          setRunning(false);
          setLoading(false);
          stopStreaming();
        } else {
          // Handle structured log entry
          const logEntry: LogEntry = {
            timestamp: logData.timestamp || new Date().toISOString(),
            level: logData.level || 'INFO',
            message: logData.message || event.data,
            step: logData.step
          };
          setLogs(prev => [...prev, logEntry]);
        }
      } catch (error) {
        console.log('📝 Plain text log:', event.data);
        // Handle plain text log entries
        if (event.data && event.data.trim()) {
          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: event.data.trim()
          };
          setLogs(prev => [...prev, logEntry]);
        }
      }
    };

    logStreamRef.current.onerror = (error) => {
      console.error('❌ Log streaming error:', error);
      setIsStreaming(false);
      
      // Add error log entry
      const errorEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Log streaming connection lost. Attempting to reconnect...'
      };
      setLogs(prev => [...prev, errorEntry]);
      
      // Fallback to manual log fetching
      setTimeout(() => {
        fetchLogsManually();
      }, 2000);
    };

    // Handle special events
    logStreamRef.current.addEventListener('done', (event: any) => {
      console.log('✅ Execution completed:', event.data);
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Workflow execution completed'
      };
      setLogs(prev => [...prev, logEntry]);
      setRunning(false);
      setLoading(false);
      stopStreaming();
    });

  }, [projectId]);

  // Start status polling
  const startStatusPolling = useCallback(() => {
    const pollStatus = async () => {
      try {
        const statusData = await projectApi.getProjectStatus(projectId);
        setStatus(statusData);
        
        console.log('📊 Status update:', statusData);
        
        // Check if execution is complete
        if (statusData.status === 'completed' || 
            statusData.status === 'failed' || 
            statusData.status === 'timeout') {
          
          console.log('🏁 Execution finished with status:', statusData.status);
          
          setRunning(false);
          setLoading(false);
          
          if (statusData.status === 'failed') {
            setError(statusData.error || 'Execution failed');
          }
          
          stopStreaming();
          
          if (statusPollRef.current) {
            clearInterval(statusPollRef.current);
            statusPollRef.current = null;
          }
        }
      } catch (err) {
        console.warn('⚠️ Status polling error:', err);
      }
    };

    // Initial status check
    pollStatus();
    
    // Poll every 2 seconds
    statusPollRef.current = setInterval(pollStatus, 2000);
  }, [projectId]);

  // Fallback log fetching when streaming fails
  const fetchLogsManually = useCallback(async () => {
    try {
      console.log('📋 Fetching logs manually...');
      const logData = await projectApi.getExecutionLogs(projectId);
      
      if (logData && logData.logs) {
        const logEntries = logData.logs
          .filter(logLine => logLine && logLine.trim())
          .map((logLine, index) => ({
            timestamp: new Date().toISOString(),
            level: 'INFO' as const,
            message: logLine.trim()
          }));
        
        setLogs(prev => {
          // Avoid duplicates by checking if we already have these logs
          const existingMessages = new Set(prev.map(log => log.message));
          const newLogs = logEntries.filter(log => !existingMessages.has(log.message));
          return [...prev, ...newLogs];
        });
      }
    } catch (error) {
      console.warn('⚠️ Manual log fetch failed:', error);
    }
  }, [projectId]);

  // Stop all streaming and polling
  const stopStreaming = useCallback(() => {
    console.log('🛑 Stopping log streaming');
    
    if (logStreamRef.current) {
      logStreamRef.current.close();
      logStreamRef.current = null;
    }
    
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    
    setIsStreaming(false);
  }, []);

  // Retry execution
  const retryExecution = useCallback(async (fromStep?: string) => {
    setError(null);
    setRunning(true);
    
    try {
      console.log('🔄 Retrying execution from step:', fromStep);
      
      // Add retry log entry
      const retryEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: fromStep ? `Retrying from step: ${fromStep}` : 'Retrying execution...'
      };
      setLogs(prev => [...prev, retryEntry]);
      
      await projectApi.retryExecution(projectId, fromStep);
      
      startLogStreaming();
      startStatusPolling();
    } catch (err: any) {
      console.error('❌ Retry failed:', err);
      setError(err.response?.data?.error || err.message);
      setRunning(false);
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