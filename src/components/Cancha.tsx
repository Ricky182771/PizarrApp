/**
 * Cancha — A fully responsive CSS-only football field.
 *
 * Supports both landscape (default) and portrait orientations.
 * All lines are drawn with CSS borders and absolute positioning using
 * percentage-based values so the field scales to any container size.
 *
 * Real-pitch proportions (105 m × 68 m) mapped to percentages:
 *   Penalty area  → 16.5 m from goal line (15.71 %), 40.32 m wide (59.29 %)
 *   Goal area     → 5.5 m from goal line  ( 5.24 %), 18.32 m wide (26.94 %)
 *   Center circle → radius 9.15 m  (height-based ≈ 27 %)
 *   Penalty spot  → 11 m from goal line   (10.48 %)
 *   Corner arc    → 1 m radius            ( ~1 %)
 */

const LINE = 'border-white/75';
const LINE_W = 'border-2';

/* ── tiny helper for quarter-circle corner arcs ───────────────────────── */
function CornerArc({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const outer: Record<string, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  };
  const inner: Record<string, string> = {
    tl: '-top-full -left-full',
    tr: '-top-full left-0',
    bl: 'top-0 -left-full',
    br: 'top-0 left-0',
  };

  return (
    <div className={`absolute ${outer[position]} w-[2.5%] aspect-square overflow-hidden`}>
      <div
        className={`absolute ${inner[position]} w-[200%] h-[200%] rounded-full ${LINE_W} ${LINE}`}
      />
    </div>
  );
}

/* ── penalty arc (the "D") — landscape ────────────────────────────────── */
function PenaltyArcH({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left';
  return (
    <div
      className={`absolute top-[14%] ${isLeft ? 'left-[15.71%]' : 'right-[15.71%]'} h-[72%] overflow-hidden pointer-events-none`}
      style={{ width: '5%' }}
    >
      <div
        className={`absolute top-1/2 rounded-full ${LINE_W} ${LINE}`}
        style={{
          width: '340%',
          aspectRatio: '1',
          transform: 'translateY(-50%)',
          ...(isLeft ? { right: '20%' } : { left: '20%' }),
        }}
      />
    </div>
  );
}

/* ── penalty arc (the "D") — portrait ─────────────────────────────────── */
function PenaltyArcV({ side }: { side: 'top' | 'bottom' }) {
  const isTop = side === 'top';
  return (
    <div
      className={`absolute left-[14%] ${isTop ? 'top-[15.71%]' : 'bottom-[15.71%]'} w-[72%] overflow-hidden pointer-events-none`}
      style={{ height: '5%' }}
    >
      <div
        className={`absolute left-1/2 rounded-full ${LINE_W} ${LINE}`}
        style={{
          height: '340%',
          aspectRatio: '1',
          transform: 'translateX(-50%)',
          ...(isTop ? { bottom: '20%' } : { top: '20%' }),
        }}
      />
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────── */

import { forwardRef, type ReactNode } from 'react';

interface CanchaProps {
  children?: ReactNode;
  /** When true, draws the field in portrait orientation (goals at top/bottom) */
  isVertical?: boolean;
}

const Cancha = forwardRef<HTMLDivElement, CanchaProps>(
  function Cancha({ children, isVertical = false }, ref) {
    return (
      <div
        ref={ref}
        className="relative w-full h-full overflow-hidden rounded-2xl select-none touch-none"
        style={{ containerType: 'size' }}
      >
        {/* ── Grass gradient ──────────────────────────────────────────── */}
        <div
          className="absolute inset-0"
          style={{
            background: isVertical
              ? 'linear-gradient(250deg, #2d8a4e 0%, #1b7a3a 30%, #28924a 55%, #1c6e38 80%, #2d8a4e 100%)'
              : 'linear-gradient(160deg, #2d8a4e 0%, #1b7a3a 30%, #28924a 55%, #1c6e38 80%, #2d8a4e 100%)',
          }}
        />

        {/* ── Mowing stripes ──────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isVertical
              ? 'repeating-linear-gradient(0deg, transparent 0%, transparent 8.33%, rgba(255,255,255,0.045) 8.33%, rgba(255,255,255,0.045) 16.66%)'
              : 'repeating-linear-gradient(90deg, transparent 0%, transparent 8.33%, rgba(255,255,255,0.045) 8.33%, rgba(255,255,255,0.045) 16.66%)',
          }}
        />

        {/* ── Field boundary (touchlines + goal lines) ────────────────── */}
        <div className={`absolute inset-[4%] ${LINE_W} ${LINE}`}>

          {isVertical ? (
            /* ═══════════════════════════════════════════════════════════
             *  PORTRAIT / VERTICAL LAYOUT  (goals at top & bottom)
             * ═══════════════════════════════════════════════════════════ */
            <>
              {/* Center line — horizontal */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-0.5 bg-white/75" />

              {/* Center circle */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36%] aspect-square rounded-full ${LINE_W} ${LINE}`}
              />

              {/* Center spot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[0.8%] aspect-square bg-white/90 rounded-full" />

              {/* ═══ TOP HALF (goal at top) ═══ */}

              {/* Penalty area */}
              <div
                className={`absolute left-[20.35%] top-0 h-[15.71%] w-[59.29%] border-b-2 border-x-2 ${LINE}`}
              />

              {/* Goal area */}
              <div
                className={`absolute left-[36.53%] top-0 h-[5.24%] w-[26.94%] border-b-2 border-x-2 ${LINE}`}
              />

              {/* Penalty spot */}
              <div className="absolute left-1/2 top-[10.48%] -translate-x-1/2 -translate-y-1/2 h-[0.6%] aspect-square bg-white/90 rounded-full" />

              {/* Penalty arc */}
              <PenaltyArcV side="top" />

              {/* ═══ BOTTOM HALF (goal at bottom) ═══ */}

              {/* Penalty area */}
              <div
                className={`absolute left-[20.35%] bottom-0 h-[15.71%] w-[59.29%] border-t-2 border-x-2 ${LINE}`}
              />

              {/* Goal area */}
              <div
                className={`absolute left-[36.53%] bottom-0 h-[5.24%] w-[26.94%] border-t-2 border-x-2 ${LINE}`}
              />

              {/* Penalty spot */}
              <div className="absolute left-1/2 bottom-[10.48%] -translate-x-1/2 translate-y-1/2 h-[0.6%] aspect-square bg-white/90 rounded-full" />

              {/* Penalty arc */}
              <PenaltyArcV side="bottom" />
            </>
          ) : (
            /* ═══════════════════════════════════════════════════════════
             *  LANDSCAPE / HORIZONTAL LAYOUT (original, goals at left & right)
             * ═══════════════════════════════════════════════════════════ */
            <>
              {/* Center line — vertical */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0.5 bg-white/75" />

              {/* Center circle */}
              <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[36%] aspect-square rounded-full ${LINE_W} ${LINE}`}
              />

              {/* Center spot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[0.8%] aspect-square bg-white/90 rounded-full" />

              {/* ═══ LEFT HALF ═══ */}

              {/* Penalty area */}
              <div
                className={`absolute top-[20.35%] left-0 w-[15.71%] h-[59.29%] border-r-2 border-y-2 ${LINE}`}
              />

              {/* Goal area */}
              <div
                className={`absolute top-[36.53%] left-0 w-[5.24%] h-[26.94%] border-r-2 border-y-2 ${LINE}`}
              />

              {/* Penalty spot */}
              <div className="absolute top-1/2 left-[10.48%] -translate-x-1/2 -translate-y-1/2 w-[0.6%] aspect-square bg-white/90 rounded-full" />

              {/* Penalty arc */}
              <PenaltyArcH side="left" />

              {/* ═══ RIGHT HALF ═══ */}

              {/* Penalty area */}
              <div
                className={`absolute top-[20.35%] right-0 w-[15.71%] h-[59.29%] border-l-2 border-y-2 ${LINE}`}
              />

              {/* Goal area */}
              <div
                className={`absolute top-[36.53%] right-0 w-[5.24%] h-[26.94%] border-l-2 border-y-2 ${LINE}`}
              />

              {/* Penalty spot */}
              <div className="absolute top-1/2 right-[10.48%] translate-x-1/2 -translate-y-1/2 w-[0.6%] aspect-square bg-white/90 rounded-full" />

              {/* Penalty arc */}
              <PenaltyArcH side="right" />
            </>
          )}

          {/* ═══════════ CORNER ARCS (same for both orientations) ═══════════ */}
          <CornerArc position="tl" />
          <CornerArc position="tr" />
          <CornerArc position="bl" />
          <CornerArc position="br" />
        </div>

        {/* ── Player tokens layer (above field lines) ─────────────────── */}
        {children && (
          <div className="absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
            {children}
          </div>
        )}
      </div>
    );
  },
);

export default Cancha;
