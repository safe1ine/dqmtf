import { type AxialCoord, axialDistance, getHexKey } from './hex';
import { generateMaze, type MazeData } from './maze';

export const GAME_MAP_RADIUS = 10;

export type GameStatus = 'exploring' | 'victory';

export interface PlayerState {
  coord: AxialCoord;
  hp: number;
  attack: number;
}

export interface GameStats {
  totalCells: number;
  revealedCells: number;
}

export interface GameState {
  maze: MazeData;
  player: PlayerState;
  stats: GameStats;
  status: GameStatus;
}

export interface GameSummary {
  totalCells: number;
  revealedCells: number;
  hp: number;
  attack: number;
  status: GameStatus;
}

function cloneMaze(maze: MazeData): MazeData {
  return {
    ...maze,
    cells: new Map([...maze.cells.entries()].map(([key, cell]) => [key, { ...cell }])),
  };
}

function countRevealed(maze: MazeData): number {
  return [...maze.cells.values()].filter((cell) => cell.revealed).length;
}

export function createGameState(seed?: number): GameState {
  const maze = generateMaze({ radius: GAME_MAP_RADIUS, seed });

  return {
    maze,
    player: {
      coord: { q: 0, r: 0 },
      hp: 100,
      attack: 10,
    },
    stats: {
      totalCells: maze.totalCells,
      revealedCells: maze.revealedCount,
    },
    status: 'exploring',
  };
}

export function revealCell(state: GameState, key: string): GameState {
  const maze = cloneMaze(state.maze);
  const cell = maze.cells.get(key);

  if (!cell || cell.revealed || axialDistance(state.player.coord, cell.coord) !== 1) {
    return state;
  }

  cell.revealed = true;
  maze.revealedCount = countRevealed(maze);

  return {
    ...state,
    maze,
    stats: {
      ...state.stats,
      revealedCells: maze.revealedCount,
    },
  };
}

export function movePlayer(state: GameState, coord: AxialCoord): GameState {
  if (state.status === 'victory' || axialDistance(state.player.coord, coord) !== 1) {
    return state;
  }

  const target = state.maze.cells.get(getHexKey(coord));

  if (!target || !target.revealed || target.type === 'wall') {
    return state;
  }

  return {
    ...state,
    player: {
      ...state.player,
      coord,
    },
    status: target.type === 'exit' ? 'victory' : state.status,
  };
}

export function getGameSummary(state: GameState): GameSummary {
  return {
    totalCells: state.stats.totalCells,
    revealedCells: state.stats.revealedCells,
    hp: state.player.hp,
    attack: state.player.attack,
    status: state.status,
  };
}
