import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

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
  hasError?: boolean;
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

export interface ExecutionResponse {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
}




class WorkflowAPI {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    debugLog('WorkflowAPI', 'Making API request', { 
      url, 
      method: options.method || 'GET',
      hasBody: !!options.body 
    });
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      debugLog('WorkflowAPI', 'API response received', { 
        status: response.status, 
        statusText: response.statusText,
        url 
      });

      const data = await response.json();
      
      if (!response.ok) {
        debugLog('WorkflowAPI', 'API request failed', { 
          status: response.status, 
          error: data.message || data.error,
          url 
        });
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      debugLog('WorkflowAPI', 'API request successful', { 
        url, 
        dataKeys: Object.keys(data || {}),
        hasData: !!data?.data 
      });
      
      return data;
    } catch (error) {
      debugLog('WorkflowAPI', 'API request error', { 
        url, 
        error: error instanceof Error ? error.message : error 
      });
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
    debugLog('WorkflowAPI', 'Getting workflows', { params });
    
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ workflows: WorkflowData[]; pagination: any }>(endpoint);
  }

  async getWorkflow(id: string) {
    debugLog('WorkflowAPI', 'Getting workflow by ID', { workflowId: id });
    return this.request<WorkflowData>(`/workflows/${id}`);
  }

  async createWorkflow(workflow: Omit<WorkflowData, '_id'>) {
    debugLog('WorkflowAPI', 'Creating new workflow', { 
      name: workflow.name,
      category: workflow.category,
      nodeCount: workflow.nodes?.length || 0,
      edgeCount: workflow.edges?.length || 0
    });
    
    return this.request<WorkflowData>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<WorkflowData>) {
    debugLog('WorkflowAPI', 'Updating workflow', { 
      workflowId: id,
      updateFields: Object.keys(workflow),
      nodeCount: workflow.nodes?.length,
      edgeCount: workflow.edges?.length
    });
    
    return this.request<WorkflowData>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string) {
    debugLog('WorkflowAPI', 'Deleting workflow', { workflowId: id });
    
    return this.request<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateWorkflow(id: string) {
    debugLog('WorkflowAPI', 'Duplicating workflow', { workflowId: id });
    
    return this.request<WorkflowData>(`/workflows/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async executeWorkflow(workflowId: string) {
    debugLog('WorkflowAPI', 'Executing workflow', { workflowId });
    
    return this.request<ExecutionResponse>(`/workflows/${workflowId}/execute`, {
      method: 'POST',
    });
  }
}

export const workflowAPI = new WorkflowAPI();
