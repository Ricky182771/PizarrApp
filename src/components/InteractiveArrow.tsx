import { useState, useCallback, useRef, useEffect, memo } from 'react';
import type { ArrowItem, ArrowStyle } from '../types';

interface InteractiveArrowProps {
  arrow: ArrowItem;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (id: string, updates: Partial<ArrowItem>) => void;
  onDelete: (id: string) => void;
  onScaleChange?: (id: string, scale: number) => void;
}

const STYLE_ORDER: ArrowStyle[] = ['solid', 'dashed', 'curved'];
const STYLE_GLYPH: Record<ArrowStyle, string> = { solid: '─', dashed: '┄', curved: '∿' };
const STYLE_LABEL: Record<ArrowStyle, string> = {
  solid: 'sólida',
  dashed: 'punteada',
  curved: 'curva',
};

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
    (point: 'p1' | 'p2' | 'control', e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        ev.preventDefault();
        const [x, y] = toPercent(ev.clientX, ev.clientY);
        if (point === 'p1') {
          onUpdate(arrow.id, { x1: x, y1: y });
        } else if (point === 'p2') {
          onUpdate(arrow.id, { x2: x, y2: y });
        } else {
          onUpdate(arrow.id, { cx: x, cy: y });
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
      // Move the control point in lock-step so the curve keeps its shape
      const hasCtrl = arrow.cx !== undefined && arrow.cy !== undefined;
      const initialCx = arrow.cx ?? 0;
      const initialCy = arrow.cy ?? 0;

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
          ...(hasCtrl && {
            cx: Math.round((initialCx + clampedDx) * 100) / 100,
            cy: Math.round((initialCy + clampedDy) * 100) / 100,
          }),
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

  const style: ArrowStyle = arrow.style ?? 'solid';
  const isCurved = style === 'curved';

  // Control point (screen %) — derived from a perpendicular offset when the
  // curve has never been shaped, persisted once the user drags the handle.
  const midX = (arrow.x1 + arrow.x2) / 2;
  const midY = (arrow.y1 + arrow.y2) / 2;
  const dxl = arrow.x2 - arrow.x1;
  const dyl = arrow.y2 - arrow.y1;
  const len = Math.hypot(dxl, dyl) || 1;
  const defCx = midX + (-dyl / len) * 15;
  const defCy = midY + (dxl / len) * 15;
  const cx = arrow.cx ?? defCx;
  const cy = arrow.cy ?? defCy;

  const pathD = isCurved
    ? `M ${arrow.x1} ${arrow.y1} Q ${cx} ${cy} ${arrow.x2} ${arrow.y2}`
    : `M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`;

  // Point on the arrow used to anchor the delete / style buttons.
  const btnX = isCurved ? 0.25 * arrow.x1 + 0.5 * cx + 0.25 * arrow.x2 : midX;
  const btnY = isCurved ? 0.25 * arrow.y1 + 0.5 * cy + 0.25 * arrow.y2 : midY;

  const dashArray = style === 'dashed' ? `${Math.max(3, 3 * scale)} ${Math.max(3, 3 * scale)}` : undefined;

  const cycleStyle = useCallback(() => {
    const next = STYLE_ORDER[(STYLE_ORDER.indexOf(style) + 1) % STYLE_ORDER.length];
    onUpdate(arrow.id, { style: next });
  }, [arrow.id, onUpdate, style]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
      {/* ── SVG Arrow ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thick invisible stroke to make dragging the line body easy */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(20, 20 * scale)}
          vectorEffect="non-scaling-stroke"
          className="pointer-events-auto cursor-grab active:cursor-grabbing"
          onPointerDown={startDragLine}
        />
        {/* Visible line */}
        <path
          d={pathD}
          fill="none"
          stroke="#facc15"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* ── Curve control handle ── */}
      {isCurved && (
        <div
          onPointerDown={(e) => startDrag('control', e)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute z-30 touch-none flex items-center justify-center cursor-move pointer-events-auto"
          style={{
            width: Math.max(40, 40 * scale),
            height: Math.max(40, 40 * scale),
            left: `${cx}%`,
            top: `${cy}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="rounded-full bg-amber-300/80 border border-black/60 shadow"
            style={{ width: handleSize * 0.8, height: handleSize * 0.8 }}
          />
        </div>
      )}

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

      {/* ── Contextual controls (visible on hover): change style + delete ── */}
      {hovered && (
        <div
          className="absolute z-40 flex items-center gap-1 pointer-events-none"
          style={{
            left: `${btnX}%`,
            top: `${btnY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              cycleStyle();
            }}
            className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold
                       flex items-center justify-center shadow-md cursor-pointer transition-colors pointer-events-auto leading-none"
            title={`Estilo: línea ${STYLE_LABEL[style]} (clic para cambiar)`}
            aria-label="Cambiar estilo de línea"
          >
            {STYLE_GLYPH[style]}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(arrow.id);
            }}
            className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs
                       flex items-center justify-center shadow-md cursor-pointer transition-colors pointer-events-auto"
            title="Eliminar línea"
            aria-label="Eliminar línea"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(InteractiveArrow);
