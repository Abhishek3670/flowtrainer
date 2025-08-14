// Simple history hook for debugging node undo/redo issues
import { useState, useCallback } from 'react';

export function useSimpleHistory<T>(initialState: T) {
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
      // Create a shallow copy for arrays, or use the original for other types
      let newState: T;
      if (Array.isArray(h.present)) {
        newState = [...h.present] as T;
      } else {
        newState = { ...h.present } as T;
      }
      
      updater(newState);
      
      console.log('🔄 useSimpleHistory SET:');
      console.log('  - Previous state length:', Array.isArray(h.present) ? h.present.length : 'not array');
      console.log('  - New state length:', Array.isArray(newState) ? newState.length : 'not array');
      console.log('  - Past entries before:', h.past.length);
      
      return {
        past: [...h.past, h.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      console.log('🔙 useSimpleHistory UNDO:');
      console.log('  - Current present length:', Array.isArray(h.present) ? h.present.length : 'not array');
      console.log('  - Past entries:', h.past.length);
      
      if (h.past.length === 0) {
        console.log('  - No past entries to undo');
        return h;
      }

      const previous = h.past[h.past.length - 1];
      console.log('  - Restoring to length:', Array.isArray(previous) ? previous.length : 'not array');
      
      const result = {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
      
      console.log('  - New present length will be:', Array.isArray(result.present) ? result.present.length : 'not array');
      return result;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(h => {
      console.log('🔜 useSimpleHistory REDO:');
      console.log('  - Current present length:', Array.isArray(h.present) ? h.present.length : 'not array');
      console.log('  - Future entries:', h.future.length);
      
      if (h.future.length === 0) {
        console.log('  - No future entries to redo');
        return h;
      }

      const next = h.future[0];
      console.log('  - Restoring to length:', Array.isArray(next) ? next.length : 'not array');
      
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
    // Debug info
    pastCount: history.past.length,
    futureCount: history.future.length,
  };
}
