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

describe('generateMaze', () => {
  it('creates a radius 6 maze with 127 cells and 7 revealed safe cells', () => {
    const maze = generateMaze({ radius: 6, seed: 1 });
    const revealedCells = [...maze.cells.values()].filter((cell) => cell.revealed);

    expect(maze.radius).toBe(6);
    expect(maze.cells.size).toBe(127);
    expect(revealedCells).toHaveLength(7);
    expect(maze.totalCells).toBe(127);
    expect(maze.revealedCount).toBe(7);
  });

  it('keeps center and neighbor ring revealed and empty', () => {
    const maze = generateMaze({ radius: 6, seed: 2 });
    const safeCells = [...maze.cells.values()].filter(
      (cell) => axialDistance(cell.coord, { q: 0, r: 0 }) <= 1,
    );

    expect(safeCells).toHaveLength(7);
    expect(safeCells.every((cell) => cell.revealed && cell.type === 'empty')).toBe(true);
  });

  it('places the exit on the outer ring and keeps it initially covered', () => {
    const maze = generateMaze({ radius: 6, seed: 3 });
    const exit = maze.cells.get(maze.exitKey);

    expect(exit).toBeDefined();
    expect(exit?.type).toBe('exit');
    expect(exit?.revealed).toBe(false);
    expect(exit ? axialDistance(exit.coord, { q: 0, r: 0 }) : 0).toBe(6);
  });

  it('always leaves a walkable path from start to exit across seeded maps', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const maze = generateMaze({ radius: 6, seed });

      expect(hasPathToExit(maze.cells, maze.startKey, maze.exitKey)).toBe(true);
    }
  });
});
