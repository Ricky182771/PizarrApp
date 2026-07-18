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
  onDragStart,
  dragThreshold = 8,
  snapStep,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  onMove?: (x: number, y: number) => void;
  /** Called on drop with % coords and the raw pointer client coords */
  onEnd?: (x: number, y: number, client?: { clientX: number; clientY: number }) => void;
  /** Called once when the drag threshold is first exceeded */
  onDragStart?: () => void;
  /** Minimum px distance pointer must move before drag begins (default: 8) */
  dragThreshold?: number;
  /** Optional grid step in % — when set, positions snap to the grid */
  snapStep?: number;
}) {
  const dragging = useRef(false);
  /** Whether the drag threshold has been exceeded for the current gesture */
  const thresholdExceeded = useRef(false);
  const elRef = useRef<HTMLElement | null>(null);
  // Offset from pointer to element center so the drag doesn't "jump"
  const offsetRef = useRef({ dx: 0, dy: 0 });
  // Initial pointer position for threshold calculation
  const startPos = useRef({ x: 0, y: 0 });

  // Refs to store active event listeners so they can be cleaned up on unmount
  const activeMoveRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeTouchMoveRef = useRef<((e: TouchEvent) => void) | null>(null);

  // requestAnimationFrame batching: at most one onMove per frame
  const rafId = useRef<number | null>(null);
  const pendingPos = useRef<[number, number] | null>(null);

  const toPercent = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const c = containerRef.current;
      if (!c) return [50, 50];
      const r = c.getBoundingClientRect();
      const width = r.width || 1;
      const height = r.height || 1;
      let x = Math.max(0, Math.min(100, ((clientX - r.left - offsetRef.current.dx) / width) * 100));
      let y = Math.max(0, Math.min(100, ((clientY - r.top - offsetRef.current.dy) / height) * 100));
      if (snapStep && snapStep > 0) {
        x = Math.round(x / snapStep) * snapStep;
        y = Math.round(y / snapStep) * snapStep;
      }
      return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    },
    [containerRef, snapStep],
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
      if (activeTouchMoveRef.current) {
        document.removeEventListener('touchmove', activeTouchMoveRef.current);
      }
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging.current = true;
      thresholdExceeded.current = false;
      const el = e.currentTarget as HTMLElement;
      elRef.current = el;
      el.setPointerCapture(e.pointerId);

      // Store the initial pointer position for threshold calculation
      startPos.current = { x: e.clientX, y: e.clientY };

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

      // Prevent page scrolling on touch devices during drag
      const handleTouchMove = (ev: TouchEvent) => {
        if (dragging.current) ev.preventDefault();
      };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        ev.preventDefault();

        // Check if the drag threshold has been exceeded
        if (!thresholdExceeded.current) {
          const dx = ev.clientX - startPos.current.x;
          const dy = ev.clientY - startPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < dragThreshold) return;
          // Threshold exceeded — mark and notify
          thresholdExceeded.current = true;
          onDragStart?.();
        }

        // Batch position updates to one per animation frame for smooth,
        // cheap dragging even with many elements on the board.
        pendingPos.current = toPercent(ev.clientX, ev.clientY);
        if (rafId.current === null) {
          rafId.current = requestAnimationFrame(() => {
            rafId.current = null;
            if (pendingPos.current && dragging.current) {
              onMove?.(pendingPos.current[0], pendingPos.current[1]);
            }
          });
        }
      };

      const handlePointerUp = (ev: PointerEvent) => {
        if (!dragging.current) return;
        dragging.current = false;
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        // Only fire onEnd if a real drag occurred
        if (thresholdExceeded.current) {
          const [px, py] = toPercent(ev.clientX, ev.clientY);
          onEnd?.(px, py, { clientX: ev.clientX, clientY: ev.clientY });
        }
        elRef.current?.releasePointerCapture(ev.pointerId);
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('touchmove', handleTouchMove);
        activeMoveRef.current = null;
        activeUpRef.current = null;
        activeTouchMoveRef.current = null;
      };

      activeMoveRef.current = handlePointerMove;
      activeUpRef.current = handlePointerUp;
      activeTouchMoveRef.current = handleTouchMove;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    },
    [containerRef, toPercent, onMove, onEnd, onDragStart, dragThreshold],
  );

  return { onPointerDown, thresholdExceeded };
}
