// src/services/healthService.ts
import axios from 'axios';
import { HealthStatus, ServiceStatus } from '../types/health.types';

// Prefer Vite env var, then CRA-style, then default to backend dev port 4000
const API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 5000, // 5 second timeout for health checks
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const healthService = {
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      const response = await api.get('/health');
      const responseTime = Date.now() - startTime;
      
      return {
        ...response.data,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Return degraded status if API is unreachable
      return {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        services: [],
        responseTime: 0,
        message: error.message || 'Health check failed',
      };
    }
  },

  // Utility function to determine overall health from services
  calculateOverallHealth(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (services.length === 0) return 'unhealthy';
    
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    if (downServices > 0) return 'unhealthy';
    if (degradedServices > 0) return 'degraded';
    return 'healthy';
  }
};