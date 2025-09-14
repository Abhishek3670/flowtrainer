import axios from 'axios';
import { User, SystemConfig, DatabaseMetrics, Model, ActivityLog, ApiResponse } from '../types';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User management API
export const userApi = {
  // Get all users with pagination
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) => 
    api.get<ApiResponse<{ users: User[]; total: number }>>('/users', { params }),
  
  // Get a single user by ID
  getUser: (id: string) => 
    api.get<ApiResponse<User>>(`/users/${id}`),
  
  // Create a new user
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<User>>('/users', userData),
  
  // Update a user
  updateUser: (id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<User>>(`/users/${id}`, userData),
  
  // Delete a user
  deleteUser: (id: string) => 
    api.delete<ApiResponse<null>>(`/users/${id}`),
  
  // Update user role
  updateUserRole: (id: string, role: string) => 
    api.put<ApiResponse<User>>(`/users/${id}/role`, { role }),
};

// System configuration API
export const systemApi = {
  // Get all system configurations
  getConfigs: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get<ApiResponse<{ configs: SystemConfig[]; total: number }>>('/system/config', { params }),
  
  // Get a single config by key
  getConfig: (key: string) => 
    api.get<ApiResponse<SystemConfig>>(`/system/config/${key}`),
  
  // Create or update a config
  updateConfig: (key: string, value: any, description?: string, isPublic: boolean = false) => 
    api.put<ApiResponse<SystemConfig>>(`/system/config/${key}`, { value, description, isPublic }),
  
  // Delete a config
  deleteConfig: (key: string) => 
    api.delete<ApiResponse<null>>(`/system/config/${key}`),
  
  // Get config history
  getConfigHistory: (key: string) => 
    api.get<ApiResponse<Array<SystemConfig & { updatedBy: string }>>>(`/system/config/${key}/history`),
};

// Database management API
export const databaseApi = {
  // Get database metrics
  getMetrics: () => 
    api.get<ApiResponse<DatabaseMetrics>>('/database/metrics'),
  
  // Create a backup
  createBackup: () => 
    api.post<ApiResponse<{ backupId: string; message: string }>>('/database/backup'),
  
  // Optimize database
  optimize: () => 
    api.post<ApiResponse<{ message: string }>>('/database/optimize'),
  
  // Run a query
  runQuery: (query: string) => 
    api.post<ApiResponse<any>>('/database/query', { query }),
};

// Model management API
export const modelApi = {
  // Get all models
  getModels: (params?: { status?: string; type?: string }) => 
    api.get<ApiResponse<{ models: Model[] }>>('/models', { params }),
  
  // Get a single model by ID
  getModel: (id: string) => 
    api.get<ApiResponse<Model>>(`/models/${id}`),
  
  // Create a new model
  createModel: (modelData: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Model>>('/models', modelData),
  
  // Update a model
  updateModel: (id: string, modelData: Partial<Omit<Model, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<Model>>(`/models/${id}`, modelData),
  
  // Delete a model
  deleteModel: (id: string) => 
    api.delete<ApiResponse<null>>(`/models/${id}`),
  
  // Train a model
  trainModel: (id: string) => 
    api.post<ApiResponse<{ jobId: string; message: string }>>(`/models/${id}/train`),
  
  // Deploy a model
  deployModel: (id: string, environment: 'staging' | 'production') => 
    api.post<ApiResponse<{ deploymentId: string; message: string }>>(`/models/${id}/deploy`, { environment }),
};

// Activity log API
export const activityApi = {
  // Get activity logs
  getLogs: (params?: { 
    userId?: string; 
    action?: string; 
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<{ logs: ActivityLog[]; total: number }>>('/activity/logs', { params }),
  
  // Get activity log by ID
  getLog: (id: string) => 
    api.get<ApiResponse<ActivityLog>>(`/activity/logs/${id}`),
};

// Settings API
export const settingsApi = {
  // Get all settings
  getSettings: () => 
    api.get<ApiResponse<{
      notifications: any;
      security: any;
      api: any;
    }>>('/settings'),
  
  // Update settings
  updateSettings: (category: 'notifications' | 'security' | 'api', settings: any) => 
    api.put<ApiResponse<any>>(`/settings/${category}`, settings),
  
  // Regenerate API key
  regenerateApiKey: () => 
    api.post<ApiResponse<{ apiKey: string }>>('/settings/regenerate-api-key'),
};

export default {
  user: userApi,
  system: systemApi,
  database: databaseApi,
  model: modelApi,
  activity: activityApi,
  settings: settingsApi,
};
