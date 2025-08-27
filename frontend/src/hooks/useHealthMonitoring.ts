// src/hooks/useHealthMonitoring.ts
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchHealthStatus, updateConnectionStatus } from '../store/slices/healthSlice';
import { socketService } from '../services/socketService';

export const useHealthMonitoring = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pollingInterval, status } = useSelector((state: RootState) => state.health);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start health monitoring
  const startMonitoring = () => {
    // Initial fetch
    dispatch(fetchHealthStatus());
    
    // Set up polling
    intervalRef.current = setInterval(() => {
      dispatch(fetchHealthStatus());
    }, pollingInterval);
  };

  // Stop health monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Monitor Socket.IO connection
  useEffect(() => {
    const updateSocketStatus = () => {
      const isConnected = socketService.isConnected();
      dispatch(updateConnectionStatus({
        isConnected,
        connectionType: isConnected ? 'socket' : 'polling',
        lastConnected: isConnected ? new Date().toISOString() : undefined,
      }));
    };

    // Initial status check
    updateSocketStatus();

    // Listen for socket events if available
    if (socketService.socket) {
      socketService.socket.on('connect', updateSocketStatus);
      socketService.socket.on('disconnect', updateSocketStatus);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('connect', updateSocketStatus);
        socketService.socket.off('disconnect', updateSocketStatus);
      }
    };
  }, [dispatch]);

  // Auto-start monitoring when component mounts
  useEffect(() => {
    startMonitoring();
    return stopMonitoring;
  }, [pollingInterval]);

  return {
    status,
    startMonitoring,
    stopMonitoring,
  };
};