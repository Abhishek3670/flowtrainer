import { Types } from 'mongoose';
import Workflow, { WorkflowDocument } from '../../models/workflow.model';
import WorkflowRevision, { WorkflowRevisionDocument } from '../../models/workflow-revision.model';
import { IWorkflowService } from '../interfaces/IWorkflowService';
import { IWorkflow, INode } from '../../types';

export class WorkflowService implements IWorkflowService {
  async getWorkflows(userId: string): Promise<WorkflowDocument[]> {
    return await Workflow.find({
      $or: [
        { ownerId: userId },
        { collaborators: userId },
        { isPublic: true }
      ]
    })
    .populate('ownerId', 'email')
    .populate('collaborators', 'email')
    .sort({ updatedAt: -1 });
  }

  async getWorkflowById(id: string, userId: string): Promise<WorkflowDocument | null> {
    return await Workflow.findOne({
      _id: id,
      $or: [
        { ownerId: userId },
        { collaborators: userId },
        { isPublic: true }
      ]
    })
    .populate('ownerId', 'email')
    .populate('collaborators', 'email');
  }

  async createWorkflow(data: Partial<IWorkflow>, userId: string): Promise<WorkflowDocument> {
    const workflow = new Workflow({
      ...data,
      ownerId: userId,
      collaborators: [],
      isPublic: false,
      version: 1
    });

    await workflow.save();

    if (!workflow._id) {
      throw new Error('Failed to create workflow: Missing _id');
    }

    // Create initial revision
    const revision = new WorkflowRevision({
      workflowId: workflow._id,
      version: 1,
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      createdBy: userId,
      changeDescription: 'Initial version'
    });

    await revision.save();

    return workflow;
  }

  async updateWorkflow(id: string, data: Partial<IWorkflow>, userId: string): Promise<WorkflowDocument | null> {
    const workflow = await this.getWorkflowById(id, userId);
    
    if (!workflow) {
      return null;
    }

    // Check ownership/collaboration rights
    if (workflow.ownerId.toString() !== userId && 
        !workflow.collaborators.map(c => c.toString()).includes(userId)) {
      return null;
    }

    // Update allowed fields
    if (data.title) workflow.title = data.title;
    if (data.description) workflow.description = data.description;
    if (data.nodes) workflow.nodes = data.nodes;
    if (data.edges) workflow.edges = data.edges;
    if (typeof data.isPublic === 'boolean') workflow.isPublic = data.isPublic;
    
    workflow.version += 1;
    await workflow.save();

    // Create revision if nodes or edges changed
    if (data.nodes || data.edges) {
      if (!workflow._id) {
        throw new Error('Failed to create revision: Missing workflow _id');
      }
      await this.createRevision(
        workflow._id.toString(),
        userId,
        `Update version ${workflow.version}`
      );
    }

    return workflow;
  }

  async deleteWorkflow(id: string, userId: string): Promise<boolean> {
    const workflow = await this.getWorkflowById(id, userId);
    
    if (!workflow || workflow.ownerId.toString() !== userId) {
      return false;
    }

    await WorkflowRevision.deleteMany({ workflowId: id });
    await workflow.deleteOne();
    return true;
  }

  async addCollaborator(workflowId: string, collaboratorId: string, ownerId: string): Promise<WorkflowDocument | null> {
    const workflow = await Workflow.findOne({ _id: workflowId, ownerId });
    
    if (!workflow) {
      return null;
    }

    const collaboratorObjectId = new Types.ObjectId(collaboratorId);
    if (!workflow.collaborators.some(id => id.equals(collaboratorObjectId))) {
      workflow.collaborators.push(collaboratorObjectId);
      await workflow.save();
    }

    return workflow;
  }

  async removeCollaborator(workflowId: string, collaboratorId: string, ownerId: string): Promise<WorkflowDocument | null> {
    const workflow = await Workflow.findOne({ _id: workflowId, ownerId });
    
    if (!workflow) {
      return null;
    }

    workflow.collaborators = workflow.collaborators.filter(
      id => id.toString() !== collaboratorId
    );
    await workflow.save();

    return workflow;
  }

  async updateNode(workflowId: string, nodeId: string, data: Partial<INode>, userId: string): Promise<WorkflowDocument | null> {
    const workflow = await this.getWorkflowById(workflowId, userId);
    
    if (!workflow) {
      return null;
    }

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) {
      return null;
    }

    workflow.nodes[nodeIndex] = {
      ...workflow.nodes[nodeIndex],
      ...data
    };

    workflow.version += 1;
    await workflow.save();

    await this.createRevision(
      workflowId,
      userId,
      `Updated node ${nodeId}`
    );

    return workflow;
  }

  async updateNodeResult(workflowId: string, nodeId: string, result: any): Promise<void> {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (node) {
      node.result = result;
      await workflow.save();
    }
  }

  async getWorkflowHistory(workflowId: string): Promise<any[]> {
    return await WorkflowRevision.find({ workflowId })
      .sort({ version: -1 })
      .populate('createdBy', 'email');
  }

  async createRevision(workflowId: string, userId: string, changeDescription: string): Promise<any> {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow._id) {
      throw new Error('Failed to create revision: Missing workflow _id');
    }

    const revision = new WorkflowRevision({
      workflowId: workflow._id,
      version: workflow.version,
      nodes: workflow.nodes,
      edges: workflow.edges,
      createdBy: userId,
      changeDescription
    });

    return await revision.save();
  }
}
