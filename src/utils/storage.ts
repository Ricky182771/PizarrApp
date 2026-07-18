import { isValidTacticaGuardada, type TacticaGuardada } from '../types';

/* ── LocalStorage persistence (autosave + 3 named slots) ──────────────── */

export const LS_KEY = 'pizarra-tactica';

export const LS_SLOT_KEYS = [
  'pizarra-tactica-slot-1',
  'pizarra-tactica-slot-2',
  'pizarra-tactica-slot-3',
] as const;

function safeParse(raw: string | null): TacticaGuardada | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    return isValidTacticaGuardada(data) ? data : null;
  } catch {
    return null;
  }
}

export function loadFromLS(): TacticaGuardada | null {
  try {
    return safeParse(localStorage.getItem(LS_KEY));
  } catch {
    return null;
  }
}

export function saveToLS(data: TacticaGuardada): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* storage full / unavailable — autosave silently skips */
  }
}

export function loadSlot(slotIndex: number): TacticaGuardada | null {
  try {
    const key = LS_SLOT_KEYS[slotIndex];
    if (!key) return null;
    return safeParse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function saveSlot(slotIndex: number, data: TacticaGuardada): boolean {
  const key = LS_SLOT_KEYS[slotIndex];
  if (!key) return false;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function deleteSlot(slotIndex: number): void {
  const key = LS_SLOT_KEYS[slotIndex];
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getSlotName(slotIndex: number): string {
  const data = loadSlot(slotIndex);
  if (!data) return '';
  return data.tacticName || `Táctica ${slotIndex + 1}`;
}

export function deepClone<T>(arr: T[]): T[] {
  return arr.map((item) => ({ ...item }));
}
