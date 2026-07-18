import { describe, it, expect } from 'vitest';
import { captureFrame, interpolateFrames } from './animation';
import type { Jugador, FieldElement } from '../types';

const local: Jugador[] = [{ numero: 1, nombre: 'A', x: 0, y: 0 }];
const visitante: Jugador[] = [{ numero: 1, nombre: 'B', x: 100, y: 100 }];
const elements: FieldElement[] = [{ id: 'ball1', type: 'ball', x: 50, y: 50 }];

describe('captureFrame', () => {
  it('snapshots player and ball positions only', () => {
    const els: FieldElement[] = [...elements, { id: 'c1', type: 'cone', x: 10, y: 10 }];
    const f = captureFrame(local, visitante, els);
    expect(f.local).toEqual([{ numero: 1, x: 0, y: 0 }]);
    expect(f.balls).toEqual([{ id: 'ball1', x: 50, y: 50 }]);
  });
});

describe('interpolateFrames', () => {
  const f0 = captureFrame(local, visitante, elements);
  const movedLocal: Jugador[] = [{ numero: 1, nombre: 'A', x: 10, y: 20 }];
  const movedBall: FieldElement[] = [{ id: 'ball1', type: 'ball', x: 70, y: 30 }];
  const f1 = captureFrame(movedLocal, visitante, movedBall);
  const frames = [f0, f1];
  const liveState = { local, visitante, elements };

  it('returns the live board when there are no frames', () => {
    expect(interpolateFrames([], 0, liveState)).toBe(liveState);
  });

  it('lands exactly on frame positions at integer progress', () => {
    const at0 = interpolateFrames(frames, 0, liveState);
    expect(at0.local[0]).toMatchObject({ x: 0, y: 0 });
    const at1 = interpolateFrames(frames, 1, liveState);
    expect(at1.local[0]).toMatchObject({ x: 10, y: 20 });
    expect(at1.elements[0]).toMatchObject({ x: 70, y: 30 });
  });

  it('interpolates the midpoint at progress 0.5', () => {
    const mid = interpolateFrames(frames, 0.5, liveState);
    expect(mid.local[0]).toMatchObject({ x: 5, y: 10 });
    expect(mid.elements[0]).toMatchObject({ x: 60, y: 40 });
  });

  it('clamps progress beyond the last frame', () => {
    const past = interpolateFrames(frames, 5, liveState);
    expect(past.local[0]).toMatchObject({ x: 10, y: 20 });
  });
});
