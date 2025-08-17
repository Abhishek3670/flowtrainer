// backend/src/services/projectService.ts
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { EventEmitter } from 'events';
import { WorkflowService, WorkflowNode } from './workflow.service';

const execAsync = promisify(exec);

interface ExecutionPlan {
  workflow_id: string;
  execution_id: string;
  nodes: any[];
  edges: any[];
  execution_order: string[];
  config: any;
}

interface ExecutionStatus {
  project_id: string;
  execution_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  current_step?: string;
  progress?: number;
  error?: string;
  started_at?: Date;
  completed_at?: Date;
  logs?: string[];
  container_id?: string;
}

interface QueuedExecution {
  projectId: string;
  priority: number;
  enqueuedAt: Date;
  timeoutMinutes: number;
}

export class ProjectService extends EventEmitter {
  private projectsRoot = path.join(process.cwd(), 'workflows');
  private dockerImage = 'flowcraft/ml-engine:latest';
  private executionQueue: QueuedExecution[] = [];
  private runningExecutions = new Map<string, ExecutionStatus>();
  private executionHistory = new Map<string, ExecutionStatus[]>();
  private workflowSvc = new WorkflowService();
  private readonly maxRetries = 2;
  
  // Configuration from environment
  private readonly MAX_CONCURRENT_EXECUTIONS = parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '3');
  private readonly MAX_EXECUTION_TIME_MINUTES = parseInt(process.env.MAX_EXECUTION_TIME_MINUTES || '60');
  private readonly MAX_MEMORY_MB = parseInt(process.env.MAX_MEMORY_MB || '2048');
  private readonly PROJECT_CLEANUP_DAYS = parseInt(process.env.PROJECT_CLEANUP_DAYS || '7');

  constructor() {
    super();
    this.startQueueProcessor();
    this.startCleanupJob();
  }

  async executeMLWorkflow(projectId: string, emitter: EventEmitter) {
    const workflow = await this.workflowSvc.loadWorkflow(projectId);

    for (const node of workflow.nodes) {
      emitter.emit('log', `\n=== Node ${node.id} (${node.type}) ===\n`);

      // 1. Serialize node input for ML engine
      const dataDir = path.join(process.cwd(), 'data', projectId);
      const inputPath = path.join(dataDir, `${node.id}_input.json`);
      fsSync.writeFileSync(inputPath, JSON.stringify(node.data || {}, null, 2));
      emitter.emit('log', `Wrote input JSON to ${inputPath}\n`);

      // 2. Build Docker args
      const args = [
        'run', '--rm',
        '-v', `${dataDir}:/app/data`,
        'flowtrainer-ml',
        'python', 'execute_workflow.py',
        '--project-id', projectId,
        '--node-id', node.id,
        '--type', node.type,
        '--params', JSON.stringify(node.data || {})
      ];

      // 3. Retry loop for robustness
      let attempt = 0;
      while (attempt <= this.maxRetries) {
        attempt++;
        emitter.emit('log', `Starting container (attempt ${attempt})...\n`);
        const proc = spawn('docker', args);

        proc.stdout.on('data', d => emitter.emit('log', d.toString()));
        proc.stderr.on('data', d => emitter.emit('log', d.toString()));

        const exitCode: number = await new Promise((resolve) => {
          proc.on('exit', resolve);
        });

        if (exitCode === 0) {
          emitter.emit('log', `Node ${node.id} succeeded.\n`);
          break;
        } else if (attempt <= this.maxRetries) {
          emitter.emit('log', `Node ${node.id} failed (code ${exitCode}), retrying...\n`);
        } else {
          emitter.emit('log', `Node ${node.id} failed after ${attempt} attempts.\n`);
          throw new Error(`Node ${node.id} failed`);
        }
      }

      // 4. Load & persist result
      const resultPath = path.join(dataDir, 'results', `${node.id}_result.json`);
      if (fsSync.existsSync(resultPath)) {
        const result = JSON.parse(fsSync.readFileSync(resultPath, 'utf-8'));
        node.result = result;
      } else {
        node.result = { error: 'Result file missing' };
      }
      await this.workflowSvc.updateNodeResult(projectId, node.id, node.result);
    }

    emitter.emit('done', { status: 'success' });
  }

  /** Execute ML workflow with existing node/edge structure (legacy compatibility) */
  async executeMLWorkflowLegacy(projectId: string, nodes: any[], edges: any[], emitter: EventEmitter): Promise<void> {
    try {
      // 1. Ensure necessary directories exist
      await this.ensureExecutionDirectories(projectId);
      
      // 2. Get execution order using topological sort
      const executionOrder = this.calculateExecutionOrder(nodes, edges);
      
      emitter.emit('log', `🚀 Starting ML workflow execution for project ${projectId}\n`);
      emitter.emit('log', `📋 Execution order: ${executionOrder.join(' → ')}\n`);

      // 3. Iterate nodes in topological order
      for (const nodeId of executionOrder) {
        const node = nodes.find((n: any) => n.id === nodeId);
        if (!node) {
          emitter.emit('log', `⚠️ Node ${nodeId} not found, skipping...\n`);
          continue;
        }

        emitter.emit('log', `\n🔄 Starting node ${node.id} (${node.type || 'unknown'})…\n`);

        // 4. Build Docker command based on node type
        const args = [
          'run',
          '--rm',
          '-v', `${process.cwd()}/workflows/${projectId}:/app/data`,
          '-v', `${process.cwd()}/results/${projectId}:/app/results`,
          'flowcraft-ml-engine',
          'python',
          'execute_workflow.py',
          '--node-id', node.id,
          '--type', node.type || 'customNode',
          '--params', JSON.stringify(node.data || {}),
          '--project-id', projectId
        ];

        const proc = spawn('docker', args);

        // 5. Stream stdout/stderr to SSE emitter
        proc.stdout.on('data', (chunk) => {
          emitter.emit('log', chunk.toString());
        });
        
        proc.stderr.on('data', (chunk) => {
          emitter.emit('log', `⚠️ ${chunk.toString()}`);
        });

        // 6. Await completion
        await new Promise<void>((resolve, reject) => {
          proc.on('exit', (code) => {
            if (code === 0) {
              emitter.emit('log', `✅ Node ${node.id} completed successfully.\n`);
              resolve();
            } else {
              emitter.emit('log', `❌ Node ${node.id} failed with exit code ${code}.\n`);
              reject(new Error(`Docker exited with code ${code}`));
            }
          });

          // Handle process errors
          proc.on('error', (error) => {
            emitter.emit('log', `💥 Process error for node ${node.id}: ${error.message}\n`);
            reject(error);
          });
        });

        // 7. Load result JSON and persist
        const resultPath = path.resolve(
          process.cwd(),
          'results',
          projectId,
          `${node.id}_result.json`
        );
        
        try {
          if (await fs.access(resultPath).then(() => true).catch(() => false)) {
            const raw = await fs.readFile(resultPath, 'utf-8');
            const result = JSON.parse(raw);
            node.result = result;
            emitter.emit('log', `📁 Loaded result for ${node.id}.\n`);
          } else {
            emitter.emit('log', `⚠️ Result file missing for ${node.id}.\n`);
          }
        } catch (error) {
          emitter.emit('log', `⚠️ Error loading result for ${node.id}: ${error}\n`);
        }

        // 8. Update workflow state
        try {
          await this.workflowSvc.updateNodeResult(projectId, node.id, node.result);
          emitter.emit('log', `💾 Updated workflow state for ${node.id}.\n`);
        } catch (error) {
          emitter.emit('log', `⚠️ Error updating workflow state for ${node.id}: ${error}\n`);
        }
      }

      emitter.emit('log', `\n🎉 ML workflow execution completed successfully!\n`);
      emitter.emit('done', { status: 'success', projectId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      emitter.emit('log', `\n💥 Workflow execution failed: ${errorMessage}\n`);
      emitter.emit('done', { status: 'failed', projectId, error: errorMessage });
      throw error;
    }
  }

  /** Ensure necessary directories exist for Docker execution */
  private async ensureExecutionDirectories(projectId: string): Promise<void> {
    const projectPath = path.join(process.cwd(), 'workflows', projectId);
    const resultsPath = path.join(process.cwd(), 'results', projectId);
    
    try {
      // Create project workflow directory
      await fs.mkdir(projectPath, { recursive: true });
      
      // Create results directory
      await fs.mkdir(resultsPath, { recursive: true });
      
      console.log(`📁 Created execution directories for project ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to create execution directories for project ${projectId}:`, error);
      throw new Error(`Failed to create execution directories: ${error}`);
    }
  }

  /** Calculate execution order using topological sort */
  private calculateExecutionOrder(nodes: any[], edges: any[]): string[] {
    // Simple topological sort
    const graph: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    // Initialize graph
    nodes.forEach(node => {
      graph[node.id] = [];
      inDegree[node.id] = 0;
    });
    
    // Build graph from edges
    edges.forEach(edge => {
      graph[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });
    
    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];
    
    // Find nodes with no dependencies
    Object.keys(inDegree).forEach(node => {
      if (inDegree[node] === 0) {
        queue.push(node);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      graph[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    return result;
  }

  /** Generate and save execution plan JSON */
  async generateExecutionPlan(
    projectId: string,
    workflowId: string,
    nodes: any[],
    edges: any[]
  ): Promise<void> {
    // Ensure project directory exists
    const projectPath = path.join(this.projectsRoot, projectId);
    const configPath = path.join(projectPath, 'config');
    const logsPath = path.join(projectPath, 'logs');
    
    await fs.mkdir(configPath, { recursive: true });
    await fs.mkdir(logsPath, { recursive: true });
    
    // Transform nodes to match ML engine expected format
    const transformedNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'customNode',
      data: node.data || {},
      position: node.position || { x: 0, y: 0 }
    }));

    // Generate execution order using topological sort
    const executionOrder = this.calculateExecutionOrder(transformedNodes, edges);
    
    // Create execution plan
    const executionPlan: ExecutionPlan = {
      workflow_id: workflowId,
      execution_id: `exec_${Date.now()}`,
      nodes: transformedNodes,
      edges: edges,
      execution_order: executionOrder,
      config: {
        project_path: '/workspace',
        output_path: '/workspace/output',
        temp_path: '/workspace/temp',
        logs_path: '/workspace/logs'
      }
    };

    const planPath = path.join(configPath, 'execution_plan.json');
    await fs.writeFile(planPath, JSON.stringify(executionPlan, null, 2));
    
    console.log(`✅ Generated execution plan for project ${projectId}`);
  }

  /** Queue execution with priority and resource management */
  async queueExecution(
    projectId: string, 
    priority: number = 1,
    timeoutMinutes?: number
  ): Promise<void> {
    const queuedExecution: QueuedExecution = {
      projectId,
      priority,
      enqueuedAt: new Date(),
      timeoutMinutes: timeoutMinutes || this.MAX_EXECUTION_TIME_MINUTES
    };

    // Add to queue and sort by priority (higher priority first)
    this.executionQueue.push(queuedExecution);
    this.executionQueue.sort((a, b) => b.priority - a.priority);

    // Initialize execution status
    const status: ExecutionStatus = {
      project_id: projectId,
      execution_id: `exec_${Date.now()}`,
      status: 'queued',
      started_at: new Date()
    };

    this.runningExecutions.set(projectId, status);

    console.log(`📋 Queued execution for project ${projectId} (Priority: ${priority})`);
    console.log(`📊 Queue length: ${this.executionQueue.length}, Running: ${Array.from(this.runningExecutions.values()).filter(s => s.status === 'running').length}`);

    this.emit('execution_queued', { projectId, queuePosition: this.executionQueue.length });
  }

  /** Process execution queue */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 5000); // Check queue every 5 seconds
  }

  private async processQueue(): Promise<void> {
    const runningCount = Array.from(this.runningExecutions.values())
      .filter(status => status.status === 'running').length;

    if (runningCount >= this.MAX_CONCURRENT_EXECUTIONS || this.executionQueue.length === 0) {
      return;
    }

    const nextExecution = this.executionQueue.shift();
    if (!nextExecution) return;

    try {
      await this.executeWorkflowInternal(nextExecution.projectId, nextExecution.timeoutMinutes);
    } catch (error) {
      console.error(`❌ Failed to start execution for project ${nextExecution.projectId}:`, error);
      this.markExecutionFailed(nextExecution.projectId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /** Internal workflow execution with comprehensive error handling */
  private async executeWorkflowInternal(projectId: string, timeoutMinutes: number): Promise<void> {
    const projectPath = path.join(this.projectsRoot, projectId);
    const planPath = path.join(projectPath, 'config', 'execution_plan.json');
    const logPath = path.join(projectPath, 'logs', 'execution.log');

    // Update status to running
    const status = this.runningExecutions.get(projectId);
    if (status) {
      status.status = 'running';
      status.started_at = new Date();
    }

    // Ensure the plan exists
    try {
      await fs.access(planPath);
    } catch (error) {
      throw new Error(`Execution plan not found for project ${projectId}`);
    }

    // Ensure output directory exists
    const outputPath = path.join(projectPath, 'output');
    await fs.mkdir(outputPath, { recursive: true });

    // Create log file
    await fs.writeFile(logPath, `=== Execution started at ${new Date().toISOString()} ===\n`);

    // Build docker command with resource constraints
    const dockerArgs = [
      'run', '--rm',
      `--memory=${this.MAX_MEMORY_MB}m`,
      '--cpus=2.0', // Limit CPU usage
      `--name=flowcraft-${projectId}`,
      `-v`, `${projectPath}:/workspace`,
      '--network', 'host',
      this.dockerImage,
      'python', 'src/pipeline_executor.py',
      '/workspace/config/execution_plan.json'
    ];

    console.log(`🚀 Executing workflow for project ${projectId}`);
    console.log(`📋 Docker command: docker ${dockerArgs.join(' ')}`);

    const dockerProcess = spawn('docker', dockerArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Store container reference
    if (status) {
      status.container_id = `flowcraft-${projectId}`;
    }

    // Set up timeout
    const timeoutHandle = setTimeout(() => {
      this.handleExecutionTimeout(projectId, dockerProcess);
    }, timeoutMinutes * 60 * 1000);

    // Handle stdout
    dockerProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      this.appendToLog(logPath, output);
      this.processExecutionOutput(projectId, output);
    });

    // Handle stderr
    dockerProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString();
      this.appendToLog(logPath, `ERROR: ${error}`);
    });

    // Handle process completion
    dockerProcess.on('close', (code: number) => {
      clearTimeout(timeoutHandle);
      
      if (code === 0) {
        this.markExecutionCompleted(projectId);
      } else {
        this.markExecutionFailed(projectId, `Process exited with code ${code}`);
      }
    });

    dockerProcess.on('error', (error: Error) => {
      clearTimeout(timeoutHandle);
      this.markExecutionFailed(projectId, error.message);
    });
  }

  /** Handle execution timeout */
  private async handleExecutionTimeout(projectId: string, dockerProcess: any): Promise<void> {
    console.log(`⏰ Execution timeout for project ${projectId}`);
    
    try {
      // Kill the docker container
      await execAsync(`docker kill flowcraft-${projectId}`);
    } catch (error) {
      console.warn(`Failed to kill container for project ${projectId}:`, error);
    }

    this.markExecutionFailed(projectId, 'Execution timeout', 'timeout');
  }

  /** Process execution output for status updates */
  private processExecutionOutput(projectId: string, output: string): void {
    const lines = output.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        if (line.trim().startsWith('{')) {
          const result = JSON.parse(line);
          if (result.status) {
            this.updateExecutionStatus(projectId, result);
          }
        }
      } catch (parseError) {
        // Not JSON, probably regular log output
        console.log(`📝 [${projectId}]`, line);
      }
    });
  }

  /** Update execution status from ML engine */
  private updateExecutionStatus(projectId: string, result: any): void {
    const status = this.runningExecutions.get(projectId);
    if (status) {
      status.current_step = result.step;
      status.progress = result.progress;
      
      this.emit('execution_progress', {
        projectId,
        step: result.step,
        progress: result.progress,
        details: result.details
      });
    }
  }

  /** Mark execution as completed */
  private markExecutionCompleted(projectId: string): void {
    const status = this.runningExecutions.get(projectId);
    if (status) {
      status.status = 'completed';
      status.completed_at = new Date();
      
      // Archive to history
      this.archiveExecutionStatus(projectId, status);
      
      console.log(`✅ Workflow execution completed for project ${projectId}`);
      this.emit('execution_completed', { projectId, status });
    }
  }

  /** Mark execution as failed */
  private markExecutionFailed(projectId: string, error: string, statusType: 'failed' | 'timeout' = 'failed'): void {
    const status = this.runningExecutions.get(projectId);
    if (status) {
      status.status = statusType;
      status.error = error;
      status.completed_at = new Date();
      
      // Archive to history
      this.archiveExecutionStatus(projectId, status);
      
      console.error(`❌ Workflow execution ${statusType} for project ${projectId}: ${error}`);
      this.emit('execution_failed', { projectId, error, status });
    }
  }

  /** Archive execution status to history */
  private archiveExecutionStatus(projectId: string, status: ExecutionStatus): void {
    const history = this.executionHistory.get(projectId) || [];
    history.push({ ...status });
    this.executionHistory.set(projectId, history);
    
    // Remove from running executions
    this.runningExecutions.delete(projectId);
  }

  /** Append text to log file */
  private async appendToLog(logPath: string, text: string): Promise<void> {
    try {
      await fs.appendFile(logPath, `${new Date().toISOString()}: ${text}\n`);
    } catch (error) {
      console.warn('Failed to write to log file:', error);
    }
  }

  /** Get project execution status */
  async getProjectStatus(projectId: string): Promise<any> {
    const runningStatus = this.runningExecutions.get(projectId);
    if (runningStatus) {
      return runningStatus;
    }

    const history = this.executionHistory.get(projectId);
    if (history && history.length > 0) {
      return history[history.length - 1]; // Return most recent
    }

    // Check for output files
    const projectPath = path.join(this.projectsRoot, projectId);
    const outputPath = path.join(projectPath, 'output');
    
    try {
      const files = await fs.readdir(outputPath);
      const results: any = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(outputPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          results[file.replace('.json', '')] = JSON.parse(content);
        }
      }
      
      return {
        project_id: projectId,
        status: 'completed',
        results: results,
        output_files: files
      };
      
    } catch (error) {
      return {
        project_id: projectId,
        status: 'not_found',
        error: 'Project not found or not executed'
      };
    }
  }

  /** Get execution logs */
  async getExecutionLogs(projectId: string): Promise<string> {
    const logDir = path.join(this.projectsRoot, projectId, 'logs');
    const logPath = path.join(logDir, 'execution.log');
    
    try {
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      // Check if log file exists
      try {
        await fs.access(logPath);
        return await fs.readFile(logPath, 'utf-8');
      } catch {
        // Log file doesn't exist yet, create it with initial content
        const initialLog = `[${new Date().toISOString()}] INFO: Execution started for project ${projectId}\n`;
        await fs.writeFile(logPath, initialLog, 'utf-8');
        return initialLog;
      }
    } catch (error) {
      console.warn(`Failed to get/create logs for project ${projectId}:`, error);
      return `[${new Date().toISOString()}] INFO: Execution started for project ${projectId}\n`;
    }
  }

  /** Retry execution from failed step */
  async retryExecution(projectId: string, fromStep?: string): Promise<void> {
    const history = this.executionHistory.get(projectId);
    if (!history || history.length === 0) {
      throw new Error(`No execution history found for project ${projectId}`);
    }

    const lastExecution = history[history.length - 1];
    if (lastExecution.status !== 'failed' && lastExecution.status !== 'timeout') {
      throw new Error(`Cannot retry execution - last status was ${lastExecution.status}`);
    }

    console.log(`🔄 Retrying execution for project ${projectId}${fromStep ? ` from step ${fromStep}` : ''}`);
    
    // TODO: Implement step-specific retry logic by modifying execution plan
    await this.queueExecution(projectId, 2); // Higher priority for retries
  }

  /** Clean up old projects */
  private startCleanupJob(): void {
    // Run cleanup every 6 hours
    setInterval(() => {
      this.cleanupOldProjects();
    }, 6 * 60 * 60 * 1000);

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.cleanupOldProjects();
    }, 60 * 1000);
  }

  private async cleanupOldProjects(): Promise<void> {
    console.log('🧹 Starting scheduled project cleanup...');
    
    try {
      const projects = await fs.readdir(this.projectsRoot);
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - this.PROJECT_CLEANUP_DAYS);

      for (const projectId of projects) {
        const projectPath = path.join(this.projectsRoot, projectId);
        
        try {
          const stats = await fs.stat(projectPath);
          if (stats.mtime < cutoffTime) {
            await this.cleanupProject(projectId);
          }
        } catch (error) {
          console.warn(`Failed to check project ${projectId} for cleanup:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to run cleanup job:', error);
    }
  }

  /** Clean up project files */
  async cleanupProject(projectId: string): Promise<void> {
    const projectPath = path.join(this.projectsRoot, projectId);
    
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      
      // Remove from running executions and history
      this.runningExecutions.delete(projectId);
      this.executionHistory.delete(projectId);
      
      console.log(`🧹 Cleaned up project ${projectId}`);
      this.emit('project_cleaned', { projectId });
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup project ${projectId}:`, error);
    }
  }

  /** Get system status and metrics */
  getSystemStatus(): any {
    const runningExecutions = Array.from(this.runningExecutions.values());
    const queuedCount = this.executionQueue.length;
    const runningCount = runningExecutions.filter(s => s.status === 'running').length;

    return {
      max_concurrent_executions: this.MAX_CONCURRENT_EXECUTIONS,
      running_executions: runningCount,
      queued_executions: queuedCount,
      total_projects: this.executionHistory.size,
      capacity_utilization: (runningCount / this.MAX_CONCURRENT_EXECUTIONS) * 100,
      queue: this.executionQueue.map(q => ({
        project_id: q.projectId,
        priority: q.priority,
        queued_at: q.enqueuedAt
      })),
      running: runningExecutions.filter(s => s.status === 'running').map(s => ({
        project_id: s.project_id,
        current_step: s.current_step,
        progress: s.progress,
        started_at: s.started_at
      }))
    };
  }
}

