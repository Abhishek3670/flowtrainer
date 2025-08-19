/**
 * useWorkflowPersistence Hook
 * 
 * Custom React hook that manages workflow state persistence through checkpoints.
 * Provides functionality to save, load, and manage workflow states with both
 * backend persistence and local storage backup.
 * 
 * Key Features:
 * - Load latest checkpoint on component mount
 * - Save manual checkpoints with custom names and descriptions
 * - Create automatic checkpoints for auto-save functionality
 * - Local storage backup for offline resilience
 * - Loading and saving state management
 * - Checkpoint metadata and statistics
 * 
 * Usage:
 * ```tsx
 * const persistence = useWorkflowPersistence('workflow-id');
 * 
 * // Load latest state
 * const state = await persistence.loadLatestCheckpoint();
 * 
 * // Save current state
 * await persistence.saveCheckpoint(currentState, 'My Checkpoint');
 * 
 * // Auto-save
 * await persistence.saveAutoCheckpoint(currentState);
 * ```
 * 
 * State Management:
 * - isLoading: Whether checkpoint loading is in progress
 * - isSaving: Whether checkpoint saving is in progress
 * - lastCheckpoint: Most recently saved checkpoint data
 */

import { useState, useCallback } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { NodeData } from '../types';
import { CheckpointAPI, CheckpointData } from '../services/checkpointApi';

/**
 * Workflow state interface representing the complete canvas state
 * Includes nodes, edges, and viewport information
 */
interface WorkflowState {
  nodes: Node<NodeData>[];              // Array of workflow nodes
  edges: Edge[];                        // Array of workflow connections
  viewport: Viewport;                   // Canvas viewport state (position, zoom)
}

/**
 * useWorkflowPersistence Hook Implementation
 * 
 * @param workflowId - Unique identifier for the workflow
 * @returns Object containing persistence methods and state
 */
export const useWorkflowPersistence = (workflowId: string) => {
  // ===== STATE MANAGEMENT =====
  
  // Loading state for checkpoint operations
  const [isLoading, setIsLoading] = useState(true);
  
  // Saving state for checkpoint operations
  const [isSaving, setIsSaving] = useState(false);
  
  // Most recently saved checkpoint data
  const [lastCheckpoint, setLastCheckpoint] = useState<any>(null);

  // ===== CHECKPOINT LOADING =====
  
  /**
   * Load the latest checkpoint for the workflow
   * Called on component mount to restore previous state
   * 
   * @returns Promise resolving to workflow state or null if no checkpoints exist
   */
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
        
        // Return the checkpoint data in the expected format
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

  // ===== CHECKPOINT SAVING =====
  
  /**
   * Save current workflow state as a manual checkpoint
   * Creates a named checkpoint with optional description and metadata
   * 
   * @param state - Current workflow state to save
   * @param name - Optional custom name for the checkpoint
   * @param description - Optional description of the checkpoint
   * @returns Promise that resolves when save is complete
   */
  const saveCheckpoint = useCallback(async (
    state: WorkflowState,
    name?: string,
    description?: string
  ): Promise<void> => {
    if (!workflowId) return;

    try {
      setIsSaving(true);
      console.log('[Persistence] Saving checkpoint...');

      // Prepare checkpoint data with metadata
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

      // Save to backend via API
      const newCheckpoint = await CheckpointAPI.createCheckpoint(workflowId, checkpointData);
      setLastCheckpoint(newCheckpoint);
      
      console.log('[Persistence] Checkpoint saved successfully:', newCheckpoint.name);
      
      // Also save to localStorage as backup for offline resilience
      saveToLocalStorage(state);
    } catch (error) {
      console.error('[Persistence] Failed to save checkpoint:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [workflowId]);

  // ===== AUTOMATIC CHECKPOINTS =====
  
  /**
   * Create an automatic checkpoint for auto-save functionality
   * Used for background state preservation without user interaction
   * 
   * @param state - Current workflow state to save
   * @returns Promise that resolves when auto-save is complete
   */
  const saveAutoCheckpoint = useCallback(async (state: WorkflowState): Promise<void> => {
    if (!workflowId) return;

    try {
      console.log('[Persistence] Creating auto-checkpoint...');
      
      // Create auto-checkpoint via API
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
