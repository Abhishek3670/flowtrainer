// Direct history implementation without complex Immer patches
import { useState, useCallback } from 'react';

export function useDirectHistory<T>(initialState: T) {
  const [history, setHistory] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  const set = useCallback((updater: (draft: T) => void) => {
    setHistory(h => {
      // For arrays, work with a copy
      let newState: T;
      if (Array.isArray(h.present)) {
        newState = [...h.present] as T;
      } else if (typeof h.present === 'object' && h.present !== null) {
        newState = { ...h.present } as T;
      } else {
        newState = h.present;
      }
      
      // Apply the update
      updater(newState);
      
      console.log('📝 useDirectHistory SET:');
      console.log('  - Previous state:', Array.isArray(h.present) ? `Array(${h.present.length})` : h.present);
      console.log('  - New state:', Array.isArray(newState) ? `Array(${(newState as any).length})` : newState);
      
      return {
        past: [...h.past, h.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      console.log('🔙 useDirectHistory UNDO:');
      console.log('  - Current:', Array.isArray(h.present) ? `Array(${h.present.length})` : h.present);
      console.log('  - Past entries:', h.past.length);
      
      if (h.past.length === 0) {
        console.log('  ❌ No past entries');
        return h;
      }

      const previous = h.past[h.past.length - 1];
      console.log('  - Restoring to:', Array.isArray(previous) ? `Array(${(previous as any).length})` : previous);
      
      const result = {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
      
      console.log('  ✅ Undo result:', Array.isArray(result.present) ? `Array(${(result.present as any).length})` : result.present);
      return result;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(h => {
      console.log('🔜 useDirectHistory REDO:');
      console.log('  - Current:', Array.isArray(h.present) ? `Array(${h.present.length})` : h.present);
      console.log('  - Future entries:', h.future.length);
      
      if (h.future.length === 0) {
        console.log('  ❌ No future entries');
        return h;
      }

      const next = h.future[0];
      console.log('  - Restoring to:', Array.isArray(next) ? `Array(${(next as any).length})` : next);
      
      return {
        past: [...h.past, h.present],
        present: next,
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
