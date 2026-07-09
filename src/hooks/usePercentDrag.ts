import { useRef, useCallback, useEffect, type RefObject } from 'react';

/**
 * usePercentDrag — pointer-based drag that reports positions as
 * percentages of a container element. This avoids Framer Motion's
 * accumulated-offset problem entirely.
 *
 * Returns event handlers to spread onto the draggable element.
 */
export function usePercentDrag({
  containerRef,
  onMove,
  onEnd,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  onMove?: (x: number, y: number) => void;
  onEnd?: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);
  const elRef = useRef<HTMLElement | null>(null);
  // Offset from pointer to element center so the drag doesn't "jump"
  const offsetRef = useRef({ dx: 0, dy: 0 });

  // Refs to store active event listeners so they can be cleaned up on unmount
  const activeMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpRef = useRef<((e: PointerEvent) => void) | null>(null);

  const toPercent = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const c = containerRef.current;
      if (!c) return [50, 50];
      const r = c.getBoundingClientRect();
      const width = r.width || 1;
      const height = r.height || 1;
      const x = Math.max(0, Math.min(100, ((clientX - r.left - offsetRef.current.dx) / width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - r.top - offsetRef.current.dy) / height) * 100));
      return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    },
    [containerRef],
  );

  // Clean up pointer listeners on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (activeMoveRef.current) {
        document.removeEventListener('pointermove', activeMoveRef.current);
      }
      if (activeUpRef.current) {
        document.removeEventListener('pointerup', activeUpRef.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging.current = true;
      document.body.style.touchAction = 'none';
      const el = e.currentTarget as HTMLElement;
      elRef.current = el;
      el.setPointerCapture(e.pointerId);

      // Calculate offset from pointer to element center
      const elRect = el.getBoundingClientRect();
      const cRect = containerRef.current?.getBoundingClientRect();
      if (cRect) {
        const elCenterX = elRect.left + elRect.width / 2;
        const elCenterY = elRect.top + elRect.height / 2;
        offsetRef.current = {
          dx: e.clientX - elCenterX,
          dy: e.clientY - elCenterY,
        };
      }

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        ev.preventDefault();
        const [px, py] = toPercent(ev.clientX, ev.clientY);
        onMove?.(px, py);
      };

      const handlePointerUp = (ev: PointerEvent) => {
        if (!dragging.current) return;
        dragging.current = false;
        document.body.style.touchAction = '';
        const [px, py] = toPercent(ev.clientX, ev.clientY);
        onEnd?.(px, py);
        elRef.current?.releasePointerCapture(ev.pointerId);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        activeMoveRef.current = null;
        activeUpRef.current = null;
      };

      activeMoveRef.current = handlePointerMove;
      activeUpRef.current = handlePointerUp;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [containerRef, toPercent, onMove, onEnd],
  );

  return { onPointerDown };
}
