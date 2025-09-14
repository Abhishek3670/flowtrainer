// frontend/src/services/adminService.ts - ENHANCED VERSION
import axios from 'axios';
import qs from 'qs';
import { User, CreateUserDto, UpdateUserDto, UserListResponse } from '../types/user';

export interface DbConnection {
  id: string;
  name: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'redis';
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  type: string;
  version?: string;
  status: 'active' | 'inactive' | 'training' | 'failed';
  accuracy?: number;
  updatedAt: string;
  createdAt: string;
}

export interface SystemMetrics {
  userCount: number;
  workflowCount: number;
  dbConnectionCount: number;
  modelCount: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  activeExecutions: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const client = axios.create({
  baseURL: '/api/admin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // align with app usage
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // System Stats
  getSystemStats: async (): Promise<SystemMetrics> => {
    const { data } = await client.get('/system/stats');
    return data;
  },

  // Database Connections
  getDbConnections: async (params: { page?: number; limit?: number; q?: string } = {}): Promise<{
    connections: DbConnection[];
    totalCount: number;
    page: number;
    limit: number;
  }> => {
    const query = qs.stringify({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.q && { q: params.q }),
    });
    const { data } = await client.get(`/db-connections?${query}`);
    return {
      connections: data.connections || data.data || data,
      totalCount: data.totalCount || data.total || 0,
      page: data.page || params.page || 1,
      limit: data.limit || params.limit || 20,
    };
  },

  createDbConnection: async (payload: Omit<DbConnection, 'id' | 'status' | 'lastChecked' | 'createdAt' | 'updatedAt'>): Promise<DbConnection> => {
    const { data } = await client.post('/db-connections', payload);
    return data;
  },

  updateDbConnection: async (id: string, payload: Partial<DbConnection>): Promise<DbConnection> => {
    const { data } = await client.put(`/db-connections/${id}`, payload);
    return data;
  },

  deleteDbConnection: async (id: string): Promise<void> => {
    await client.delete(`/db-connections/${id}`);
  },

  testDbConnection: async (id: string): Promise<{ status: 'connected' | 'disconnected' | 'error'; message?: string }> => {
    const { data } = await client.post(`/db-connections/${id}/test`);
    return data;
  },

  // Models
  getModels: async (): Promise<ModelConfig[]> => {
    const { data } = await client.get('/models');
    return data.models || data.data || data;
  },

  createModel: async (payload: Omit<ModelConfig, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ModelConfig> => {
    const { data } = await client.post('/models', payload);
    return data;
  },

  updateModel: async (id: string, payload: Partial<ModelConfig>): Promise<ModelConfig> => {
    const { data } = await client.put(`/models/${id}`, payload);
    return data;
  },

  deleteModel: async (id: string): Promise<void> => {
    await client.delete(`/models/${id}`);
  },

  // Health Monitoring
  getHealthStatus: async (): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    services: Record<string, 'up' | 'down' | 'degraded'>;
    timestamp: string;
  }> => {
    const { data } = await client.get('/health');
    return data;
  },

  // User Management
  async getUsers(params: { page?: number; limit?: number; search?: string; role?: string } = {}) {
    const response = await client.get<UserListResponse>('/users', { params });
    return response.data;
  },

  async getUserById(id: string) {
    const response = await client.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserDto) {
    const response = await client.post<User>('/users', userData);
    return response.data;
  },

  async updateUser(id: string, userData: UpdateUserDto) {
    const response = await client.patch<User>(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: string) {
    await client.delete(`/users/${id}`);
  },

  async updateUserRole(id: string, role: 'admin' | 'user' | 'viewer') {
    const response = await client.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    const response = await client.patch<User>(`/users/${id}/status`, { status });
    return response.data;
  },

  async resetUserPassword(id: string, newPassword: string) {
    const response = await client.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },
};

export default adminService;
