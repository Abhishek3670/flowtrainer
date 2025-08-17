import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';

export interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position?: { x: number; y: number };
  result?: any;
}

export interface Workflow {
  id: string;
  nodes: WorkflowNode[];
  edges: any[];
  metadata?: any;
}

export class WorkflowService {
  private baseDir = path.resolve(__dirname, '../../data');

  private workflowPath(projectId: string) {
    return path.join(this.baseDir, projectId, 'workflow.json');
  }

  async loadWorkflow(projectId: string) {
    const file = this.workflowPath(projectId);
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }

  async updateNodeResult(projectId: string, nodeId: string, result: any) {
    // 1. Persist result file
    const resultsDir = path.join(this.baseDir, projectId, 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(
      path.join(resultsDir, `${nodeId}_result.json`),
      JSON.stringify(result, null, 2)
    );

    // 2. Acquire lock, update workflow.json, then release
    const file = this.workflowPath(projectId);
    const release = await lockfile.lock(file);
    try {
      const workflow = await this.loadWorkflow(projectId);
      const node = workflow.nodes.find((n: WorkflowNode) => n.id === nodeId);
      if (node) node.result = result;
      fs.writeFileSync(file, JSON.stringify(workflow, null, 2));
    } finally {
      await release();
    }
  }
}
