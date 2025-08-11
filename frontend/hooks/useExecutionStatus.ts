import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

export function useExecutionStatus(
  executionId: string | null,
  onStatus: (nodeId: string, status: string) => void
) {
  debugLog('useExecutionStatus', 'Hook called', { executionId });

  useEffect(() => {
    if (!executionId) {
      debugLog('useExecutionStatus', 'No execution ID provided, skipping WebSocket connection');
      return;
    }

    debugLog('useExecutionStatus', 'Connecting to WebSocket', { 
      executionId, 
      socketUrl: process.env.REACT_APP_SOCKET_URL 
    });

    const socket = io(process.env.REACT_APP_SOCKET_URL!, {
      query: { executionId }
    });

    socket.on('connect', () => {
      debugLog('useExecutionStatus', 'WebSocket connected', { 
        executionId, 
        socketId: socket.id 
      });
    });

    socket.on('connect_error', (error) => {
      debugLog('useExecutionStatus', 'WebSocket connection error', { 
        executionId, 
        error: error.message 
      });
    });

    socket.on('node-status', ({ nodeId, status }) => {
      debugLog('useExecutionStatus', 'Node status update received', { 
        executionId, 
        nodeId, 
        status 
      });
      onStatus(nodeId, status);
    });

    socket.on('execution-complete', () => {
      debugLog('useExecutionStatus', 'Execution completed, disconnecting WebSocket', { executionId });
      socket.disconnect();
    });

    socket.on('disconnect', (reason) => {
      debugLog('useExecutionStatus', 'WebSocket disconnected', { 
        executionId, 
        reason 
      });
    });

    return () => {
      debugLog('useExecutionStatus', 'Cleaning up WebSocket connection', { executionId });
      socket.disconnect();
    };
  }, [executionId, onStatus]);
}
