import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

export interface StatusResponse {
  project_id: string;
  status: 'completed' | 'running' | 'failed' | 'not_found';
  results?: Record<string, any>;
  output_files?: string[];
  error?: string;
}

export const projectApi = {
  generatePlan: (projectId: string, data: { workflowId: string; nodes: any[]; edges: any[] }) =>
    API.post(`/api/projects/${projectId}/plan`, data),

  execute: (projectId: string) =>
    API.post(`/api/projects/${projectId}/execute`),

  getStatus: (projectId: string) =>
    API.get<StatusResponse>(`/api/projects/${projectId}/status`),
};
