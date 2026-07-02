import { useState } from 'react';
import { usePercentDrag } from '../hooks/usePercentDrag';

export interface FichaJugadorProps {
  /** Shirt number shown on the token */
  numero: number;
  /** Player name displayed below the number */
  nombre: string;
  /** Background colour — any valid CSS colour */
  color: string;
  /** Current X position in percentage (0-100) of the field container width */
  x: number;
  /** Current Y position in percentage (0-100) of the field container height */
  y: number;
  /** Ref to the drag-constraint container (the Cancha wrapper) */
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  /** Called when the user finishes dragging, with updated % coordinates */
  onDragEnd?: (x: number, y: number) => void;
  /** Called when the delete button is clicked */
  onDelete?: (numero: number) => void;
  /** Called when the player name is edited */
  onNameChange?: (newName: string) => void;
}

/**
 * FichaJugador — A draggable player token.
 *
 * Renders a t-shirt SVG (back view) with the player's number and name.
 * Uses pointer events for drag so the token positions correctly
 * with percentage-based coordinates without any accumulated offsets.
 */
export default function FichaJugador({
  numero,
  nombre,
  color,
  x,
  y,
  constraintsRef,
  onDragEnd,
  onDelete,
  onNameChange,
}: FichaJugadorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);

  const { onPointerDown } = usePercentDrag({
    containerRef: constraintsRef,
    onMove: (nx, ny) => {
      setIsDragging(true);
      onDragEnd?.(nx, ny);
    },
    onEnd: (nx, ny) => {
      setIsDragging(false);
      onDragEnd?.(nx, ny);
    },
  });

  const handleFinishEdit = (value: string) => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== nombre) {
      onNameChange?.(trimmed);
    }
  };

  return (
    <div
      onPointerDown={editing ? undefined : onPointerDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute flex flex-col items-center gap-0.5 select-none touch-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: editing ? 'auto' : isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : hovered ? 40 : 10,
        transition: isDragging ? 'none' : 'filter 0.15s ease',
        filter: isDragging ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' : 'none',
        scale: isDragging ? '1.15' : '1',
      }}
    >
      {/* ── T-shirt SVG (football jersey back view) ─────────────── */}
      <div
        className="relative"
        style={{
          width: 'clamp(28px, 4vw, 56px)',
          height: 'clamp(30px, 4.2vw, 58px)',
          filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))',
        }}
      >
        {/* Delete button */}
        {hovered && !editing && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(numero);
            }}
            className="absolute -top-1.5 -right-1.5 z-50 w-5 h-5 rounded-full
                       bg-red-500 hover:bg-red-400 text-white text-[10px]
                       flex items-center justify-center leading-none
                       shadow-md cursor-pointer transition-colors"
          >
            ×
          </button>
        )}

        <svg
          viewBox="0 0 64 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Shirt body — back view silhouette */}
          <path
            d={`
              M22 4
              C24 2, 40 2, 42 4
              L48 3 L56 14 L56 24 L48 21
              L48 62 C48 64, 46 66, 44 66
              L20 66 C18 66, 16 64, 16 62
              L16 21 L8 24 L8 14 L16 3
              Z
            `}
            fill={color}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Collar */}
          <path
            d="M24 4 C28 7, 36 7, 40 4"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Subtle body shading (left side) */}
          <path
            d="M16 21 L16 62 C16 64, 18 66, 20 66 L24 66 L24 21 Z"
            fill="rgba(0,0,0,0.08)"
          />
          {/* Sleeve seam lines */}
          <line x1="16" y1="21" x2="22" y2="5" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          <line x1="48" y1="21" x2="42" y2="5" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          {/* Number text on back */}
          <text
            x="32"
            y="44"
            textAnchor="middle"
            fill="white"
            fontSize="22"
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            {numero}
          </text>
        </svg>
      </div>

      {/* ── Name label (editable on double-click) ────────────────── */}
      {editing ? (
        <input
          autoFocus
          defaultValue={nombre}
          onBlur={(e) => handleFinishEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFinishEdit((e.target as HTMLInputElement).value);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="px-1 py-0 rounded bg-black/70 text-white font-semibold text-center
                     border border-white/30 outline-none"
          style={{
            fontSize: 'clamp(7px, 0.8vw, 11px)',
            width: 'clamp(40px, 4vw, 64px)',
          }}
        />
      ) : (
        <span
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="font-semibold text-white text-center leading-tight whitespace-nowrap drop-shadow-md cursor-pointer"
          style={{ fontSize: 'clamp(6px, 0.75vw, 11px)' }}
        >
          {nombre}
        </span>
      )}
    </div>
  );
}
