import type { Jugador } from '../types';

/* ── Default squads (used as the source of names/numbers) ─────────────── */

export const plantillaLocal: Omit<Jugador, 'x' | 'y'>[] = [
  { numero: 1,  nombre: 'GK' },
  { numero: 4,  nombre: 'Ramos' },
  { numero: 3,  nombre: 'Piqué' },
  { numero: 15, nombre: 'Valverde' },
  { numero: 2,  nombre: 'Carvajal' },
  { numero: 8,  nombre: 'Kroos' },
  { numero: 11, nombre: 'Modric' },
  { numero: 22, nombre: 'Isco' },
  { numero: 7,  nombre: 'Mbappé' },
  { numero: 9,  nombre: 'Benzema' },
  { numero: 10, nombre: 'Vini Jr' },
];

export const plantillaVisitante: Omit<Jugador, 'x' | 'y'>[] = [
  { numero: 1,  nombre: 'GK' },
  { numero: 5,  nombre: 'Stones' },
  { numero: 6,  nombre: 'Dias' },
  { numero: 3,  nombre: 'Aké' },
  { numero: 2,  nombre: 'Walker' },
  { numero: 16, nombre: 'Rodrigo' },
  { numero: 17, nombre: 'De Bruyne' },
  { numero: 20, nombre: 'B. Silva' },
  { numero: 47, nombre: 'Foden' },
  { numero: 9,  nombre: 'Haaland' },
  { numero: 11, nombre: 'Grealish' },
];

/* ── Smart formation layout ───────────────────────────────────────────────
 *
 * Positions are computed from a logical grid instead of hard-coded presets:
 *   • Row shapes follow real football conventions (2-3-1, 4-3-3, …).
 *   • Players inside a row are spaced uniformly with the formula
 *     y = (i + 1) / (k + 1) · 100, which guarantees symmetry and keeps a
 *     safe margin from the touchlines for any row size.
 *   • Rows are spread across the team's half with a fixed margin so tokens
 *     never overlap the goal line nor the halfway line.
 *   • The away side is a mirror of the home side (x → 100 − x).
 *
 * The algorithm handles ANY squad size (1–15+) robustly: known sizes use a
 * curated shape, larger squads fall back to balanced rows of at most 5.
 */

/** Outfield row shapes (defense → attack) keyed by outfield player count. */
const ROW_SHAPES: Record<number, number[]> = {
  1: [1],
  2: [2],
  3: [2, 1],
  4: [2, 2],
  5: [2, 2, 1],
  6: [2, 3, 1],       // Fútbol 7 clásico
  7: [3, 3, 1],
  8: [3, 3, 2],       // Fútbol 9
  9: [3, 4, 2],
  10: [4, 3, 3],      // Fútbol 11
  11: [4, 4, 3],
  12: [4, 4, 4],
  13: [5, 4, 4],
  14: [5, 5, 4],
};

function rowsFor(outfield: number): number[] {
  if (outfield <= 0) return [];
  const known = ROW_SHAPES[outfield];
  if (known) return known;
  // Fallback: balanced rows of at most 5 players
  const rowCount = Math.ceil(outfield / 5);
  const base = Math.floor(outfield / rowCount);
  let extra = outfield % rowCount;
  return Array.from({ length: rowCount }, () => base + (extra-- > 0 ? 1 : 0));
}

/** Horizontal band each team occupies (landscape coordinates). */
const GK_X = 6;
const DEFENSE_X = 18;
const ATTACK_X = 46;

/**
 * Compute tidy positions for a squad of `count` players (GK included).
 * Returns landscape percentage coordinates; away teams are mirrored.
 */
export function buildFormationLayout(
  count: number,
  side: 'local' | 'visitante',
): { x: number; y: number }[] {
  if (count <= 0) return [];

  const positions: { x: number; y: number }[] = [{ x: GK_X, y: 50 }];
  const rows = rowsFor(count - 1);

  rows.forEach((rowSize, rowIndex) => {
    const x =
      rows.length === 1
        ? (DEFENSE_X + ATTACK_X) / 2
        : DEFENSE_X + ((ATTACK_X - DEFENSE_X) * rowIndex) / (rows.length - 1);
    for (let i = 0; i < rowSize; i++) {
      // Uniform vertical spacing with automatic margins
      const y = ((i + 1) / (rowSize + 1)) * 100;
      positions.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    }
  });

  const mirrored =
    side === 'visitante'
      ? positions.map((p) => ({ x: Math.round((100 - p.x) * 100) / 100, y: p.y }))
      : positions;

  return mirrored.slice(0, count);
}

/** A player counts as on the pitch unless explicitly benched. */
export const isOnField = (j: Jugador): boolean => j.enCancha !== false;

/**
 * Change how many players a team fields to `targetCount` (7/9/11), keeping the
 * bench intact. Shrinking sends the excess on-field players to the bench;
 * growing promotes benched players first, then pulls from the default squad.
 * The resulting on-field players are laid out on the grid.
 */
export function changeFormation(
  currentPlayers: Jugador[],
  targetCount: number,
  side: 'local' | 'visitante',
): Jugador[] {
  const plantilla = side === 'local' ? plantillaLocal : plantillaVisitante;
  const onField = currentPlayers.filter(isOnField);
  const bench = currentPlayers.filter((j) => !isOnField(j));

  let newOnField: Jugador[];
  if (onField.length >= targetCount) {
    newOnField = onField.slice(0, targetCount);
    // Demote the excess to the bench (most recently added first out)
    bench.push(...onField.slice(targetCount).map((j) => ({ ...j, enCancha: false })));
  } else {
    newOnField = [...onField];
    // Promote benched players before inventing new ones
    while (newOnField.length < targetCount && bench.length > 0) {
      const promoted = bench.shift()!;
      newOnField.push({ ...promoted, enCancha: true });
    }
    const usedNumbers = new Set([...newOnField, ...bench].map((j) => j.numero));
    while (newOnField.length < targetCount) {
      const candidate = plantilla[newOnField.length];
      let numero: number;
      let nombre: string;
      if (candidate && !usedNumbers.has(candidate.numero)) {
        numero = candidate.numero;
        nombre = candidate.nombre;
      } else {
        numero = getNextUnusedNumber([...newOnField, ...bench]);
        nombre = `Jugador ${numero}`;
      }
      usedNumbers.add(numero);
      newOnField.push({ numero, nombre, x: 0, y: 0, enCancha: true });
    }
  }

  const layout = buildFormationLayout(newOnField.length, side);
  const laid = newOnField.map((j, i) => ({ ...j, x: layout[i].x, y: layout[i].y, enCancha: true }));
  return [...laid, ...bench];
}

/**
 * Re-distribute only the ON-FIELD players onto the logical grid (auto-arrange).
 * Benched players keep their identity and position untouched.
 */
export function autoArrangeTeam(players: Jugador[], side: 'local' | 'visitante'): Jugador[] {
  const onFieldCount = players.filter(isOnField).length;
  const layout = buildFormationLayout(onFieldCount, side);
  let i = 0;
  return players.map((j) => {
    if (!isOnField(j)) return j;
    const pos = layout[i++];
    return { ...j, x: pos.x, y: pos.y };
  });
}

/** Default full squads with computed positions (used on first load). */
export function defaultTeam(side: 'local' | 'visitante'): Jugador[] {
  const plantilla = side === 'local' ? plantillaLocal : plantillaVisitante;
  const layout = buildFormationLayout(plantilla.length, side);
  return plantilla.map((p, i) => ({ ...p, x: layout[i].x, y: layout[i].y }));
}

/* ── Player helpers ───────────────────────────────────────────────────── */

export function getNextUnusedNumber(players: Jugador[]): number {
  const numbers = new Set(players.map((p) => p.numero));
  let num = 1;
  while (numbers.has(num)) num++;
  return num;
}

/**
 * Find a free spot for a NEW player near the team's default zone, avoiding
 * overlap with teammates already on the board.
 */
export function findFreeSpot(players: Jugador[], side: 'local' | 'visitante'): { x: number; y: number } {
  const baseX = side === 'local' ? 30 : 70;
  const MIN_DIST = 9; // percent — roughly one token of separation

  // Scan a small grid around the base zone, closest candidates first
  const candidates: { x: number; y: number; cost: number }[] = [];
  for (let dx = -12; dx <= 12; dx += 6) {
    for (let y = 14; y <= 86; y += 9) {
      const x = Math.min(94, Math.max(6, baseX + dx));
      candidates.push({ x, y, cost: Math.abs(dx) + Math.abs(y - 50) / 10 });
    }
  }
  candidates.sort((a, b) => a.cost - b.cost);

  for (const c of candidates) {
    const collides = players.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < MIN_DIST);
    if (!collides) return { x: c.x, y: c.y };
  }
  // Board is crowded — fall back to the base zone
  return { x: baseX, y: 50 };
}
