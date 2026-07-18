import { describe, it, expect } from 'vitest';
import { isValidArrowItem, isValidFieldElement } from './types';

describe('isValidArrowItem — style/curve fields', () => {
  const base = { id: 'a', x1: 10, y1: 10, x2: 20, y2: 20 };

  it('accepts an arrow with no style (legacy tactics)', () => {
    expect(isValidArrowItem(base)).toBe(true);
  });

  it('accepts valid styles and a control point', () => {
    expect(isValidArrowItem({ ...base, style: 'dashed' })).toBe(true);
    expect(isValidArrowItem({ ...base, style: 'curved', cx: 30, cy: 40 })).toBe(true);
  });

  it('rejects an unknown style or out-of-range control point', () => {
    expect(isValidArrowItem({ ...base, style: 'wobbly' })).toBe(false);
    expect(isValidArrowItem({ ...base, cx: 200 })).toBe(false);
  });
});

describe('isValidFieldElement — zone/shape fields', () => {
  it('accepts a zone element with a shape', () => {
    expect(isValidFieldElement({ id: 'z', type: 'zone', x: 50, y: 50, shape: 'rect' })).toBe(true);
    expect(isValidFieldElement({ id: 'z', type: 'zone', x: 50, y: 50 })).toBe(true);
  });

  it('rejects an unknown shape', () => {
    expect(isValidFieldElement({ id: 'z', type: 'zone', x: 50, y: 50, shape: 'triangle' })).toBe(false);
  });
});
