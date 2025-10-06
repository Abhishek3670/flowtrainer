// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'super-admin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// System configuration types
export interface SystemConfig {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
  version: number;
  updatedBy: string;
  updatedAt: string;
}

// Database metrics types
export interface DatabaseMetrics {
  size: string;
  collections: number;
  avgQueryTime: string;
  status: 'connected' | 'disconnected' | 'error';
  lastBackup?: string;
  storageUsed: number; // percentage
}

// Model related types
export interface Model {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'training' | 'inactive' | 'error';
  type: 'nlp' | 'cv' | 'recommendation' | 'other';
  lastTrained: string;
  accuracy: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Settings types
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  weeklyReport: boolean;
  securityAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number; // minutes
  passwordComplexity: 'low' | 'medium' | 'high';
}

export interface ApiSettings {
  enableApiAccess: boolean;
  apiKey: string;
  rateLimit: number; // requests per minute
}

export interface AllSettings {
  notifications: NotificationSettings;
  security: SecuritySettings;
  api: ApiSettings;
}

// Activity log types
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form data types
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'super-admin';
  password?: string;
  isActive: boolean;
}

export interface SystemConfigFormData {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
}

export interface ModelFormData {
  name: string;
  description?: string;
  type: 'nlp' | 'cv' | 'recommendation' | 'other';
  parameters?: Record<string, any>;
  trainingDataUrl?: string;
}