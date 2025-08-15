// frontend/src/services/projectApi.ts

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
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        workflowId,
        nodes,
        edges
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to generate execution plan');
    }

    return await response.json();
  }

  /** Execute a project workflow */
  async executeProject(
    projectId: string, 
    priority: number = 1,
    timeoutMinutes?: number
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${projectId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priority,
        timeout_minutes: timeoutMinutes
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to execute project');
    }

    return await response.json();
  }

  /** Get project execution status */
  async getProjectStatus(projectId: string): Promise<ExecutionStatus> {
    const response = await fetch(`${this.baseUrl}/${projectId}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get project status');
    }

    const data = await response.json();
    return data as ExecutionStatus;
  }

  /** Get project execution logs */
  async getProjectLogs(projectId: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/${projectId}/logs`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get project logs');
    }

    const data = await response.json();
    return data.logs || [];
  }

  /** Stream project logs in real-time */
  createLogStream(projectId: string): EventSource {
    return new EventSource(`${this.baseUrl}/${projectId}/logs?stream=true`);
  }

  /** Retry failed execution */
  async retryExecution(projectId: string, fromStep?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${projectId}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_step: fromStep
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to retry execution');
    }

    return await response.json();
  }

  /** Clean up project files */
  async cleanupProject(projectId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to cleanup project');
    }

    return await response.json();
  }

  /** Get system status and metrics */
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await fetch(`${this.baseUrl}/system/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to get system status');
    }

    const data = await response.json();
    return data.system as SystemStatus;
  }

  /** Create real-time events stream for system updates */
  createEventStream(): EventSource {
    return new EventSource(`${this.baseUrl}/events`);
  }

  /** Execute complete workflow (generate plan + execute) */
  async executeCompleteWorkflow(
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[],
    priority: number = 1,
    timeoutMinutes?: number
  ): Promise<{
    planGeneration: any;
    execution: any;
  }> {
    // Step 1: Generate execution plan
    const planResult = await this.generateExecutionPlan(
      projectId,
      workflowId,
      nodes,
      edges
    );

    // Step 2: Execute the project
    const executionResult = await this.executeProject(
      projectId,
      priority,
      timeoutMinutes
    );

    return {
      planGeneration: planResult,
      execution: executionResult
    };
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
        onStatusUpdate(status);

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
