import { describe, it, expect } from 'vitest';
import { changeFormation, autoArrangeTeam, isOnField } from './formations';
import type { Jugador } from '../types';

function squad(n: number): Jugador[] {
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    nombre: `P${i + 1}`,
    x: 10,
    y: 10,
  }));
}

describe('isOnField', () => {
  it('treats absent enCancha as on the field', () => {
    expect(isOnField({ numero: 1, nombre: 'a', x: 0, y: 0 })).toBe(true);
    expect(isOnField({ numero: 1, nombre: 'a', x: 0, y: 0, enCancha: false })).toBe(false);
  });
});

describe('changeFormation with a bench', () => {
  it('benches the excess when shrinking from 11 to 7', () => {
    const result = changeFormation(squad(11), 7, 'local');
    expect(result.filter(isOnField)).toHaveLength(7);
    expect(result.filter((j) => !isOnField(j))).toHaveLength(4);
    expect(result).toHaveLength(11); // no player is lost
  });

  it('promotes benched players before inventing new ones', () => {
    // 7 on field, 2 benched → grow to 9 should pull the 2 from the bench
    const base = changeFormation(squad(9), 7, 'local'); // 7 field + 2 bench
    const grown = changeFormation(base, 9, 'local');
    expect(grown.filter(isOnField)).toHaveLength(9);
    expect(grown.filter((j) => !isOnField(j))).toHaveLength(0);
    expect(grown).toHaveLength(9); // same 9 players, none created
  });
});

describe('autoArrangeTeam', () => {
  it('repositions only on-field players and leaves the bench alone', () => {
    const players: Jugador[] = [
      { numero: 1, nombre: 'a', x: 5, y: 5 },
      { numero: 2, nombre: 'b', x: 5, y: 5, enCancha: false },
    ];
    const out = autoArrangeTeam(players, 'local');
    const bench = out.find((j) => j.numero === 2)!;
    expect(bench.x).toBe(5);
    expect(bench.y).toBe(5);
  });
});
