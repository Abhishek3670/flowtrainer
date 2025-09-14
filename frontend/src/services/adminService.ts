import axios from 'axios';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '../types';

export type DbConnection = {
  id: string;
  name: string;
  type: string;
  host: string;
  port?: number;
  username?: string;
};

export type ModelConfig = {
  id: string;
  name: string;
  version?: string;
  updatedAt?: string;
};

export type SystemMetrics = {
  status: string;
  cpu?: any;
  memory?: any;
  [key: string]: any;
};

const client = axios.create({ baseURL: '/api/admin' });

export const adminService = {
  getDbConnections: async (): Promise<DbConnection[]> => {
    const { data } = await client.get('/db-connections');
    return data;
  },
  createDbConnection: async (payload: Partial<DbConnection>): Promise<DbConnection> => {
    const { data } = await client.post('/db-connections', payload);
    return data;
  },
  updateDbConnection: async (id: string, payload: Partial<DbConnection>): Promise<DbConnection> => {
    const { data } = await client.put(`/db-connections/${id}`, payload);
    return data;
  },
  deleteDbConnection: async (id: string): Promise<{ id: string }> => {
    const { data } = await client.delete(`/db-connections/${id}`);
    return data;
  },
  getModels: async (): Promise<ModelConfig[]> => {
    const { data } = await client.get('/models');
    return data;
  },
  createModel: async (payload: Partial<ModelConfig>): Promise<ModelConfig> => {
    const { data } = await client.post('/models', payload);
    return data;
  },
  updateModel: async (id: string, payload: Partial<ModelConfig>): Promise<ModelConfig> => {
    const { data } = await client.put(`/models/${id}`, payload);
    return data;
  },
  deleteModel: async (id: string): Promise<{ id: string }> => {
    const { data } = await client.delete(`/models/${id}`);
    return data;
  },
  getSystemStats: async (): Promise<SystemMetrics> => {
    const { data } = await client.get('/system/stats');
    return data;
  },

  // User Management
  getUsers: async (filters?: UserFilters): Promise<User[]> => {
    const { data } = await client.get('/users', { params: filters });
    return data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const { data } = await client.get('/users/search', { params: { q: query } });
    return data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await client.get(`/users/${id}`);
    return data;
  },

  createUser: async (userData: CreateUserDto): Promise<User> => {
    const { data } = await client.post('/users', userData);
    return data;
  },

  updateUser: async (id: string, userData: UpdateUserDto): Promise<User> => {
    const { data } = await client.patch(`/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id: string): Promise<{ id: string }> => {
    const { data } = await client.delete(`/users/${id}`);
    return data;
  },

  resetUserPassword: async (id: string, newPassword: string): Promise<void> => {
    await client.post(`/users/${id}/reset-password`, { newPassword });
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const { data } = await client.patch(`/users/${id}/status`, { isActive });
    return data;
  },
};
