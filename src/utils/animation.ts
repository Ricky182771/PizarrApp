import { uid, type Jugador, type FieldElement, type Frame, type FramePlayer } from '../types';

/* ── Play animation helpers ───────────────────────────────────────────────
 * A `Frame` (defined in types.ts) is a partial snapshot of positions — both
 * squads plus any balls — captured at one moment. Frames live as App state
 * and persist inside `TacticaGuardada.frames`. This module owns the pure
 * capture + interpolation logic; playback timing lives in `useAnimation`.
 */

/** Snapshot the current board positions into a new key frame. */
export function captureFrame(
  local: Jugador[],
  visitante: Jugador[],
  elements: FieldElement[],
): Frame {
  const pos = (j: Jugador): FramePlayer => ({ numero: j.numero, x: j.x, y: j.y });
  return {
    id: uid(),
    local: local.map(pos),
    visitante: visitante.map(pos),
    balls: elements.filter((e) => e.type === 'ball').map((e) => ({ id: e.id, x: e.x, y: e.y })),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface AnimatedState {
  local: Jugador[];
  visitante: Jugador[];
  elements: FieldElement[];
}

/**
 * Linearly interpolate the live board toward the frames at a fractional
 * `progress` (in frame-index units: 1.5 = halfway between frame 1 and 2).
 * Players/balls absent from a frame keep their live position, so newly added
 * tokens don't jump. Returns the live board untouched when there are no frames.
 */
export function interpolateFrames(
  frames: Frame[],
  progress: number,
  live: AnimatedState,
): AnimatedState {
  if (frames.length === 0) return live;
  const maxIndex = frames.length - 1;
  const clamped = Math.max(0, Math.min(maxIndex, progress));
  const i = Math.min(maxIndex, Math.floor(clamped));
  const j = Math.min(maxIndex, i + 1);
  const t = clamped - i;
  const A = frames[i];
  const B = frames[j];

  const interpPlayers = (base: Jugador[], a: FramePlayer[], b: FramePlayer[]): Jugador[] =>
    base.map((p) => {
      const pa = a.find((f) => f.numero === p.numero);
      const pb = b.find((f) => f.numero === p.numero);
      if (pa && pb) return { ...p, x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
      if (pa) return { ...p, x: pa.x, y: pa.y };
      return p;
    });

  const interpElements = (base: FieldElement[]): FieldElement[] =>
    base.map((el) => {
      if (el.type !== 'ball') return el;
      const ba = A.balls.find((f) => f.id === el.id);
      const bb = B.balls.find((f) => f.id === el.id);
      if (ba && bb) return { ...el, x: lerp(ba.x, bb.x, t), y: lerp(ba.y, bb.y, t) };
      if (ba) return { ...el, x: ba.x, y: ba.y };
      return el;
    });

  return {
    local: interpPlayers(live.local, A.local, B.local),
    visitante: interpPlayers(live.visitante, A.visitante, B.visitante),
    elements: interpElements(live.elements),
  };
}
