import { useCallback, useRef, useState } from 'react';
import type { TacticaGuardada } from '../types';

/** Maximum number of board snapshots kept in the undo/redo stack. */
export const MAX_HISTORY = 30;

export interface History {
  /** Record a new snapshot. No-op if it equals the current one. */
  pushSnapshot: (snap: TacticaGuardada) => void;
  /** Step back one snapshot; returns it (or null if nothing to undo). */
  undo: () => TacticaGuardada | null;
  /** Step forward one snapshot; returns it (or null if nothing to redo). */
  redo: () => TacticaGuardada | null;
  /** Discard the whole stack and start fresh from `snap` (used on load). */
  reset: (snap: TacticaGuardada) => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * useHistory — bounded undo/redo stack of full board snapshots.
 *
 * Snapshots are stored serialized so equality checks are cheap and pushing
 * an identical state is a no-op. Because a no-op push is free, the caller can
 * feed every debounced board change in and undo/redo restores simply won't
 * generate spurious entries (the restored state already equals the pointer).
 */
export function useHistory(initial: TacticaGuardada): History {
  const stack = useRef<string[]>([JSON.stringify(initial)]);
  const index = useRef(0);
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false });

  const sync = useCallback(() => {
    setFlags({
      canUndo: index.current > 0,
      canRedo: index.current < stack.current.length - 1,
    });
  }, []);

  const pushSnapshot = useCallback(
    (snap: TacticaGuardada) => {
      const serialized = JSON.stringify(snap);
      if (serialized === stack.current[index.current]) return;
      // Drop any redo branch, then append the new state.
      stack.current = stack.current.slice(0, index.current + 1);
      stack.current.push(serialized);
      if (stack.current.length > MAX_HISTORY) {
        stack.current = stack.current.slice(stack.current.length - MAX_HISTORY);
      }
      index.current = stack.current.length - 1;
      sync();
    },
    [sync],
  );

  const undo = useCallback((): TacticaGuardada | null => {
    if (index.current <= 0) return null;
    index.current -= 1;
    sync();
    return JSON.parse(stack.current[index.current]) as TacticaGuardada;
  }, [sync]);

  const redo = useCallback((): TacticaGuardada | null => {
    if (index.current >= stack.current.length - 1) return null;
    index.current += 1;
    sync();
    return JSON.parse(stack.current[index.current]) as TacticaGuardada;
  }, [sync]);

  const reset = useCallback(
    (snap: TacticaGuardada) => {
      stack.current = [JSON.stringify(snap)];
      index.current = 0;
      sync();
    },
    [sync],
  );

  return {
    pushSnapshot,
    undo,
    redo,
    reset,
    canUndo: flags.canUndo,
    canRedo: flags.canRedo,
  };
}
