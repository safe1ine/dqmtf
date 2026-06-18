import { describe, expect, it } from 'vitest';
import { axialDistance, getHexKey, getNeighbors } from './hex';
import { generateMaze, type MazeCell } from './maze';

function hasPathToExit(cells: Map<string, MazeCell>, startKey: string, exitKey: string): boolean {
  const queue = [startKey];
  const visited = new Set(queue);

  while (queue.length > 0) {
    const currentKey = queue.shift();

    if (!currentKey) {
      continue;
    }

    if (currentKey === exitKey) {
      return true;
    }

    const current = cells.get(currentKey);

    if (!current) {
      continue;
    }

    for (const neighbor of getNeighbors(current.coord)) {
      const neighborKey = getHexKey(neighbor);
      const neighborCell = cells.get(neighborKey);

      if (!neighborCell || visited.has(neighborKey) || neighborCell.type === 'wall') {
        continue;
      }

      visited.add(neighborKey);
      queue.push(neighborKey);
    }
  }

  return false;
}

function hasKeyboardPathToExit(
  cells: Map<string, MazeCell>,
  startKey: string,
  exitKey: string,
): boolean {
  const keyboardDirections = [
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 0, r: 1 },
  ];
  const queue = [startKey];
  const visited = new Set(queue);

  while (queue.length > 0) {
    const currentKey = queue.shift();

    if (!currentKey) {
      continue;
    }

    if (currentKey === exitKey) {
      return true;
    }

    const current = cells.get(currentKey);

    if (!current) {
      continue;
    }

    for (const direction of keyboardDirections) {
      const neighborKey = getHexKey({
        q: current.coord.q + direction.q,
        r: current.coord.r + direction.r,
      });
      const neighborCell = cells.get(neighborKey);

      if (!neighborCell || visited.has(neighborKey) || neighborCell.type === 'wall') {
        continue;
      }

      visited.add(neighborKey);
      queue.push(neighborKey);
    }
  }

  return false;
}

describe('generateMaze', () => {
  it('creates a radius 10 maze with 331 cells and 7 revealed safe cells', () => {
    const maze = generateMaze({ radius: 10, seed: 1 });
    const revealedCells = [...maze.cells.values()].filter((cell) => cell.revealed);

    expect(maze.radius).toBe(10);
    expect(maze.cells.size).toBe(331);
    expect(revealedCells).toHaveLength(7);
    expect(maze.totalCells).toBe(331);
    expect(maze.revealedCount).toBe(7);
  });

  it('keeps center and neighbor ring revealed and empty', () => {
    const maze = generateMaze({ radius: 10, seed: 2 });
    const safeCells = [...maze.cells.values()].filter(
      (cell) => axialDistance(cell.coord, { q: 0, r: 0 }) <= 1,
    );

    expect(safeCells).toHaveLength(7);
    expect(safeCells.every((cell) => cell.revealed && cell.type === 'empty')).toBe(true);
  });

  it('places the exit on the outer ring and keeps it initially covered', () => {
    const maze = generateMaze({ radius: 10, seed: 3 });
    const exit = maze.cells.get(maze.exitKey);

    expect(exit).toBeDefined();
    expect(exit?.type).toBe('exit');
    expect(exit?.revealed).toBe(false);
    expect(exit ? axialDistance(exit.coord, { q: 0, r: 0 }) : 0).toBe(10);
  });

  it('always leaves a walkable path from start to exit across seeded maps', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const maze = generateMaze({ radius: 10, seed });

      expect(hasPathToExit(maze.cells, maze.startKey, maze.exitKey)).toBe(true);
    }
  });

  it('always leaves a keyboard-traversable path from start to exit', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const maze = generateMaze({ radius: 10, seed });

      expect(hasKeyboardPathToExit(maze.cells, maze.startKey, maze.exitKey)).toBe(true);
    }
  });

  it('generates monster nests only on non-protected cells', () => {
    const maze = generateMaze({ radius: 10, seed: 4, wallRatio: 0, monsterNestChance: 1 });
    const monsterNests = [...maze.cells.values()].filter((cell) => cell.type === 'monsterNest');
    const exit = maze.cells.get(maze.exitKey);

    expect(monsterNests.length).toBeGreaterThan(0);
    expect(exit?.type).toBe('exit');

    for (const cell of maze.cells.values()) {
      if (axialDistance(cell.coord, { q: 0, r: 0 }) <= 1) {
        expect(cell.type).toBe('empty');
      }
    }

    if (!exit) {
      throw new Error('Expected generated maze to include an exit');
    }

    const protectedPath = [{ q: 0, r: 0 }];
    let current = { q: 0, r: 0 };

    while (current.q !== exit.coord.q) {
      current = {
        q: current.q + Math.sign(exit.coord.q - current.q),
        r: current.r,
      };
      protectedPath.push(current);
    }

    while (current.r !== exit.coord.r) {
      current = {
        q: current.q,
        r: current.r + Math.sign(exit.coord.r - current.r),
      };
      protectedPath.push(current);
    }

    for (const coord of protectedPath) {
      expect(maze.cells.get(getHexKey(coord))?.type).not.toBe('monsterNest');
    }
  });
});
