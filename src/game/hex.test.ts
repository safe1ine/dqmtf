import { describe, expect, it } from 'vitest';
import {
  HEX_DIRECTIONS,
  axialDistance,
  axialToPixel,
  createHexGrid,
  getHexKey,
  getNeighbors,
} from './hex';

describe('hex grid helpers', () => {
  it('creates 127 cells for radius 6', () => {
    expect(createHexGrid(6)).toHaveLength(127);
  });

  it('creates 331 cells for radius 10', () => {
    expect(createHexGrid(10)).toHaveLength(331);
  });

  it('uses stable coordinate keys', () => {
    expect(getHexKey({ q: -2, r: 5 })).toBe('-2,5');
  });

  it('calculates axial distances from the center', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(axialDistance({ q: 0, r: 0 }, { q: 3, r: -2 })).toBe(3);
  });

  it('returns six neighboring coordinates', () => {
    expect(HEX_DIRECTIONS).toHaveLength(6);
    expect(getNeighbors({ q: 0, r: 0 })).toEqual([
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ]);
  });

  it('converts flat-top axial coordinates to pixel positions', () => {
    expect(axialToPixel({ q: 0, r: 0 }, 24)).toEqual({ x: 0, y: 0 });
    expect(axialToPixel({ q: 1, r: 0 }, 24)).toEqual({
      x: 36,
      y: 20.784609690826528,
    });
  });
});
