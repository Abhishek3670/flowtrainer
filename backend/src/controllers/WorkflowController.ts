import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { getWorkflowService, getProjectService } from '../services';
import { WorkflowService } from '../services/implementations/WorkflowService';
import { ProjectService } from '../services/projectService';

export class WorkflowController {
  private workflowService: WorkflowService;
  private projectService: ProjectService;

  constructor() {
    this.workflowService = getWorkflowService();
    this.projectService = getProjectService();
  }

  // Get all workflows
  async getWorkflows(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflows = await this.workflowService.getWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single workflow
  async getWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflow = await this.workflowService.getWorkflowById(workflowId, userId);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new workflow
  async createWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflowData = {
        ...req.body,
        ownerId: new Types.ObjectId(userId),
        collaborators: (req.body.collaborators || []).map((id: string) => new Types.ObjectId(id))
      };
      const workflow = await this.workflowService.createWorkflow(workflowData, userId);
      res.status(201).json(workflow);
    } catch (error) {
      console.error('Error creating workflow:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Update workflow
  async updateWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflow = await this.workflowService.updateWorkflow(workflowId, req.body, userId);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error) {
      console.error('Error updating workflow:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Delete workflow
  async deleteWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const success = await this.workflowService.deleteWorkflow(workflowId, userId);
      if (!success) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Duplicate workflow
  async duplicateWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sourceWorkflow = await this.workflowService.getWorkflowById(workflowId, userId);
      if (!sourceWorkflow) {
        res.status(404).json({ error: 'Source workflow not found' });
        return;
      }

      const workflowData = sourceWorkflow.toObject();
      const duplicatedWorkflow = await this.workflowService.createWorkflow({
        title: `${workflowData.title} (Copy)`,
        description: workflowData.description,
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        ownerId: new Types.ObjectId(userId),
        collaborators: [],
        isPublic: false,
        version: 1
      }, userId);

      res.status(201).json(duplicatedWorkflow);
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Execute workflow
  async executeWorkflow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflow = await this.workflowService.getWorkflowById(workflowId, userId);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      // Queue the workflow execution
      await this.projectService.queueExecution(workflowId);

      res.json({
        message: 'Workflow execution queued',
        executionId: `exec-${Date.now()}`,
        status: 'queued'
      });
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get workflow execution history
  async getWorkflowHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const workflowId = req.params.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workflow = await this.workflowService.getWorkflowById(workflowId, userId);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      const history = await this.workflowService.getWorkflowHistory(workflowId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
