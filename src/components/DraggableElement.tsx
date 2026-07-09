import { useRef, useState, useEffect, useCallback } from 'react';
import { usePercentDrag } from '../hooks/usePercentDrag';
import type { FieldElement } from '../types';

interface DraggableElementProps {
  element: FieldElement;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
  onScaleChange?: (id: string, scale: number) => void;
}

/* ── Visual renderers per type ────────────────────────────────────────── */

function BallVisual() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 'clamp(22px,2.4vw,34px)',
        height: 'clamp(22px,2.4vw,34px)',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
      }}
    >
      <span style={{ fontSize: 'clamp(16px, 2vw, 28px)', lineHeight: 1 }}>⚽</span>
    </div>
  );
}

function ConeVisual() {
  return (
    <div className="flex items-center justify-center" style={{ width: 'clamp(26px,2.8vw,40px)', height: 'clamp(18px,2vw,28px)' }}>
      <svg viewBox="0 0 40 24" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}>
        {/* Base ellipse */}
        <ellipse cx="20" cy="20" rx="18" ry="4" fill="#ea580c" />
        {/* Cone body — tapered trapezoid */}
        <path d="M4 20 L12 6 L28 6 L36 20 Z" fill="#f97316" />
        {/* Top surface ellipse */}
        <ellipse cx="20" cy="6" rx="8" ry="2.5" fill="#fb923c" />
        {/* Highlight ridge */}
        <ellipse cx="20" cy="6" rx="5" ry="1.5" fill="#fdba74" opacity="0.6" />
        {/* Side shading */}
        <path d="M4 20 L12 6 L14 6 L6 20 Z" fill="rgba(0,0,0,0.15)" />
      </svg>
    </div>
  );
}

function TextVisual({
  text,
  editing,
  onFinishEdit,
}: {
  text: string;
  editing: boolean;
  onFinishEdit: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        defaultValue={text}
        onBlur={(e) => onFinishEdit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onFinishEdit((e.target as HTMLInputElement).value);
        }}
        className="px-2 py-0.5 rounded-md bg-black/70 text-white text-sm font-medium
                   border border-white/30 outline-none min-w-[60px] text-center"
        style={{ fontSize: 'clamp(10px, 1vw, 14px)' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm
                 text-white font-medium border border-white/20
                 cursor-grab whitespace-nowrap"
      style={{ fontSize: 'clamp(10px, 1vw, 14px)' }}
    >
      {text}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

export default function DraggableElement({
  element,
  constraintsRef,
  onDragEnd,
  onDelete,
  onTextChange,
  onScaleChange,
}: DraggableElementProps) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const isPinching = useRef(false);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  const { onPointerDown } = usePercentDrag({
    containerRef: constraintsRef,
    onMove: (nx, ny) => {
      if (isPinching.current) return; // suppress position updates while pinching
      setIsDragging(true);
      onDragEnd(element.id, nx, ny);
    },
    onEnd: (nx, ny) => {
      if (isPinching.current) return;
      setIsDragging(false);
      onDragEnd(element.id, nx, ny);
    },
  });

  /* ── Wrapped pointerdown — skip if editing or pinching ── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (editing || isPinching.current || !e.isPrimary) return;
      onPointerDown(e);
    },
    [editing, onPointerDown],
  );

  /* ── Wheel resize (desktop scroll wheel / trackpad pinch) ── */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const current = element.scale ?? 1;
      const newScale = Math.max(0.5, Math.min(3, current + delta));
      onScaleChange?.(element.id, Math.round(newScale * 100) / 100);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [element.id, element.scale, onScaleChange]);

  /* ── Pinch resize (touch: two-finger gesture) ── */
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        isPinching.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist.current = Math.hypot(dx, dy);
        pinchStartScale.current = element.scale ?? 1;
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
        onScaleChange?.(element.id, Math.round(newScale * 100) / 100);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching.current = false;
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
  }, [element.id, element.scale, onScaleChange]);

  const scale = element.scale ?? 1;

  return (
    <div
      ref={elRef}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={(e) => {
        if (element.type === 'text' && !editing) {
          e.stopPropagation();
          setEditing(true);
        }
      }}
      className="absolute flex flex-col items-center select-none touch-none"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(calc(${element.x} * 1cqw - 50%), calc(${element.y} * 1cqh - 50%), 0) scale(${scale})`,
        zIndex: isDragging ? 50 : hovered ? 40 : 10,
        cursor: editing ? 'auto' : isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'transform 0.15s ease',
      }}
    >
      {/* Delete button — counter-scaled so it stays the same clickable size */}
      {hovered && !editing && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(element.id);
          }}
          className="absolute -top-2 -right-2 z-50 w-5 h-5 rounded-full
                     bg-red-500 hover:bg-red-400 text-white text-[11px]
                     flex items-center justify-center leading-none
                     shadow-md cursor-pointer transition-colors"
          style={{ transform: `scale(${1 / scale})` }}
        >
          ×
        </button>
      )}

      {/* Visual */}
      {element.type === 'ball' && <BallVisual />}
      {element.type === 'cone' && <ConeVisual />}
      {element.type === 'text' && (
        <TextVisual
          text={element.text ?? 'Texto'}
          editing={editing}
          onFinishEdit={(val) => {
            setEditing(false);
            onTextChange?.(element.id, val);
          }}
        />
      )}
    </div>
  );
}
