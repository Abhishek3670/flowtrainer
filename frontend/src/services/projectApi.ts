// frontend/src/services/projectApi.ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface StatusResponse {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'timeout';
  progress?: number;
  currentStep?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface ExecutionLogsResponse {
  success: boolean;
  project_id: string;
  logs: string[];
  log_count: number;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  project_id: string;
  workflow_id: string;
  nodes_count: number;
  edges_count: number;
}

class ProjectApiService {
  /**
   * Execute complete workflow with nodes and edges
   */
  async executeCompleteWorkflow(
    projectId: string,
    workflowId: string, 
    nodes: any[], 
    edges: any[],
    priority: number = 1
  ): Promise<ExecutionResult> {
    console.log(`🚀 API: Executing workflow for project ${projectId}`);
    
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        nodes,
        edges,
        priority
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // For the SSE endpoint, we don't expect JSON response
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return {
        success: true,
        message: 'Execution started - streaming logs',
        project_id: projectId,
        workflow_id: workflowId,
        nodes_count: nodes.length,
        edges_count: edges.length
      };
    }

    return await response.json();
  }

  /**
   * Get project execution status
   */
  async getProjectStatus(projectId: string): Promise<StatusResponse> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get execution logs for a project
   */
  async getExecutionLogs(projectId: string): Promise<ExecutionLogsResponse> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/logs`);
    
    if (!response.ok) {
      throw new Error(`Failed to get logs: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create log stream EventSource (not used directly, but for reference)
   * This is handled in the hook using new EventSource()
   */
  createLogStream(projectId: string): EventSource {
    const streamUrl = `${API_BASE}/api/projects/${projectId}/logs/stream`;
    console.log(`📡 Creating log stream: ${streamUrl}`);
    return new EventSource(streamUrl);
  }

  /**
   * Retry execution from a specific step
   */
  async retryExecution(projectId: string, fromStep?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_step: fromStep
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generate execution plan (if needed separately)
   */
  async generateExecutionPlan(
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[]
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId,
        nodes,
        edges
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get execution results
   */
  async getExecutionResults(projectId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}/results`);
    
    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Clean up project
   */
  async cleanupProject(projectId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const projectApi = new ProjectApiService();