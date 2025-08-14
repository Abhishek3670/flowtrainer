import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useExecutionStatus(
  executionId: string | null,
  onStatus: (nodeId: string, status: string) => void
) {
  useEffect(() => {
    if (!executionId) return;
    
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      query: { executionId },
      transports: ['websocket', 'polling'] // Fallback to polling if websocket fails
    });

    socket.on('connect', () => {
      console.log('Socket connected for execution:', executionId);
    });

    socket.on('node-status', ({ nodeId, status }) => {
      onStatus(nodeId, status);
    });

    socket.on('execution-complete', () => {
      console.log('Execution complete');
      socket.disconnect();
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [executionId, onStatus]);
}
