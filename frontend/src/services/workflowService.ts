import axios from 'axios';
import { Workflow } from '../types';

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

export const workflowService = {
  async getWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows');
    return response.data;
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow> {
    const response = await api.post('/workflows', workflow);
    return response.data;
  },

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const response = await api.put(`/workflows/${id}`, workflow);
    return response.data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  async getWorkflowHistory(id: string): Promise<any[]> {
    const response = await api.get(`/workflows/${id}/history`);
    return response.data;
  },
};
