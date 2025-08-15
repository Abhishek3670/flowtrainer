// backend/src/services/projectService.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface ExecutionPlan {
  workflow_id: string;
  execution_id: string;
  nodes: any[];
  edges: any[];
  execution_order: string[];
  config: any;
}

export class ProjectService {
  private projectsRoot = path.join(process.cwd(), 'workflows');
  private dockerImage = 'flowcraft/ml-engine:latest';

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
    
    await fs.mkdir(configPath, { recursive: true });
    
    // Transform nodes to match ML engine expected format
    const transformedNodes = nodes.map(node => ({
      id: node.id,
      type: node.type || 'customNode',
      data: node.data || {},
      position: node.position || { x: 0, y: 0 }
    }));
    // Generate execution order using topological sort
    const executionOrder = this.topologicalSort(transformedNodes, edges);
    
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
        temp_path: '/workspace/temp'
      }
    };

    const planPath = path.join(configPath, 'execution_plan.json');
    await fs.writeFile(planPath, JSON.stringify(executionPlan, null, 2));
    
    console.log(`✅ Generated execution plan for project ${projectId}`);
  }

  /** Topological sort for execution order */
  private topologicalSort(nodes: any[], edges: any[]): string[] {
    // Create adjacency list and in-degree map
    const graph: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};
    
    // Initialize graph and in-degree
    nodes.forEach(node => {
      graph[node.id] = [];
      inDegree[node.id] = 0;
    });
    
    // Build graph from edges
    edges.forEach(edge => {
      graph[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });
    
    // Kahn's algorithm for topological sorting
    const queue: string[] = [];
    const result: string[] = [];
    
    // Find all nodes with no incoming edges
    Object.keys(inDegree).forEach(nodeId => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      
      // For each neighbor of current node
      graph[current].forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
    
    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles - cannot determine execution order');
    }
    
    return result;
  }

  /** Orchestrate Docker execution */
  async executeWorkflow(projectId: string): Promise<void> {
    const projectPath = path.join(this.projectsRoot, projectId);
    const planPath = path.join(projectPath, 'config', 'execution_plan.json');

    // Ensure the plan exists
    try {
      await fs.access(planPath);
    } catch (error) {
      throw new Error(`Execution plan not found for project ${projectId}`);
    }

    // Ensure output directory exists
    const outputPath = path.join(projectPath, 'output');
    await fs.mkdir(outputPath, { recursive: true });

    // Build docker command
    const cmd = [
      'docker run --rm',
      `-v ${projectPath}:/workspace`,
      '--network host',
      this.dockerImage,
      'python', 'src/pipeline_executor.py',
      '/workspace/config/execution_plan.json'
    ].join(' ');

    console.log(`🚀 Executing workflow for project ${projectId}`);
    console.log(`📋 Command: ${cmd}`);

    try {
      // Execute docker run
      const { stdout, stderr } = await execAsync(cmd, { 
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      console.log('--- Docker STDOUT ---\n', stdout);
      if (stderr) console.warn('--- Docker STDERR ---\n', stderr);

      // Parse JSON output lines for status updates
      const outputLines = stdout.split('\n').filter(line => line.trim());
      
      outputLines.forEach(line => {
        try {
          if (line.trim().startsWith('{')) {
            const result = JSON.parse(line);
            console.log('📊 ML Engine Result:', result);
            // Here you could call StatusUpdater or emit events
          }
        } catch (parseError) {
          // Not JSON, probably regular log output
          console.log('📝 ML Engine Log:', line);
        }
      });

      console.log(`✅ Workflow execution completed for project ${projectId}`);

    } catch (error: any) {
      console.error('❌ Docker execution failed:', error);
      throw new Error(`Pipeline execution failed: ${error.message}`);
    }
  }

  /** Get project status */
  async getProjectStatus(projectId: string): Promise<any> {
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

  /** Clean up project files */
  async cleanupProject(projectId: string): Promise<void> {
    const projectPath = path.join(this.projectsRoot, projectId);
    
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up project ${projectId}`);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup project ${projectId}:`, error);
    }
  }
}
