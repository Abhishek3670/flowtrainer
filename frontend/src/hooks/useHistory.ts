// src/hooks/useHistory.ts
import { useState, useCallback, useRef } from 'react';
import { produce, enablePatches, Patch } from 'immer';

enablePatches();

interface HistoryOptions {
  limit?: number; // Maximum history size
  debounceMs?: number; // Debounce rapid changes
  groupingKey?: string; // Group related changes
}

interface HistoryEntry<T> {
  state: T;
  patches: Patch[];
  inversePatches: Patch[];
  timestamp: number;
  groupingKey?: string;
}

/**
 * Enhanced generic undo/redo state management hook with Immer patches
 */
export function useHistory<T>(
  initialState: T,
  options: HistoryOptions = {}
) {
  const { limit = 50, debounceMs = 0, groupingKey } = options;
  
  const [history, setHistory] = useState<{
    past: HistoryEntry<T>[];
    present: T;
    future: HistoryEntry<T>[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastGroupingKeyRef = useRef<string>();

  /**
   * Update state and record the change in history.
   * The updater receives a draft state to modify.
   */
  const set = useCallback((
    updater: (draft: T) => void,
    options?: { groupingKey?: string; skipDebounce?: boolean }
  ) => {
    const updateFn = () => {
      setHistory(h => {
        let patches: Patch[] = [];
        let inversePatches: Patch[] = [];
        
        const nextState = produce(
          h.present,
          updater,
          (p: Patch[], ip: Patch[]) => {
            patches = p;
            inversePatches = ip;
          }
        );

        // If no changes, don't add to history
        if (patches.length === 0) return h;

        const timestamp = Date.now();
        const currentGroupingKey = options?.groupingKey || groupingKey;

        // Check if we should group with the last change
        const shouldGroup = currentGroupingKey && 
          h.past.length > 0 && 
          h.past[h.past.length - 1].groupingKey === currentGroupingKey &&
          timestamp - h.past[h.past.length - 1].timestamp < 1000; // Group changes within 1 second

        let newPast: HistoryEntry<T>[];

        if (shouldGroup) {
          // Merge with the last entry
          const lastEntry = h.past[h.past.length - 1];
          newPast = [
            ...h.past.slice(0, -1),
            {
              state: h.present,
              patches: [...lastEntry.patches, ...patches],
              inversePatches: [...inversePatches, ...lastEntry.inversePatches],
              timestamp,
              groupingKey: currentGroupingKey,
            }
          ];
        } else {
          // Add as new entry
          newPast = [
            ...h.past,
            {
              state: h.present,
              patches,
              inversePatches,
              timestamp,
              groupingKey: currentGroupingKey,
            }
          ];
        }

        // Apply history limit
        if (limit && newPast.length > limit) {
          newPast = newPast.slice(-limit);
        }

        lastGroupingKeyRef.current = currentGroupingKey;

        return {
          past: newPast,
          present: nextState,
          future: [], // Clear future on new change
        };
      });
    };

    // Handle debouncing
    if (debounceMs > 0 && !options?.skipDebounce) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(updateFn, debounceMs);
    } else {
      updateFn();
    }
  }, [limit, debounceMs, groupingKey]);

  /** Undo the last change */
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous.state,
        future: [
          {
            state: h.present,
            patches: previous.patches,
            inversePatches: previous.inversePatches,
            timestamp: Date.now(),
            groupingKey: previous.groupingKey,
          },
          ...h.future,
        ],
      };
    });
  }, []);

  /** Redo the previously undone change */
  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;

      const next = h.future[0];
      return {
        past: [
          ...h.past,
          {
            state: h.present,
            patches: next.patches,
            inversePatches: next.inversePatches,
            timestamp: Date.now(),
            groupingKey: next.groupingKey,
          }
        ],
        present: next.state,
        future: h.future.slice(1),
      };
    });
  }, []);

  /** Reset to initial state and clear history */
  const reset = useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState]);

  /** Go to a specific point in history */
  const goto = useCallback((index: number) => {
    setHistory(h => {
      const totalStates = h.past.length + 1 + h.future.length;
      if (index < 0 || index >= totalStates) return h;

      const currentIndex = h.past.length;
      
      if (index === currentIndex) return h; // Already at this state
      
      if (index < currentIndex) {
        // Go back in history
        // const stepsBack = currentIndex - index;
        const newPast = h.past.slice(0, index);
        const targetState = index === 0 ? initialState : h.past[index - 1].state;
        const movedStates = h.past.slice(index);
        
        return {
          past: newPast,
          present: targetState,
          future: [
            ...movedStates.map((entry, i) => ({
              ...entry,
              state: i === 0 ? h.present : movedStates[i - 1].state,
            })),
            ...h.future,
          ],
        };
      } else {
        // Go forward in history
        const stepsForward = index - currentIndex;
        const futureToMove = h.future.slice(0, stepsForward);
        const targetState = futureToMove[stepsForward - 1].state;
        
        return {
          past: [
            ...h.past,
            { 
              state: h.present,
              patches: [],
              inversePatches: [],
              timestamp: Date.now(),
            },
            ...futureToMove.slice(0, -1).map(f => ({
              ...f,
              state: f.state,
            })),
          ],
          present: targetState,
          future: h.future.slice(stepsForward),
        };
      }
    });
  }, [initialState]);

  /** Clear history but keep current state */
  const clearHistory = useCallback(() => {
    setHistory(h => ({
      past: [],
      present: h.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    goto,
    clearHistory,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length,
    futureSize: history.future.length,
    // Expose for debugging/visualization
    history: process.env.NODE_ENV === 'development' ? history : undefined,
  };
}

// Optional: Hook for combining multiple history states
export function useCombinedHistory<T1, T2>(
  history1: ReturnType<typeof useHistory<T1>>,
  history2: ReturnType<typeof useHistory<T2>>
) {
  const undo = useCallback(() => {
    // Prioritize the one with more recent changes
    if (history1.canUndo || history2.canUndo) {
      history1.undo();
      history2.undo();
    }
  }, [history1, history2]);

  const redo = useCallback(() => {
    if (history1.canRedo || history2.canRedo) {
      history1.redo();
      history2.redo();
    }
  }, [history1, history2]);

  return {
    undo,
    redo,
    canUndo: history1.canUndo || history2.canUndo,
    canRedo: history1.canRedo || history2.canRedo,
  };
}