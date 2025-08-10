import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface WorkflowData {
  _id?: string;
  name: string;
  description?: string;
  nodes: ReactFlowNode<NodeData>[];
  edges: ReactFlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
  category?: 'ml-training' | 'data-processing' | 'computer-vision' | 'other';
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  lastModified?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
export interface NodeData {
  label: string;
  nodeName?: string;
  isLive?: boolean;
  rtspUrl?: string;
  selectedFile?: {
    fileId: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    uploadedAt: string;
  };
  status?: 'empty' | 'uploading' | 'ready' | 'error' | 'configuring';
  onDelete?: (nodeId: string) => void;
}


class WorkflowAPI {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getWorkflows(params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request<{ workflows: WorkflowData[]; pagination: any }>(
      `/workflows${queryString ? `?${queryString}` : ''}`
    );
  }

  async getWorkflow(id: string) {
    return this.request<WorkflowData>(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Omit<WorkflowData, '_id'>) {
    return this.request<WorkflowData>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<WorkflowData>) {
    return this.request<WorkflowData>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateWorkflow(id: string) {
    return this.request<WorkflowData>(`/workflows/${id}/duplicate`, {
      method: 'POST',
    });
  }
}

export const workflowAPI = new WorkflowAPI();
