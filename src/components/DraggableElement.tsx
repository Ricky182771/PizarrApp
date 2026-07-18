import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { usePercentDrag } from '../hooks/usePercentDrag';
import type { FieldElement } from '../types';
import { RotateCw, Square, Circle } from 'lucide-react';

interface DraggableElementProps {
  element: FieldElement;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
  onScaleChange?: (id: string, scale: number) => void;
  onRotationChange?: (id: string, rotation: number) => void;
  onShapeChange?: (id: string, shape: 'circle' | 'rect') => void;
  /** Optional grid step in % — when set, drag positions snap to the grid */
  snapStep?: number;
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

function GoalVisual() {
  return (
    <div className="flex items-center justify-center animate-in zoom-in-95 duration-200" style={{ width: 'clamp(44px,4.5vw,64px)', height: 'clamp(30px,3.2vw,44px)' }}>
      <svg viewBox="0 0 80 50" className="w-full h-full" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.45))' }}>
        {/* Back net panel */}
        <rect x="20" y="15" width="40" height="25" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Side net panels (3D perspective) */}
        {/* Left side net */}
        <path d="M 10 10 L 20 15 L 20 40 L 10 40 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Right side net */}
        <path d="M 70 10 L 60 15 L 60 40 L 70 40 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Top net panel */}
        <path d="M 10 10 L 70 10 L 60 15 L 20 15 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Front main posts & crossbar (white, thick) */}
        <path d="M 10 40 L 10 10 L 70 10 L 70 40" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="square" />
        {/* Net mesh lines (grid effect) */}
        {/* Vertical back lines */}
        <line x1="30" y1="15" x2="30" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <line x1="40" y1="15" x2="40" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <line x1="50" y1="15" x2="50" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        {/* Horizontal back lines */}
        <line x1="20" y1="23" x2="60" y2="23" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <line x1="20" y1="31" x2="60" y2="31" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

function DummyVisual() {
  return (
    <div className="flex items-center justify-center animate-in zoom-in-95 duration-200" style={{ width: 'clamp(32px,3.5vw,48px)', height: 'clamp(36px,3.8vw,52px)' }}>
      <svg viewBox="0 0 50 60" className="w-full h-full" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.4))' }}>
        {/* Base stand */}
        <ellipse cx="25" cy="54" rx="16" ry="4" fill="#1e293b" />
        <line x1="25" y1="54" x2="25" y2="44" stroke="#475569" strokeWidth="3" />
        {/* Dummy body (Neon Yellow/Green) */}
        <rect x="18" y="18" width="14" height="26" rx="4" fill="#a3e635" stroke="#84cc16" strokeWidth="1.5" />
        {/* Chest bars / rib lines (like training mannequins) */}
        <line x1="20" y1="24" x2="30" y2="24" stroke="#4d7c0f" strokeWidth="1.5" />
        <line x1="20" y1="30" x2="30" y2="30" stroke="#4d7c0f" strokeWidth="1.5" />
        <line x1="20" y1="36" x2="30" y2="36" stroke="#4d7c0f" strokeWidth="1.5" />
        {/* Head */}
        <circle cx="25" cy="11" r="7" fill="#a3e635" stroke="#84cc16" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function ZoneVisual({ shape }: { shape: 'circle' | 'rect' }) {
  return (
    <div
      className={`border-2 border-dashed border-amber-300/80 bg-amber-300/15 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-md'
      }`}
      style={{
        width: 'clamp(64px, 9vw, 110px)',
        height: 'clamp(64px, 9vw, 110px)',
        boxShadow: 'inset 0 0 20px rgba(252,211,77,0.15)',
      }}
    />
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

function DraggableElement({
  element,
  constraintsRef,
  onDragEnd,
  onDelete,
  onTextChange,
  onScaleChange,
  onRotationChange,
  onShapeChange,
  snapStep,
}: DraggableElementProps) {
  const isZone = element.type === 'zone';
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const isPinching = useRef(false);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  const { onPointerDown } = usePercentDrag({
    containerRef: constraintsRef,
    snapStep,
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

  /* ── Rotation Gesture Handler ── */
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!elRef.current) return;
    const rect = elRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const initialAngleRad = Math.atan2(e.clientY - cy, e.clientX - cx);
    const initialRotation = element.rotation ?? 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const currentAngleRad = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx);
      const diffRad = currentAngleRad - initialAngleRad;
      const diffDeg = diffRad * (180 / Math.PI);
      
      let newRotation = (initialRotation + diffDeg) % 360;
      if (newRotation < 0) newRotation += 360;

      // Snap steps (5 degrees normally, 15 degrees with Shift key)
      const snapStep = moveEvent.shiftKey ? 15 : 5;
      newRotation = Math.round(newRotation / snapStep) * snapStep;

      onRotationChange?.(element.id, newRotation);
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

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
        left: `${element.x}%`,
        top: `${element.y}%`,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${element.rotation ?? 0}deg)`,
        // Zones sit behind players and arrows at rest; only lift while dragging
        zIndex: isDragging ? (isZone ? 45 : 50) : isZone ? 1 : hovered ? 40 : 10,
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

      {/* Rotate button — top-left corner */}
      {hovered && !editing && (
        <button
          onPointerDown={handleRotateStart}
          className="absolute -top-2 -left-2 z-50 w-5 h-5 rounded-full
                     bg-indigo-600 hover:bg-indigo-500 text-white
                     flex items-center justify-center shadow-md cursor-pointer transition-colors"
          style={{ transform: `scale(${1 / scale})` }}
          title="Arrastrar para rotar (Shift para 15°)"
        >
          <RotateCw size={10} strokeWidth={2.5} />
        </button>
      )}

      {/* Shape toggle — zones only (circle ↔ rectangle) */}
      {isZone && hovered && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onShapeChange?.(element.id, element.shape === 'rect' ? 'circle' : 'rect');
          }}
          className="absolute -bottom-2 -right-2 z-50 w-5 h-5 rounded-full
                     bg-amber-500 hover:bg-amber-400 text-black
                     flex items-center justify-center shadow-md cursor-pointer transition-colors"
          style={{ transform: `scale(${1 / scale})` }}
          title={element.shape === 'rect' ? 'Cambiar a círculo' : 'Cambiar a rectángulo'}
        >
          {element.shape === 'rect' ? <Circle size={10} strokeWidth={2.5} /> : <Square size={10} strokeWidth={2.5} />}
        </button>
      )}

      {/* Visual */}
      {element.type === 'ball' && <BallVisual />}
      {element.type === 'cone' && <ConeVisual />}
      {element.type === 'goal' && <GoalVisual />}
      {element.type === 'dummy' && <DummyVisual />}
      {element.type === 'zone' && <ZoneVisual shape={element.shape ?? 'circle'} />}
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

export default memo(DraggableElement);
