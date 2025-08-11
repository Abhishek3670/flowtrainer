import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useExecutionStatus(
  executionId: string | null,
  onStatus: (nodeId: string, status: string) => void
) {
  useEffect(() => {
    if (!executionId) return;
    const socket = io(process.env.REACT_APP_SOCKET_URL!, {
      query: { executionId }
    });

    socket.on('node-status', ({ nodeId, status }) => {
      onStatus(nodeId, status);
    });

    socket.on('execution-complete', () => {
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [executionId, onStatus]);
}
