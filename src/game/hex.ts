export interface AxialCoord {
  q: number;
  r: number;
}

export interface PixelPoint {
  x: number;
  y: number;
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

export function axialToPixel(coord: AxialCoord, size: number): PixelPoint {
  return {
    x: size * 1.5 * coord.q,
    y: size * Math.sqrt(3) * (coord.r + coord.q / 2),
  };
}

export function roundAxialCoord(coord: AxialCoord): AxialCoord {
  let cubeX = Math.round(coord.q);
  let cubeZ = Math.round(coord.r);
  let cubeY = Math.round(-coord.q - coord.r);

  const xDiff = Math.abs(cubeX - coord.q);
  const yDiff = Math.abs(cubeY + coord.q + coord.r);
  const zDiff = Math.abs(cubeZ - coord.r);

  if (xDiff > yDiff && xDiff > zDiff) {
    cubeX = -cubeY - cubeZ;
  } else if (yDiff > zDiff) {
    cubeY = -cubeX - cubeZ;
  } else {
    cubeZ = -cubeX - cubeY;
  }

  return {
    q: Object.is(cubeX, -0) ? 0 : cubeX,
    r: Object.is(cubeZ, -0) ? 0 : cubeZ,
  };
}

export function pixelToAxial(point: PixelPoint, size: number): AxialCoord {
  return roundAxialCoord({
    q: ((2 / 3) * point.x) / size,
    r: ((-1 / 3) * point.x + (Math.sqrt(3) / 3) * point.y) / size,
  });
}
