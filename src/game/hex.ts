export interface AxialCoord {
  q: number;
  r: number;
}

export const HEX_DIRECTIONS: readonly AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getHexKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

export function axialDistance(a: AxialCoord, b: AxialCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;

  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

export function getNeighbors(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map((direction) => ({
    q: coord.q + direction.q,
    r: coord.r + direction.r,
  }));
}

export function createHexGrid(radius: number): AxialCoord[] {
  const cells: AxialCoord[] = [];

  for (let q = -radius; q <= radius; q += 1) {
    const minR = Math.max(-radius, -q - radius);
    const maxR = Math.min(radius, -q + radius);

    for (let r = minR; r <= maxR; r += 1) {
      cells.push({ q, r });
    }
  }

  return cells;
}

export function axialToPixel(coord: AxialCoord, size: number): { x: number; y: number } {
  return {
    x: size * 1.5 * coord.q,
    y: size * Math.sqrt(3) * (coord.r + coord.q / 2),
  };
}
