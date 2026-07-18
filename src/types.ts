/* ── Shared types for field annotations ────────────────────────────────── */

export type ElementType = 'ball' | 'cone' | 'text' | 'goal' | 'dummy' | 'zone';

export interface FieldElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  text?: string;
  scale?: number;
  rotation?: number; // in degrees, e.g. 0 to 360
  /** Only meaningful for type 'zone' — highlighted-area shape (default 'circle') */
  shape?: 'circle' | 'rect';
}

export type ArrowStyle = 'solid' | 'dashed' | 'curved';

export interface ArrowItem {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scale?: number;
  /** Stroke style (default 'solid' when absent — keeps old tactics valid) */
  style?: ArrowStyle;
  /** Bézier control point (field %), only used/persisted for 'curved' arrows */
  cx?: number;
  cy?: number;
}

export interface Jugador {
  numero: number;
  nombre: string;
  x: number;
  y: number;
  /**
   * Whether the player is on the pitch. Absent = on the pitch (keeps tactics
   * saved before the bench feature valid). `false` means benched.
   */
  enCancha?: boolean;
}

/* ── Play animation (key-frame snapshots of positions) ─────────────────── */

export interface FramePlayer {
  numero: number;
  x: number;
  y: number;
}

export interface FrameBall {
  id: string;
  x: number;
  y: number;
}

/** A key frame: positions of both squads and any balls at one moment. */
export interface Frame {
  id: string;
  local: FramePlayer[];
  visitante: FramePlayer[];
  balls: FrameBall[];
}

export interface TacticaGuardada {
  local: Jugador[];
  visitante: Jugador[];
  colorLocal: string;
  colorVisitante: string;
  elements: FieldElement[];
  arrows: ArrowItem[];
  tacticName?: string;
  nombreLocal?: string;
  nombreVisitante?: string;
  golesLocal?: number;
  golesVisitante?: number;
  mostrarMarcador?: boolean;
  marcadorX?: number;
  marcadorY?: number;
  /** Recorded key frames for the play animation (optional) */
  frames?: Frame[];
}

export function uid(): string {
  return crypto.randomUUID();
}

/* ── Validation helpers (defense-in-depth for import / localStorage) ── */

export function isValidJugador(j: unknown): j is Jugador {
  if (typeof j !== 'object' || j === null) return false;
  const o = j as Record<string, unknown>;
  return (
    typeof o.numero === 'number' && Number.isFinite(o.numero) &&
    typeof o.nombre === 'string' && o.nombre.length <= 50 &&
    typeof o.x === 'number' && Number.isFinite(o.x) && o.x >= 0 && o.x <= 100 &&
    typeof o.y === 'number' && Number.isFinite(o.y) && o.y >= 0 && o.y <= 100 &&
    (o.enCancha === undefined || typeof o.enCancha === 'boolean')
  );
}

export function isValidFieldElement(el: unknown): el is FieldElement {
  if (typeof el !== 'object' || el === null) return false;
  const o = el as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    (o.type === 'ball' || o.type === 'cone' || o.type === 'text' || o.type === 'goal' || o.type === 'dummy' || o.type === 'zone') &&
    typeof o.x === 'number' && Number.isFinite(o.x) && o.x >= 0 && o.x <= 100 &&
    typeof o.y === 'number' && Number.isFinite(o.y) && o.y >= 0 && o.y <= 100 &&
    (o.text === undefined || (typeof o.text === 'string' && o.text.length <= 200)) &&
    (o.scale === undefined || (typeof o.scale === 'number' && o.scale >= 0.5 && o.scale <= 3)) &&
    (o.rotation === undefined || (typeof o.rotation === 'number' && Number.isFinite(o.rotation))) &&
    (o.shape === undefined || o.shape === 'circle' || o.shape === 'rect')
  );
}

export function isValidArrowItem(arr: unknown): arr is ArrowItem {
  if (typeof arr !== 'object' || arr === null) return false;
  const o = arr as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.x1 === 'number' && Number.isFinite(o.x1) && o.x1 >= 0 && o.x1 <= 100 &&
    typeof o.y1 === 'number' && Number.isFinite(o.y1) && o.y1 >= 0 && o.y1 <= 100 &&
    typeof o.x2 === 'number' && Number.isFinite(o.x2) && o.x2 >= 0 && o.x2 <= 100 &&
    typeof o.y2 === 'number' && Number.isFinite(o.y2) && o.y2 >= 0 && o.y2 <= 100 &&
    (o.scale === undefined || (typeof o.scale === 'number' && o.scale >= 0.5 && o.scale <= 3)) &&
    (o.style === undefined || o.style === 'solid' || o.style === 'dashed' || o.style === 'curved') &&
    (o.cx === undefined || (typeof o.cx === 'number' && Number.isFinite(o.cx) && o.cx >= 0 && o.cx <= 100)) &&
    (o.cy === undefined || (typeof o.cy === 'number' && Number.isFinite(o.cy) && o.cy >= 0 && o.cy <= 100))
  );
}

function isFramePlayer(o: unknown): o is FramePlayer {
  if (typeof o !== 'object' || o === null) return false;
  const p = o as Record<string, unknown>;
  return (
    typeof p.numero === 'number' && Number.isFinite(p.numero) &&
    typeof p.x === 'number' && Number.isFinite(p.x) && p.x >= 0 && p.x <= 100 &&
    typeof p.y === 'number' && Number.isFinite(p.y) && p.y >= 0 && p.y <= 100
  );
}

function isFrameBall(o: unknown): o is FrameBall {
  if (typeof o !== 'object' || o === null) return false;
  const b = o as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.x === 'number' && Number.isFinite(b.x) && b.x >= 0 && b.x <= 100 &&
    typeof b.y === 'number' && Number.isFinite(b.y) && b.y >= 0 && b.y <= 100
  );
}

export function isValidFrame(f: unknown): f is Frame {
  if (typeof f !== 'object' || f === null) return false;
  const o = f as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    Array.isArray(o.local) && o.local.every(isFramePlayer) &&
    Array.isArray(o.visitante) && o.visitante.every(isFramePlayer) &&
    Array.isArray(o.balls) && o.balls.every(isFrameBall)
  );
}

export function isValidTacticaGuardada(data: unknown): data is TacticaGuardada {
  if (typeof data !== 'object' || data === null) return false;
  const o = data as Record<string, unknown>;
  return (
    Array.isArray(o.local) && o.local.every(isValidJugador) &&
    Array.isArray(o.visitante) && o.visitante.every(isValidJugador) &&
    typeof o.colorLocal === 'string' && o.colorLocal.length <= 20 &&
    typeof o.colorVisitante === 'string' && o.colorVisitante.length <= 20 &&
    Array.isArray(o.elements) && o.elements.every(isValidFieldElement) &&
    Array.isArray(o.arrows) && o.arrows.every(isValidArrowItem) &&
    (o.tacticName === undefined || (typeof o.tacticName === 'string' && o.tacticName.length <= 100)) &&
    (o.nombreLocal === undefined || (typeof o.nombreLocal === 'string' && o.nombreLocal.length <= 50)) &&
    (o.nombreVisitante === undefined || (typeof o.nombreVisitante === 'string' && o.nombreVisitante.length <= 50)) &&
    (o.golesLocal === undefined || typeof o.golesLocal === 'number') &&
    (o.golesVisitante === undefined || typeof o.golesVisitante === 'number') &&
    (o.mostrarMarcador === undefined || typeof o.mostrarMarcador === 'boolean') &&
    (o.marcadorX === undefined || typeof o.marcadorX === 'number') &&
    (o.marcadorY === undefined || typeof o.marcadorY === 'number') &&
    (o.frames === undefined || (Array.isArray(o.frames) && o.frames.every(isValidFrame)))
  );
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
      };
    };
  }
}

