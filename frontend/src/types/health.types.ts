// src/types/health.types.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceStatus[];
  responseTime: number;
  message?: string;
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastChecked: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectionType: 'socket' | 'polling' | 'offline';
  lastConnected?: string;
  reconnectAttempts: number;
}

export interface HealthState {
  status: HealthStatus | null;
  connectionStatus: ConnectionStatus;
  loading: boolean;
  error: string | null;
  lastPolled: string | null;
  pollingInterval: number;
}