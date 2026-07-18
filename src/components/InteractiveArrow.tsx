import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { ArrowItem } from '../types';

interface InteractiveArrowProps {
  arrow: ArrowItem;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (id: string, updates: Partial<ArrowItem>) => void;
  onDelete: (id: string) => void;
  onScaleChange?: (id: string, scale: number) => void;
}

function InteractiveArrow({
  arrow,
  constraintsRef,
  onUpdate,
  onDelete,
  onScaleChange,
}: InteractiveArrowProps) {
  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const hoverTimer = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = window.setTimeout(() => {
      setHovered(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const toPercent = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const c = constraintsRef.current;
      if (!c) return [50, 50];
      const r = c.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
      return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    },
    [constraintsRef],
  );

  const startDrag = useCallback(
    (point: 'p1' | 'p2', e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        ev.preventDefault();
        const [x, y] = toPercent(ev.clientX, ev.clientY);
        if (point === 'p1') {
          onUpdate(arrow.id, { x1: x, y1: y });
        } else {
          onUpdate(arrow.id, { x2: x, y2: y });
        }
      };

      const up = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    },
    [arrow.id, onUpdate, toPercent],
  );

  const startDragLine = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const startX = e.clientX;
      const startY = e.clientY;
      const initialX1 = arrow.x1;
      const initialY1 = arrow.y1;
      const initialX2 = arrow.x2;
      const initialY2 = arrow.y2;

      const c = constraintsRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();

      const move = (ev: PointerEvent) => {
        ev.preventDefault();
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((ev.clientY - startY) / rect.height) * 100;

        const newX1 = initialX1 + dx;
        const newY1 = initialY1 + dy;
        const newX2 = initialX2 + dx;
        const newY2 = initialY2 + dy;

        const minX = Math.min(newX1, newX2);
        const maxX = Math.max(newX1, newX2);
        const minY = Math.min(newY1, newY2);
        const maxY = Math.max(newY1, newY2);

        let clampedDx = dx;
        let clampedDy = dy;

        if (minX < 0) clampedDx = clampedDx - minX;
        if (maxX > 100) clampedDx = clampedDx - (maxX - 100);
        if (minY < 0) clampedDy = clampedDy - minY;
        if (maxY > 100) clampedDy = clampedDy - (maxY - 100);

        onUpdate(arrow.id, {
          x1: Math.round((initialX1 + clampedDx) * 100) / 100,
          y1: Math.round((initialY1 + clampedDy) * 100) / 100,
          x2: Math.round((initialX2 + clampedDx) * 100) / 100,
          y2: Math.round((initialY2 + clampedDy) * 100) / 100,
        });
      };

      const up = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };

      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    },
    [arrow, onUpdate, constraintsRef],
  );

  const scale = arrow.scale ?? 1;

  /* ── Wheel resize (desktop / trackpad pinch) ── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const current = arrow.scale ?? 1;
      const newScale = Math.max(0.5, Math.min(3, current + delta));
      onScaleChange?.(arrow.id, Math.round(newScale * 100) / 100);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [arrow.id, arrow.scale, onScaleChange]);

  /* ── Pinch resize (touch: two-finger gesture) ── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist.current = Math.hypot(dx, dy);
        pinchStartScale.current = arrow.scale ?? 1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2 && pinchStartDist.current > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / pinchStartDist.current;
        const newScale = Math.max(0.5, Math.min(3, pinchStartScale.current * ratio));
        onScaleChange?.(arrow.id, Math.round(newScale * 100) / 100);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDist.current = 0;
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [arrow.id, arrow.scale, onScaleChange]);

  // Derived visual sizes from scale
  const strokeW = 3.5 * scale;
  const handleSize = Math.max(10, 12 * scale);

  // Middle point for rendering the delete button
  const midX = (arrow.x1 + arrow.x2) / 2;
  const midY = (arrow.y1 + arrow.y2) / 2;

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      {/* ── SVG Arrow (Simple Line) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thick invisible stroke to make dragging the line body easy */}
        <line
          x1={`${arrow.x1}%`}
          y1={`${arrow.y1}%`}
          x2={`${arrow.x2}%`}
          y2={`${arrow.y2}%`}
          stroke="transparent"
          strokeWidth={Math.max(20, 20 * scale)}
          className="pointer-events-auto cursor-grab active:cursor-grabbing"
          onPointerDown={startDragLine}
        />
        {/* Visible Solid Line */}
        <line
          x1={`${arrow.x1}%`}
          y1={`${arrow.y1}%`}
          x2={`${arrow.x2}%`}
          y2={`${arrow.y2}%`}
          stroke="#facc15"
          strokeWidth={strokeW}
        />
      </svg>

      {/* ── Interactive Handles (With large touch targets) ── */}
      <div
        onPointerDown={(e) => startDrag('p1', e)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="absolute z-30 touch-none flex items-center justify-center cursor-move pointer-events-auto"
        style={{
          width: Math.max(44, 44 * scale),
          height: Math.max(44, 44 * scale),
          left: `${arrow.x1}%`,
          top: `${arrow.y1}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="rounded-full bg-yellow-400 border border-black shadow hover:scale-125 transition-transform"
          style={{
            width: handleSize,
            height: handleSize,
          }}
        />
      </div>

      <div
        onPointerDown={(e) => startDrag('p2', e)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="absolute z-30 touch-none flex items-center justify-center cursor-move pointer-events-auto"
        style={{
          width: Math.max(44, 44 * scale),
          height: Math.max(44, 44 * scale),
          left: `${arrow.x2}%`,
          top: `${arrow.y2}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="rounded-full bg-yellow-500 border border-black shadow hover:scale-125 transition-transform"
          style={{
            width: handleSize,
            height: handleSize,
          }}
        />
      </div>

      {/* ── Delete Button at the center (visible on hover) ── */}
      {hovered && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(arrow.id);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute z-40 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs
                     flex items-center justify-center shadow-md cursor-pointer transition-colors pointer-events-auto"
          style={{
            left: `${midX}%`,
            top: `${midY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          title="Eliminar línea"
          aria-label="Eliminar línea"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default memo(InteractiveArrow);
