import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckpointAPI } from '../services/checkpointApi';

interface AutoSaveConfig {
  interval?: number; // Auto-save interval in ms (default: 30000 = 30s)
  debounceDelay?: number; // Debounce delay for changes (default: 2000 = 2s)
  maxAutoSaves?: number; // Max number of auto-saves to keep (default: 10)
  enabled?: boolean; // Enable/disable auto-save (default: true)
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export const useAutoSave = (
  workflowId: string,
  getCurrentState: () => { nodes: any[], edges: any[], viewport: any },
  config: AutoSaveConfig = {}
) => {
  const {
    interval = 30000, // 30 seconds
    debounceDelay = 2000, // 2 seconds
    maxAutoSaves = 10,
    enabled = true
  } = config;

  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    error: null
  });

  const lastStateRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout>();
  const debounceRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Check if state has changed
  const hasStateChanged = useCallback(() => {
    const currentState = getCurrentState();
    const currentStateStr = JSON.stringify({
      nodes: currentState.nodes,
      edges: currentState.edges,
      viewport: currentState.viewport
    });
    
    if (lastStateRef.current === '') {
      lastStateRef.current = currentStateStr;
      return false; // Don't save on initial load
    }
    
    return lastStateRef.current !== currentStateStr;
  }, [getCurrentState]);

  // Perform auto-save
  const performAutoSave = useCallback(async () => {
    if (!enabled || !workflowId) return;

    try {
      setAutoSaveState(prev => ({ ...prev, isSaving: true, error: null }));
      
      const currentState = getCurrentState();
      
      // Update last known state
      lastStateRef.current = JSON.stringify({
        nodes: currentState.nodes,
        edges: currentState.edges,
        viewport: currentState.viewport
      });

      await CheckpointAPI.createAutoCheckpoint(workflowId, currentState);
      
      setAutoSaveState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
        error: null
      }));

      console.log('[AutoSave] Checkpoint created successfully');
      
      // Clean up old auto-saves if needed
      await cleanupOldAutoSaves();
      
    } catch (error) {
      console.error('[AutoSave] Failed to create checkpoint:', error);
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Auto-save failed'
      }));
    }
  }, [enabled, workflowId, getCurrentState]);

  // Clean up old auto-saves
  const cleanupOldAutoSaves = useCallback(async () => {
    try {
      const checkpoints = await CheckpointAPI.getCheckpoints(workflowId);
      const autoCheckpoints = checkpoints
        .filter(cp => cp.name.startsWith('Auto-save'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (autoCheckpoints.length > maxAutoSaves) {
        const toDelete = autoCheckpoints.slice(maxAutoSaves);
        await Promise.all(
          toDelete.map(cp => CheckpointAPI.deleteCheckpoint(workflowId, cp._id))
        );
        console.log(`[AutoSave] Cleaned up ${toDelete.length} old auto-saves`);
      }
    } catch (error) {
      console.error('[AutoSave] Failed to cleanup old auto-saves:', error);
    }
  }, [workflowId, maxAutoSaves]);

  // Trigger auto-save with debouncing
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !isInitializedRef.current) return;

    if (!hasStateChanged()) {
      setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: false }));
      return;
    }

    setAutoSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      performAutoSave();
    }, debounceDelay);

  }, [enabled, hasStateChanged, performAutoSave, debounceDelay]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    await performAutoSave();
  }, [performAutoSave]);

  // Set up interval-based auto-save
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (hasStateChanged() && !autoSaveState.isSaving) {
        performAutoSave();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, hasStateChanged, performAutoSave, autoSaveState.isSaving]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Mark as initialized after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 1000); // Wait 1 second before enabling auto-save

    return () => clearTimeout(timer);
  }, []);

  return {
    ...autoSaveState,
    triggerAutoSave,
    saveNow,
    isEnabled: enabled
  };
};
