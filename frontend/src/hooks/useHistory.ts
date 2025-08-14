// src/hooks/useHistory.ts
import { useState, useCallback } from 'react';
import { produce, enablePatches, Patch } from 'immer';

enablePatches();

/**
 * A generic undo/redo state management hook with Immer patches
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<{
    past: { state: T; patches: Patch[]; inversePatches: Patch[] }[];
    present: T;
    future: { state: T; patches: Patch[]; inversePatches: Patch[] }[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  /**
   * Update state and record the change in history.
   * The updater receives a draft state to modify.
   */
  const set = useCallback((updater: (draft: T) => void) => {
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

      return {
        past: [...h.past, { state: h.present, patches, inversePatches }],
        present: nextState,
        future: [],
      };
    });
  }, []);

  /** Undo the last change */
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous.state,
        future: [
          { state: h.present, patches: previous.patches, inversePatches: previous.inversePatches },
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
        past: [...h.past, { state: h.present, patches: next.patches, inversePatches: next.inversePatches }],
        present: next.state,
        future: h.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
