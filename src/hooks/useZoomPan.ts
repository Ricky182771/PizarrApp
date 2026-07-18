import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const WHEEL_STEP = 0.15;

/**
 * useZoomPan — zoom & pan for the pitch container.
 *
 * Handles:
 *  • one-finger / mouse drag panning (ignoring interactive targets)
 *  • two-finger pinch zoom
 *  • wheel zoom (attached non-passively so preventDefault works)
 *  • pan clamping so the field never leaves the viewport
 */
export function useZoomPan(containerRef: RefObject<HTMLDivElement | null>) {
  const [transformState, setTransformState] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);

  const activePointers = useRef<{ [id: number]: { x: number; y: number } }>({});
  const lastDistance = useRef<number | null>(null);
  const isDraggingPitch = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const w = container.clientWidth;
      const h = container.clientHeight;
      const maxPanX = Math.max(0, (w * (currentZoom - 1)) / 2);
      const maxPanY = Math.max(0, (h * (currentZoom - 1)) / 2);
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [containerRef],
  );

  const resetZoom = useCallback(() => {
    setTransformState({ zoom: 1, pan: { x: 0, y: 0 } });
  }, []);

  const zoomIn = useCallback(() => {
    setTransformState((prev) => {
      const nextZoom = Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP);
      return { zoom: nextZoom, pan: clampPan(prev.pan.x, prev.pan.y, nextZoom) };
    });
  }, [clampPan]);

  const zoomOut = useCallback(() => {
    setTransformState((prev) => {
      const nextZoom = Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP);
      return { zoom: nextZoom, pan: clampPan(prev.pan.x, prev.pan.y, nextZoom) };
    });
  }, [clampPan]);

  /* ── Pointer handlers (spread onto the transformed field wrapper) ──── */

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('a')
    ) {
      return;
    }

    activePointers.current[e.pointerId] = { x: e.clientX, y: e.clientY };
    const pointerCount = Object.keys(activePointers.current).length;

    if (pointerCount === 1) {
      isDraggingPitch.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setIsPanning(true);
    } else if (pointerCount === 2) {
      isDraggingPitch.current = false;
      setIsPanning(true);
      const ids = Object.keys(activePointers.current).map(Number);
      const p1 = activePointers.current[ids[0]];
      const p2 = activePointers.current[ids[1]];
      lastDistance.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { /* ignore */ }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activePointers.current[e.pointerId]) return;
      activePointers.current[e.pointerId] = { x: e.clientX, y: e.clientY };

      const pointerCount = Object.keys(activePointers.current).length;

      if (pointerCount === 1 && isDraggingPitch.current) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };

        setTransformState((prev) => ({
          zoom: prev.zoom,
          pan: clampPan(prev.pan.x + dx, prev.pan.y + dy, prev.zoom),
        }));
      } else if (pointerCount === 2 && lastDistance.current !== null) {
        const ids = Object.keys(activePointers.current).map(Number);
        const p1 = activePointers.current[ids[0]];
        const p2 = activePointers.current[ids[1]];
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (lastDistance.current > 0) {
          const factor = distance / lastDistance.current;
          lastDistance.current = distance;

          setTransformState((prev) => {
            const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * factor));
            return { zoom: nextZoom, pan: clampPan(prev.pan.x, prev.pan.y, nextZoom) };
          });
        }
      }
    },
    [clampPan],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    delete activePointers.current[e.pointerId];
    const pointerCount = Object.keys(activePointers.current).length;

    if (pointerCount === 0) {
      isDraggingPitch.current = false;
      lastDistance.current = null;
      setIsPanning(false);
    } else if (pointerCount === 1) {
      const remainingId = Number(Object.keys(activePointers.current)[0]);
      const remaining = activePointers.current[remainingId];
      lastPanPos.current = { x: remaining.x, y: remaining.y };
      isDraggingPitch.current = true;
      lastDistance.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { /* ignore */ }
  }, []);

  /* ── Wheel zoom on the container ───────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
      setTransformState((prev) => {
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta));
        return { zoom: nextZoom, pan: clampPan(prev.pan.x, prev.pan.y, nextZoom) };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampPan, containerRef]);

  return {
    zoom: transformState.zoom,
    pan: transformState.pan,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
