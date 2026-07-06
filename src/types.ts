/* ── Shared types for field annotations ────────────────────────────────── */

export type ElementType = 'ball' | 'cone' | 'text';

export interface FieldElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  text?: string;
  scale?: number;
}

export interface ArrowItem {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  scale?: number;
}

export interface Jugador {
  numero: number;
  nombre: string;
  x: number;
  y: number;
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
    typeof o.y === 'number' && Number.isFinite(o.y) && o.y >= 0 && o.y <= 100
  );
}

export function isValidFieldElement(el: unknown): el is FieldElement {
  if (typeof el !== 'object' || el === null) return false;
  const o = el as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    (o.type === 'ball' || o.type === 'cone' || o.type === 'text') &&
    typeof o.x === 'number' && Number.isFinite(o.x) && o.x >= 0 && o.x <= 100 &&
    typeof o.y === 'number' && Number.isFinite(o.y) && o.y >= 0 && o.y <= 100 &&
    (o.text === undefined || (typeof o.text === 'string' && o.text.length <= 200)) &&
    (o.scale === undefined || (typeof o.scale === 'number' && o.scale >= 0.5 && o.scale <= 3))
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
    (o.scale === undefined || (typeof o.scale === 'number' && o.scale >= 0.5 && o.scale <= 3))
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
    (o.marcadorY === undefined || typeof o.marcadorY === 'number')
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

