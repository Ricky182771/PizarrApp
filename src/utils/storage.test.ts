import { describe, it, expect } from 'vitest';
import { safeFileName, parseTacticFile, LS_SLOT_KEYS, SLOT_COUNT } from './storage';
import type { TacticaGuardada } from '../types';

const validTactic: TacticaGuardada = {
  local: [],
  visitante: [],
  colorLocal: '#000',
  colorVisitante: '#fff',
  elements: [],
  arrows: [],
  tacticName: 'Mi Táctica',
};

describe('safeFileName', () => {
  it('slugifies the tactic name', () => {
    expect(safeFileName('Presion Alta 433')).toBe('presion-alta-433');
  });
  it('falls back for empty names', () => {
    expect(safeFileName('')).toBe('pizarra-tactica');
    expect(safeFileName(undefined)).toBe('pizarra-tactica');
  });
});

describe('parseTacticFile', () => {
  it('parses and validates a good tactic', () => {
    expect(parseTacticFile(JSON.stringify(validTactic))).not.toBeNull();
  });
  it('rejects malformed JSON and invalid shapes', () => {
    expect(parseTacticFile('{ not json')).toBeNull();
    expect(parseTacticFile(JSON.stringify({ local: 'nope' }))).toBeNull();
  });
});

describe('slot migration safety', () => {
  it('keeps the original 3 slot keys first so old saves survive', () => {
    expect(LS_SLOT_KEYS[0]).toBe('pizarra-tactica-slot-1');
    expect(LS_SLOT_KEYS[1]).toBe('pizarra-tactica-slot-2');
    expect(LS_SLOT_KEYS[2]).toBe('pizarra-tactica-slot-3');
    expect(SLOT_COUNT).toBeGreaterThanOrEqual(3);
  });
});
