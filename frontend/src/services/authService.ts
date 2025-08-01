import axios from 'axios';
import { User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async signup(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', { email, password });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
  },
};
