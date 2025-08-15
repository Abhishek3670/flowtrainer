import { useState, useCallback } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { NodeData } from '../types';
import { CheckpointAPI, CheckpointData } from '../services/checkpointApi';

interface WorkflowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  viewport: Viewport;
}

export const useWorkflowPersistence = (workflowId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastCheckpoint, setLastCheckpoint] = useState<any>(null);

  // Load the latest checkpoint on mount
  const loadLatestCheckpoint = useCallback(async (): Promise<WorkflowState | null> => {
    if (!workflowId) return null;

    try {
      setIsLoading(true);
      console.log('[Persistence] Loading latest checkpoint...');

      // Get checkpoint statistics to find the latest one
      const stats = await CheckpointAPI.getCheckpointStats(workflowId);
      
      if (stats.latestCheckpoint) {
        console.log('[Persistence] Found latest checkpoint:', stats.latestCheckpoint.name);
        setLastCheckpoint(stats.latestCheckpoint);
        
        // Return the checkpoint data
        return {
          nodes: stats.latestCheckpoint.nodes || [],
          edges: stats.latestCheckpoint.edges || [],
          viewport: stats.latestCheckpoint.viewport || { x: 0, y: 0, zoom: 1 }
        };
      } else {
        console.log('[Persistence] No checkpoints found, starting fresh');
        return null;
      }
    } catch (error) {
      console.error('[Persistence] Failed to load latest checkpoint:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  // Save current state as a checkpoint
  const saveCheckpoint = useCallback(async (
    state: WorkflowState,
    name?: string,
    description?: string
  ): Promise<void> => {
    if (!workflowId) return;

    try {
      setIsSaving(true);
      console.log('[Persistence] Saving checkpoint...');

      const checkpointData: CheckpointData = {
        name: name || `Checkpoint ${new Date().toLocaleString()}`,
        description: description || 'Manual checkpoint',
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        metadata: {
          tags: ['manual'],
          nodeCount: state.nodes.length,
          edgeCount: state.edges.length,
          timestamp: Date.now()
        }
      };

      const newCheckpoint = await CheckpointAPI.createCheckpoint(workflowId, checkpointData);
      setLastCheckpoint(newCheckpoint);
      
      console.log('[Persistence] Checkpoint saved successfully:', newCheckpoint.name);
      
      // Also save to localStorage as backup
      saveToLocalStorage(state);
    } catch (error) {
      console.error('[Persistence] Failed to save checkpoint:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [workflowId]);

  // Create an auto-checkpoint (for auto-save functionality)
  const saveAutoCheckpoint = useCallback(async (state: WorkflowState): Promise<void> => {
    if (!workflowId) return;

    try {
      console.log('[Persistence] Creating auto-checkpoint...');
      
      const autoCheckpoint = await CheckpointAPI.createAutoCheckpoint(workflowId, state);
      setLastCheckpoint(autoCheckpoint);
      
      console.log('[Persistence] Auto-checkpoint created:', autoCheckpoint.name);
      
      // Also save to localStorage as backup
      saveToLocalStorage(state);
    } catch (error) {
      console.error('[Persistence] Failed to create auto-checkpoint:', error);
      // Don't throw on auto-save failures, just log them
    }
  }, [workflowId]);

  // Save current state to localStorage as backup
  const saveToLocalStorage = useCallback((state: WorkflowState) => {
    try {
      localStorage.setItem(`workflow_${workflowId}`, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
      console.log('[Persistence] Saved to localStorage as backup');
    } catch (error) {
      console.warn('[Persistence] Failed to save to localStorage:', error);
    }
  }, [workflowId]);

  // Load from localStorage as fallback
  const loadFromLocalStorage = useCallback((): WorkflowState | null => {
    try {
      const saved = localStorage.getItem(`workflow_${workflowId}`);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('[Persistence] Loaded from localStorage fallback');
        return {
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewport: data.viewport || { x: 0, y: 0, zoom: 1 }
        };
      }
    } catch (error) {
      console.warn('[Persistence] Failed to load from localStorage:', error);
    }
    return null;
  }, [workflowId]);

  // Clear localStorage backup
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`workflow_${workflowId}`);
    } catch (error) {
      console.warn('[Persistence] Failed to clear localStorage:', error);
    }
  }, [workflowId]);

  return {
    isLoading,
    isSaving,
    lastCheckpoint,
    loadLatestCheckpoint,
    saveCheckpoint,
    saveAutoCheckpoint,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  };
};
