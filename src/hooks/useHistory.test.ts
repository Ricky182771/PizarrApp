import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHistory, MAX_HISTORY } from './useHistory';
import type { TacticaGuardada } from '../types';

const base: TacticaGuardada = {
  local: [],
  visitante: [],
  colorLocal: '#000',
  colorVisitante: '#fff',
  elements: [],
  arrows: [],
};

function withName(name: string): TacticaGuardada {
  return { ...base, tacticName: name };
}

describe('useHistory', () => {
  it('starts with nothing to undo or redo', () => {
    const { result } = renderHook(() => useHistory(base));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushes distinct snapshots and undoes/redoes them', () => {
    const { result } = renderHook(() => useHistory(withName('a')));

    act(() => result.current.pushSnapshot(withName('b')));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    let undone: TacticaGuardada | null = null;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone!.tacticName).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    let redone: TacticaGuardada | null = null;
    act(() => {
      redone = result.current.redo();
    });
    expect(redone!.tacticName).toBe('b');
  });

  it('ignores pushes identical to the current snapshot', () => {
    const { result } = renderHook(() => useHistory(withName('a')));
    act(() => result.current.pushSnapshot(withName('a')));
    expect(result.current.canUndo).toBe(false);
  });

  it('drops the redo branch when pushing after an undo', () => {
    const { result } = renderHook(() => useHistory(withName('a')));
    act(() => result.current.pushSnapshot(withName('b')));
    act(() => {
      result.current.undo();
    });
    act(() => result.current.pushSnapshot(withName('c')));
    expect(result.current.canRedo).toBe(false);
    let undone: TacticaGuardada | null = null;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone!.tacticName).toBe('a');
  });

  it('caps the stack at MAX_HISTORY entries', () => {
    const { result } = renderHook(() => useHistory(withName('0')));
    act(() => {
      for (let i = 1; i <= MAX_HISTORY + 10; i++) {
        result.current.pushSnapshot(withName(String(i)));
      }
    });
    // Undo as far as possible; we should never reach snapshot '0'.
    const seen: string[] = [];
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      let snap: TacticaGuardada | null = null;
      act(() => {
        snap = result.current.undo();
      });
      const s = snap as TacticaGuardada | null;
      if (!s) break;
      seen.push(s.tacticName!);
    }
    expect(seen).not.toContain('0');
    expect(seen.length).toBeLessThanOrEqual(MAX_HISTORY - 1);
  });

  it('reset clears history to a single snapshot', () => {
    const { result } = renderHook(() => useHistory(withName('a')));
    act(() => result.current.pushSnapshot(withName('b')));
    act(() => result.current.reset(withName('z')));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
