import { CheckpointModel, Checkpoint, ReactFlowNode, ReactFlowEdge } from '../models/Checkpoint';
import { Document } from 'mongoose';

export interface CreateCheckpointData {
  workflowId: string;
  name: string;
  description?: string;
  createdBy: string;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  viewport: { x: number; y: number; zoom: number };
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    tags?: string[];
  };
}

export interface CheckpointStats {
  totalCheckpoints: number;
  latestCheckpoint: Checkpoint | null;
  averageNodes: number;
  averageEdges: number;
}

export interface RestoredCheckpointData {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  viewport: { x: number; y: number; zoom: number };
}

export class CheckpointService {
  
  async createCheckpoint(data: CreateCheckpointData): Promise<Checkpoint> {
    const checkpoint = new CheckpointModel({
      ...data,
      metadata: {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
        ...data.metadata
      }
    });
    
    return await checkpoint.save();
  }

  async getWorkflowCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    return await CheckpointModel.find({ workflowId }).sort('-createdAt');
  }

  async getCheckpointById(checkpointId: string): Promise<Checkpoint | null> {
    return await CheckpointModel.findById(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    return await CheckpointModel.findByIdAndDelete(checkpointId);
  }

  async restoreCheckpoint(checkpointId: string): Promise<RestoredCheckpointData | null> {
    const checkpoint = await this.getCheckpointById(checkpointId);
    if (!checkpoint) {
      return null;
    }
    
    return {
      nodes: checkpoint.nodes,
      edges: checkpoint.edges,
      viewport: checkpoint.viewport
    };
  }

  // Get checkpoint statistics
  async getCheckpointStats(workflowId: string): Promise<CheckpointStats> {
    const checkpoints = await CheckpointModel.find({ workflowId });
    
    return {
      totalCheckpoints: checkpoints.length,
      latestCheckpoint: checkpoints.length > 0 ? checkpoints[0] : null,
      averageNodes: checkpoints.length > 0 ? checkpoints.reduce((acc, cp) => acc + (cp.metadata?.nodeCount || 0), 0) / checkpoints.length : 0,
      averageEdges: checkpoints.length > 0 ? checkpoints.reduce((acc, cp) => acc + (cp.metadata?.edgeCount || 0), 0) / checkpoints.length : 0
    };
  }

  // Create checkpoint from current workflow state
  async createAutoCheckpoint(workflowId: string, userId: string, currentState: { nodes: ReactFlowNode[], edges: ReactFlowEdge[], viewport: { x: number; y: number; zoom: number } }): Promise<Checkpoint> {
    const checkpointCount = await CheckpointModel.countDocuments({ workflowId });
    
    return this.createCheckpoint({
      workflowId,
      name: `Auto-checkpoint ${checkpointCount + 1}`,
      description: 'Automatically created checkpoint',
      createdBy: userId,
      nodes: currentState.nodes,
      edges: currentState.edges,
      viewport: currentState.viewport,
      metadata: {
        nodeCount: currentState.nodes.length,
        edgeCount: currentState.edges.length,
        tags: ['auto-generated']
      }
    });
  }
}
