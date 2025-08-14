import { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface CheckpointData {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
}

export interface Checkpoint extends CheckpointData {
  _id: string;
  workflowId: string;
  createdBy: string;
  createdAt: string;
}

export interface CheckpointStats {
  totalCheckpoints: number;
  latestCheckpoint: Checkpoint | null;
  averageNodes: number;
  averageEdges: number;
}

export class CheckpointAPI {
  
  // Create a new checkpoint
  static async createCheckpoint(workflowId: string, data: CheckpointData): Promise<Checkpoint> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkpoint');
    }
    
    return response.json();
  }

  // List all checkpoints for a workflow
  static async getCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoints');
    }
    
    return response.json();
  }

  // Get a specific checkpoint
  static async getCheckpoint(workflowId: string, checkpointId: string): Promise<Checkpoint> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/${checkpointId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoint');
    }
    
    return response.json();
  }

  // Restore a checkpoint (returns the workflow state)
  static async restoreCheckpoint(workflowId: string, checkpointId: string): Promise<{
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  }> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/${checkpointId}/restore`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to restore checkpoint');
    }
    
    return response.json();
  }

  // Create an auto-checkpoint
  static async createAutoCheckpoint(
    workflowId: string,
    currentState: { nodes: any[], edges: any[], viewport: any }
  ): Promise<Checkpoint> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentState),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create auto-checkpoint');
    }
    
    return response.json();
  }

  // Get checkpoint statistics
  static async getCheckpointStats(workflowId: string): Promise<CheckpointStats> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoint statistics');
    }
    
    return response.json();
  }

  // Delete a checkpoint
  static async deleteCheckpoint(workflowId: string, checkpointId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/${checkpointId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete checkpoint');
    }
  }
}

// React Hook for using checkpoints
export const useCheckpoints = (workflowId: string) => {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [stats, setStats] = useState<CheckpointStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const [checkpointsData, statsData] = await Promise.all([
        CheckpointAPI.getCheckpoints(workflowId),
        CheckpointAPI.getCheckpointStats(workflowId)
      ]);
      setCheckpoints(checkpointsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckpoint = async (data: CheckpointData) => {
    try {
      const newCheckpoint = await CheckpointAPI.createCheckpoint(workflowId, data);
      setCheckpoints(prev => [newCheckpoint, ...prev]);
      await loadCheckpoints(); // Refresh stats
      return newCheckpoint;
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      throw error;
    }
  };

  const createAutoCheckpoint = async (currentState: { nodes: any[], edges: any[], viewport: any }) => {
    try {
      const newCheckpoint = await CheckpointAPI.createAutoCheckpoint(workflowId, currentState);
      setCheckpoints(prev => [newCheckpoint, ...prev]);
      await loadCheckpoints(); // Refresh stats
      return newCheckpoint;
    } catch (error) {
      console.error('Failed to create auto-checkpoint:', error);
      throw error;
    }
  };

  const restoreCheckpoint = async (checkpointId: string) => {
    try {
      return await CheckpointAPI.restoreCheckpoint(workflowId, checkpointId);
    } catch (error) {
      console.error('Failed to restore checkpoint:', error);
      throw error;
    }
  };

  const deleteCheckpoint = async (checkpointId: string) => {
    try {
      await CheckpointAPI.deleteCheckpoint(workflowId, checkpointId);
      setCheckpoints(prev => prev.filter(cp => cp._id !== checkpointId));
      await loadCheckpoints(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete checkpoint:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (workflowId) {
      loadCheckpoints();
    }
  }, [workflowId]);

  return {
    checkpoints,
    stats,
    loading,
    createCheckpoint,
    createAutoCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    refresh: loadCheckpoints
  };
};
