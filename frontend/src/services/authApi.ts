import axios from 'axios';

// Create an axios instance for authentication
const authApi = axios.create({
  baseURL: '/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
authApi.interceptors.request.use(
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
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'super-admin';
  permissions: string[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  accessToken: string;
  user: User;
}

export const authApiService = {
  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await authApi.post<LoginResponse>('/login', { email, password });
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<RegisterResponse> => {
    const response = await authApi.post<RegisterResponse>('/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await authApi.get<User>('/me');
    return response.data;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    await authApi.post('/logout');
  },

  /**
   * Initiate password reset process
   */
  forgotPassword: async (email: string): Promise<void> => {
    await authApi.post('/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await authApi.post('/reset-password', { token, newPassword });
  },

  /**
   * Reset password with current password (for first-time users)
   */
  resetPasswordWithCurrent: async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
    await authApi.post('/reset-password-current', { email, currentPassword, newPassword });
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<string> => {
    const response = await authApi.post<{ accessToken: string }>('/refresh');
    return response.data.accessToken;
  },
};

export default authApi;