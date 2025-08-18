// frontend/src/services/projectApi.ts
import axios from 'axios';

// API configuration
const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000',
});

export interface ExecutionStatus {
  project_id: string;
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  current_step?: string;
  progress?: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
  logs?: string[];
}

export interface StatusResponse {
  project_id: string;
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  current_step?: string;
  progress?: number;
  error?: string;
  started_at?: string;
  completed_at?: string;
  results?: Record<string, any>;
  output_files?: string[];
}

export interface SystemStatusResponse {
  success?: boolean;
  timestamp?: string;
  system?: {
    max_concurrent_executions: number;
    running_executions: number;
    queued_executions: number;
    capacity_utilization: number;
    queue: Array<{
      project_id: string;
      priority: number;
      queued_at: string;
    }>;
    running: Array<{
      project_id: string;
      current_step?: string;
      progress?: number;
      started_at: string;
    }>;
  };
  // Direct properties (fallback)
  max_concurrent_executions?: number;
  running_executions?: number;
  queued_executions?: number;
  capacity_utilization?: number;
  queue?: Array<{
    project_id: string;
    priority: number;
    queued_at: string;
  }>;
  running?: Array<{
    project_id: string;
    current_step?: string;
    progress?: number;
    started_at: string;
  }>;
}

export interface SystemStatus {
  max_concurrent_executions: number;
  running_executions: number;
  queued_executions: number;
  total_projects: number;
  capacity_utilization: number;
  queue: Array<{
    project_id: string;
    priority: number;
    queued_at: string;
  }>;
  running: Array<{
    project_id: string;
    current_step?: string;
    progress?: number;
    started_at: string;
  }>;
}

class ProjectApiService {
  private baseUrl = '/api/projects';

  /** Generate execution plan for a project */
  async generateExecutionPlan(
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[]
  ): Promise<{ success: boolean; execution_id: string }> {
    const response = await API.post(`${this.baseUrl}/${projectId}/plan`, {
      workflowId,
      nodes,
      edges
    });
    return response.data;
  }

  /** Execute a complete workflow */
  async executeCompleteWorkflow(
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[],
    priority: number = 1
  ): Promise<{ success: boolean; execution_id: string }> {
    // First generate the plan
    await this.generateExecutionPlan(projectId, workflowId, nodes, edges);
    const response = await API.post(
      `${this.baseUrl}/${projectId}/execute`,
      {
        nodes,
        edges,
        priority,
        timeout_minutes: 60
      }
    );
    return response.data;
  }

  /** Execute project with options */
  async executeWithOptions(
    projectId: string,
    options: { priority?: number; timeout_minutes?: number } = {}
  ): Promise<{ success: boolean; execution_id: string }> {
    const response = await API.post(`${this.baseUrl}/${projectId}/execute`, options);
    return response.data;
  }

  /** Get system status */
  async getSystemStatus(): Promise<SystemStatusResponse> {
    const response = await API.get<SystemStatusResponse>(`${this.baseUrl}/system/status`);
    return response.data;
  }

  /** Get execution logs */
  async getExecutionLogs(projectId: string): Promise<{ logs: string[]; log_count: number }> {
    const response = await API.get<{ logs: string[]; log_count: number }>(`${this.baseUrl}/${projectId}/logs`);
    return response.data;
  }

  /** Retry execution */
  async retryExecution(projectId: string, fromStep?: string): Promise<{ success: boolean }> {
    const response = await API.post(`${this.baseUrl}/${projectId}/retry`, { from_step: fromStep });
    return response.data;
  }

  /** Get project status */
  async getProjectStatus(projectId: string): Promise<StatusResponse> {
    const response = await API.get<StatusResponse>(`${this.baseUrl}/${projectId}/status`);
    return response.data;
  }

  /** Poll for execution status updates */
  async pollExecutionStatus(
    projectId: string,
    onStatusUpdate: (status: ExecutionStatus) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    intervalMs: number = 2000
  ): Promise<() => void> {
    let polling = true;

    const poll = async () => {
      try {
        const status = await this.getProjectStatus(projectId);
        onStatusUpdate(status as ExecutionStatus);

        if (status.status === 'completed' ||
          status.status === 'failed' ||
          status.status === 'timeout') {
          polling = false;
          onComplete();
        } else if (polling) {
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        if (polling) {
          onError(error as Error);
          setTimeout(poll, intervalMs * 2); // Back off on error
        }
      }
    };

    poll();

    // Return stop function
    return () => {
      polling = false;
    };
  }

  /** Create log stream */
  createLogStream(projectId: string): EventSource {
    return new EventSource(`${this.baseUrl}/${projectId}/logs/stream`);
  }

  /** Create event stream */
  createEventStream(): EventSource {
    return new EventSource(`${this.baseUrl}/events`);
  }

  /** Cleanup project */
  async cleanupProject(projectId: string): Promise<{ success: boolean }> {
    const response = await API.delete(`${this.baseUrl}/${projectId}`);
    return response.data;
  }

  /** Batch operations for multiple projects */
  async batchExecute(
    projects: Array<{
      projectId: string;
      workflowId: string;
      nodes: any[];
      edges: any[];
      priority?: number;
    }>
  ): Promise<Array<{ projectId: string; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      projects.map(async (project) => {
        try {
          await this.executeCompleteWorkflow(
            project.projectId,
            project.workflowId,
            project.nodes,
            project.edges,
            project.priority || 1
          );
          return { projectId: project.projectId, success: true };
        } catch (error) {
          return {
            projectId: project.projectId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { projectId: 'unknown', success: false, error: 'Promise rejected' }
    );
  }

  /** Get execution history for analytics */
  async getExecutionHistory(
    limit: number = 100,
    status?: string
  ): Promise<ExecutionStatus[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseUrl}/history?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get execution history');
    }

    const data = await response.json();
    return data.history || [];
  }
}

export const projectApi = new ProjectApiService();
