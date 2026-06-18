import { describe, expect, it } from 'vitest';
import { axialToPixel, getHexKey } from './hex';
import { MAP_HEX_SIZE } from './mapLayout';
import {
  createGameState,
  GAME_MAP_RADIUS,
  getGameSummary,
  isPlayerWalkableCoord,
  isPlayerWalkableWorldPosition,
  movePlayer,
  movePlayerByWorldDelta,
  revealCell,
} from './state';
import { MonsterNestCellEntity } from './entities/cells';

describe('game state', () => {
  it('starts at center with fixed stats and counters', () => {
    const state = createGameState(7);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
    expect(state.player.hp).toBe(100);
    expect(state.player.attack).toBe(10);
    expect(state.stats.totalCells).toBe(331);
    expect(state.stats.revealedCells).toBe(7);
    expect(state.status).toBe('exploring');
  });

  it('starts with player world position centered at the start hex', () => {
    const state = createGameState(7);

    expect(state.player.worldPosition).toEqual(axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE));
  });

  it('reveals a covered cell once', () => {
    const state = createGameState(8);
    const movedToSafeNeighbor = movePlayer(state, { q: 1, r: 0 });
    const covered = movedToSafeNeighbor.maze.cells.get(getHexKey({ q: 2, r: 0 }));

    expect(covered).toBeDefined();
    expect(covered?.revealed).toBe(false);

    const first = revealCell(movedToSafeNeighbor, covered?.key ?? '');
    const second = revealCell(first, covered?.key ?? '');

    expect(first.maze.cells.get(covered?.key ?? '')?.revealed).toBe(true);
    expect(first.stats.revealedCells).toBe(8);
    expect(second.stats.revealedCells).toBe(8);
  });

  it('does not reveal covered cells farther than one hex from the player', () => {
    const state = createGameState(8);
    const farCell = state.maze.cells.get(getHexKey({ q: 2, r: 0 }));

    expect(farCell).toBeDefined();
    expect(farCell?.revealed).toBe(false);

    const result = revealCell(state, farCell?.key ?? '');

    expect(result.maze.cells.get(farCell?.key ?? '')?.revealed).toBe(false);
    expect(result.stats.revealedCells).toBe(7);
  });

  it('does not move into covered cells', () => {
    const state = createGameState(9);
    const movedToSafeNeighbor = movePlayer(state, { q: 1, r: 0 });
    const result = movePlayer(movedToSafeNeighbor, { q: 2, r: 0 });

    expect(result.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('moves into revealed empty neighbor cells', () => {
    const state = createGameState(10);
    const result = movePlayer(state, { q: 1, r: 0 });

    expect(result.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('moves continuously through revealed empty space and updates containing hex', () => {
    const state = createGameState(10);
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);
    const result = movePlayerByWorldDelta(state, target);

    expect(result.player.coord).toEqual({ q: 1, r: 0 });
    expect(result.player.worldPosition.x).toBeCloseTo(target.x, 6);
    expect(result.player.worldPosition.y).toBeCloseTo(target.y, 6);
  });

  it('blocks continuous movement into covered cells', () => {
    const state = createGameState(9);
    movePlayer(state, { q: 1, r: 0 });
    const coveredTarget = axialToPixel({ q: 2, r: 0 }, MAP_HEX_SIZE);

    movePlayerByWorldDelta(state, {
      x: coveredTarget.x - state.player.worldPosition.x,
      y: coveredTarget.y - state.player.worldPosition.y,
    });

    expect(state.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('blocks movement into revealed walls', () => {
    const state = createGameState(13);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: 0 }));
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    movePlayerByWorldDelta(state, target);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('slides the player downward when pushing into an upper-right sloped wall', () => {
    const state = createGameState(13);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: -1 }));

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;
    state.player.coord = { q: 0, r: 0 };
    state.player.worldPosition = { x: 15, y: 0 };

    movePlayerByWorldDelta(state, { x: 10, y: 0 });

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
    expect(state.player.worldPosition.x).toBeGreaterThan(15);
    expect(state.player.worldPosition.y).toBeGreaterThan(0);
  });

  it('blocks movement when a lower-body sample point enters a wall', () => {
    const state = createGameState(17);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: -1 }));

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    const candidate = { x: 28, y: 0 };

    expect(isPlayerWalkableWorldPosition(state, candidate)).toBe(false);
    movePlayerByWorldDelta(state, candidate);
    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('allows upper-body visual overlap when lower-body samples remain walkable', () => {
    const state = createGameState(18);
    const upperWall = state.maze.cells.get(getHexKey({ q: 0, r: -1 }));

    expect(upperWall).toBeDefined();
    upperWall!.type = 'wall';
    upperWall!.revealed = true;

    state.player.coord = { q: 0, r: 1 };
    state.player.worldPosition = { x: 0, y: 55 };
    const candidate = { x: 10, y: 55 };

    expect(isPlayerWalkableWorldPosition(state, candidate)).toBe(true);
    movePlayerByWorldDelta(state, { x: 10, y: 0 });
    expect(state.player.worldPosition.x).toBeCloseTo(10, 6);
    expect(state.player.worldPosition.y).toBeCloseTo(55, 6);
  });

  it('blocks living monster nests and allows destroyed nests converted to empty cells', () => {
    const state = createGameState(14);
    const key = getHexKey({ q: 1, r: 0 });
    const cell = state.maze.cells.get(key);
    const nest = new MonsterNestCellEntity({
      id: `nest-${key}`,
      coord: { q: 1, r: 0 },
      key,
      revealed: true,
    });
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(cell).toBeDefined();
    cell!.type = 'monsterNest';
    cell!.revealed = true;
    state.monsterNests.set(nest.id, nest);

    expect(isPlayerWalkableCoord(state, { q: 1, r: 0 })).toBe(false);
    movePlayerByWorldDelta(state, target);
    expect(state.player.coord).toEqual({ q: 0, r: 0 });

    nest.takeDamage(nest.hp);
    state.maze.cells.set(key, nest.toMazeCell());

    expect(isPlayerWalkableCoord(state, { q: 1, r: 0 })).toBe(true);
    movePlayerByWorldDelta(state, {
      x: target.x - state.player.worldPosition.x,
      y: target.y - state.player.worldPosition.y,
    });
    expect(state.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('substeps large movement deltas so the player cannot tunnel through blocked cells', () => {
    const state = createGameState(15);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: 0 }));
    const farTarget = axialToPixel({ q: 2, r: 0 }, MAP_HEX_SIZE);

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    movePlayerByWorldDelta(state, farTarget);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('treats coordinates outside the maze as blocked', () => {
    const state = createGameState(15);

    expect(isPlayerWalkableCoord(state, { q: GAME_MAP_RADIUS + 1, r: 0 })).toBe(false);
  });

  it('wins after continuous movement enters a revealed exit cell', () => {
    const state = createGameState(16);
    const key = getHexKey({ q: 1, r: 0 });
    const exit = state.maze.cells.get(key);
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(exit).toBeDefined();
    exit!.type = 'exit';
    exit!.revealed = true;
    state.maze.exitKey = key;

    const result = movePlayerByWorldDelta(state, target);

    expect(result.status).toBe('victory');
    expect(result.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('wins after moving onto a revealed exit cell', () => {
    const state = createGameState(11);
    const exitKey = getHexKey({ q: 1, r: 0 });
    const exit = state.maze.cells.get(exitKey);
    const upperFootprintCell = state.maze.cells.get(getHexKey({ q: 1, r: -1 }));

    expect(exit).toBeDefined();
    expect(upperFootprintCell).toBeDefined();

    exit!.type = 'exit';
    exit!.revealed = true;
    upperFootprintCell!.type = 'empty';
    upperFootprintCell!.revealed = true;
    state.maze.exitKey = exitKey;

    const result = movePlayer(state, exit?.coord ?? state.player.coord);

    expect(result.status).toBe('victory');
    expect(result.player.coord).toEqual(exit?.coord);
  });

  it('summarizes state for the status bar', () => {
    const state = createGameState(12);

    expect(getGameSummary(state)).toEqual({
      totalCells: 331,
      revealedCells: 7,
      hp: 100,
      attack: 10,
      status: 'exploring',
    });
  });
});
