/**
 * Checkpoint API Service
 * 
 * This service provides a clean interface for interacting with the backend
 * checkpoint management API. It handles all checkpoint-related operations
 * including creation, retrieval, restoration, and statistics.
 * 
 * Key Features:
 * - Create manual and automatic checkpoints
 * - Retrieve checkpoint data and metadata
 * - Restore workflow states from checkpoints
 * - Get checkpoint statistics and analytics
 * - Error handling and type safety
 * 
 * API Endpoints:
 * - POST /workflows/:id/checkpoints - Create checkpoint
 * - GET /workflows/:id/checkpoints - List checkpoints
 * - GET /workflows/:id/checkpoints/:cpId - Get specific checkpoint
 * - POST /workflows/:id/checkpoints/:cpId/restore - Restore checkpoint
 * - POST /workflows/:id/checkpoints/auto - Create auto-checkpoint
 * - GET /workflows/:id/checkpoints/stats - Get checkpoint statistics
 */

import { useState, useEffect } from 'react';

// API base URL configuration with fallback to localhost
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// ===== DATA INTERFACES =====

/**
 * Checkpoint data structure for creating new checkpoints
 * Contains the workflow state and optional metadata
 */
export interface CheckpointData {
  name: string;                                    // Human-readable checkpoint name
  description?: string;                            // Optional description
  nodes: any[];                                   // Workflow nodes array
  edges: any[];                                   // Workflow edges array
  viewport: { x: number; y: number; zoom: number }; // Canvas viewport state
  metadata?: {                                     // Optional metadata
    tags?: string[];                               // Searchable tags
    [key: string]: any;                           // Additional custom fields
  };
}

/**
 * Complete checkpoint structure returned from the API
 * Extends CheckpointData with server-generated fields
 */
export interface Checkpoint extends CheckpointData {
  _id: string;                                    // Unique checkpoint identifier
  workflowId: string;                             // Associated workflow ID
  createdBy: string;                              // User who created the checkpoint
  createdAt: string;                              // Creation timestamp
}

/**
 * Checkpoint statistics for analytics and monitoring
 * Provides aggregated information about workflow checkpoints
 */
export interface CheckpointStats {
  totalCheckpoints: number;                       // Total number of checkpoints
  latestCheckpoint: Checkpoint | null;            // Most recent checkpoint
  averageNodes: number;                           // Average nodes per checkpoint
  averageEdges: number;                           // Average edges per checkpoint
}

/**
 * CheckpointAPI Class
 * 
 * Static class providing methods for all checkpoint-related API operations.
 * Uses fetch API for HTTP requests with proper error handling.
 */
export class CheckpointAPI {
  
  // ===== CHECKPOINT CREATION =====
  
  /**
   * Create a new manual checkpoint
   * 
   * @param workflowId - ID of the workflow to create checkpoint for
   * @param data - Checkpoint data including workflow state
   * @returns Promise resolving to the created checkpoint
   * @throws Error if checkpoint creation fails
   */
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

  // ===== CHECKPOINT RETRIEVAL =====
  
  /**
   * List all checkpoints for a specific workflow
   * 
   * @param workflowId - ID of the workflow to get checkpoints for
   * @returns Promise resolving to array of checkpoints
   * @throws Error if checkpoint retrieval fails
   */
  static async getCheckpoints(workflowId: string): Promise<Checkpoint[]> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoints');
    }
    
    return response.json();
  }

  /**
   * Get a specific checkpoint by ID
   * 
   * @param workflowId - ID of the workflow containing the checkpoint
   * @param checkpointId - ID of the specific checkpoint to retrieve
   * @returns Promise resolving to the checkpoint data
   * @throws Error if checkpoint retrieval fails
   */
  static async getCheckpoint(workflowId: string, checkpointId: string): Promise<Checkpoint> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/${checkpointId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoint');
    }
    
    return response.json();
  }

  // ===== CHECKPOINT RESTORATION =====
  
  /**
   * Restore a checkpoint to get the workflow state
   * Returns the workflow data needed to restore the canvas state
   * 
   * @param workflowId - ID of the workflow containing the checkpoint
   * @param checkpointId - ID of the checkpoint to restore
   * @returns Promise resolving to workflow state data
   * @throws Error if checkpoint restoration fails
   */
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

  // ===== AUTOMATIC CHECKPOINTS =====
  
  /**
   * Create an automatic checkpoint without user input
   * Used for auto-save functionality and background state preservation
   * 
   * @param workflowId - ID of the workflow to create checkpoint for
   * @param currentState - Current workflow state to save
   * @returns Promise resolving to the created auto-checkpoint
   * @throws Error if auto-checkpoint creation fails
   */
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

  // ===== CHECKPOINT STATISTICS =====
  
  /**
   * Get checkpoint statistics for a specific workflow
   * 
   * @param workflowId - ID of the workflow to get statistics for
   * @returns Promise resolving to checkpoint statistics
   * @throws Error if statistics retrieval fails
   */
  static async getCheckpointStats(workflowId: string): Promise<CheckpointStats> {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/checkpoints/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch checkpoint statistics');
    }
    
    return response.json();
  }

  // ===== CHECKPOINT DELETION =====
  
  /**
   * Delete a specific checkpoint by ID
   * 
   * @param workflowId - ID of the workflow containing the checkpoint
   * @param checkpointId - ID of the checkpoint to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if checkpoint deletion fails
   */
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
