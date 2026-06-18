import { type AxialCoord, axialDistance, getHexKey } from './hex';
import { generateMaze, type MazeData } from './maze';
import { MonsterNestCellEntity } from './entities/cells';
import { MonsterEntity } from './entities/MonsterEntity';
import { PlayerEntity } from './entities/PlayerEntity';

export const GAME_MAP_RADIUS = 10;

export type GameStatus = 'exploring' | 'victory';

export interface GameStats {
  totalCells: number;
  revealedCells: number;
}

export interface CombatEvent {
  type: 'playerAttack' | 'monsterAttack' | 'monsterSpawn';
  from: AxialCoord;
  to: AxialCoord;
  atMs: number;
}

export interface GameState {
  maze: MazeData;
  player: PlayerEntity;
  monsterNests: Map<string, MonsterNestCellEntity>;
  monsters: MonsterEntity[];
  nextMonsterId: number;
  combatEvents: CombatEvent[];
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
  const monsterNests = new Map<string, MonsterNestCellEntity>();

  for (const cell of maze.cells.values()) {
    if (cell.type !== 'monsterNest') {
      continue;
    }

    const nest = new MonsterNestCellEntity({
      id: `nest-${cell.key}`,
      coord: cell.coord,
      key: cell.key,
      revealed: cell.revealed,
    });
    monsterNests.set(nest.id, nest);
  }

  return {
    maze,
    player: new PlayerEntity({
      id: 'player',
      coord: { q: 0, r: 0 },
    }),
    monsterNests,
    monsters: [],
    nextMonsterId: 1,
    combatEvents: [],
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

  const nest = [...state.monsterNests.values()].find((candidate) => candidate.key === key);

  if (nest) {
    nest.revealed = true;
  }

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

  if (!target || !target.revealed || (target.type !== 'empty' && target.type !== 'exit')) {
    return state;
  }

  state.player.coord = { ...coord };

  return {
    ...state,
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
