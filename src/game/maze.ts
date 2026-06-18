import {
  type AxialCoord,
  axialDistance,
  createHexGrid,
  getHexKey,
} from './hex';

export type CellType = 'empty' | 'wall' | 'exit';

export interface MazeCell {
  coord: AxialCoord;
  key: string;
  type: CellType;
  revealed: boolean;
}

export interface MazeData {
  radius: number;
  cells: Map<string, MazeCell>;
  startKey: string;
  exitKey: string;
  totalCells: number;
  revealedCount: number;
}

export interface GenerateMazeOptions {
  radius?: number;
  wallRatio?: number;
  seed?: number;
}

function createRandom(seed = Date.now()): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;

    return state / 0x100000000;
  };
}

function pickRandom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function buildPathToExit(exit: AxialCoord): AxialCoord[] {
  const path: AxialCoord[] = [{ q: 0, r: 0 }];
  let current: AxialCoord = { q: 0, r: 0 };

  while (current.q !== exit.q) {
    current = {
      q: current.q + Math.sign(exit.q - current.q),
      r: current.r,
    };
    path.push(current);
  }

  while (current.r !== exit.r) {
    current = {
      q: current.q,
      r: current.r + Math.sign(exit.r - current.r),
    };
    path.push(current);
  }

  return path;
}

export function generateMaze(options: GenerateMazeOptions = {}): MazeData {
  const radius = options.radius ?? 6;
  const wallRatio = options.wallRatio ?? 0.35;
  const random = createRandom(options.seed);
  const origin: AxialCoord = { q: 0, r: 0 };
  const coords = createHexGrid(radius);
  const startKey = getHexKey(origin);
  const outerRing = coords.filter((coord) => axialDistance(coord, origin) === radius);
  const exitCoord = pickRandom(outerRing, random);
  const exitKey = getHexKey(exitCoord);
  const protectedKeys = new Set<string>();

  for (const coord of coords) {
    if (axialDistance(coord, origin) <= 1) {
      protectedKeys.add(getHexKey(coord));
    }
  }

  for (const coord of buildPathToExit(exitCoord)) {
    protectedKeys.add(getHexKey(coord));
  }

  protectedKeys.add(exitKey);

  const cells = new Map<string, MazeCell>();

  for (const coord of coords) {
    const key = getHexKey(coord);
    const safeStart = axialDistance(coord, origin) <= 1;
    const isExit = key === exitKey;
    const type: CellType = isExit
      ? 'exit'
      : protectedKeys.has(key) || random() > wallRatio
        ? 'empty'
        : 'wall';

    cells.set(key, {
      coord,
      key,
      type,
      revealed: safeStart,
    });
  }

  return {
    radius,
    cells,
    startKey,
    exitKey,
    totalCells: cells.size,
    revealedCount: [...cells.values()].filter((cell) => cell.revealed).length,
  };
}
