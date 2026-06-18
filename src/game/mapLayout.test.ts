import { describe, expect, it } from 'vitest';
import { getHexKey } from './hex';
import { calculateMapLayout, MAP_HEX_SIZE } from './mapLayout';

describe('calculateMapLayout', () => {
  const cells = [
    { key: getHexKey({ q: 0, r: 0 }), coord: { q: 0, r: 0 } },
    { key: getHexKey({ q: 1, r: 0 }), coord: { q: 1, r: 0 } },
    { key: getHexKey({ q: 2, r: 0 }), coord: { q: 2, r: 0 } },
  ];

  it('uses the fixed enlarged hex size', () => {
    const layout = calculateMapLayout({
      cells,
      playerCoord: { q: 0, r: 0 },
      viewport: { width: 1440, height: 713 },
    });

    expect(MAP_HEX_SIZE).toBe(56);
    expect(layout.hexSize).toBe(56);
  });

  it('centers the current player cell in the viewport', () => {
    const layout = calculateMapLayout({
      cells,
      playerCoord: { q: 1, r: 0 },
      viewport: { width: 1440, height: 713 },
    });
    const playerCenter = layout.cellCenters.get(getHexKey({ q: 1, r: 0 }));

    expect(playerCenter).toEqual({
      x: 720,
      y: 356.5,
    });
  });

  it('positions neighboring cells relative to the centered player', () => {
    const layout = calculateMapLayout({
      cells,
      playerCoord: { q: 1, r: 0 },
      viewport: { width: 1440, height: 713 },
    });
    const rightNeighbor = layout.cellCenters.get(getHexKey({ q: 2, r: 0 }));

    expect(rightNeighbor?.x).toBeCloseTo(804, 3);
    expect(rightNeighbor?.y).toBeCloseTo(405.0, 1);
  });
});
