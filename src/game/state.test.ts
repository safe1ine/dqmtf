import { describe, expect, it } from 'vitest';
import { getHexKey, getNeighbors } from './hex';
import { createGameState, getGameSummary, movePlayer, revealCell } from './state';

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

  it('wins after moving onto a revealed exit cell', () => {
    const state = createGameState(11);
    const exit = state.maze.cells.get(state.maze.exitKey);
    const exitNeighbor = exit
      ? getNeighbors(exit.coord)
          .map((coord) => state.maze.cells.get(getHexKey(coord)))
          .find((cell) => cell && cell.type !== 'wall')
      : undefined;

    expect(exit).toBeDefined();
    expect(exitNeighbor).toBeDefined();

    const positioned = {
      ...state,
      player: {
        ...state.player,
        coord: exitNeighbor?.coord ?? state.player.coord,
      },
    };
    const revealed = revealCell(positioned, state.maze.exitKey);
    const result = movePlayer(revealed, exit?.coord ?? state.player.coord);

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
