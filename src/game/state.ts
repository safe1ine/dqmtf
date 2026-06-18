import {
  type AxialCoord,
  type PixelPoint,
  axialDistance,
  axialToPixel,
  getHexKey,
  pixelToAxial,
} from './hex';
import { generateMaze, type MazeData } from './maze';
import { MAP_HEX_SIZE } from './mapLayout';
import { MonsterNestCellEntity } from './entities/cells';
import { MonsterEntity } from './entities/MonsterEntity';
import { PlayerEntity } from './entities/PlayerEntity';

export const GAME_MAP_RADIUS = 10;

const MAX_PLAYER_MOVEMENT_STEP_PIXELS = MAP_HEX_SIZE * 0.45;

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
      worldPosition: axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE),
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

  const moved = applyPlayerWorldPosition(state, axialToPixel(coord, MAP_HEX_SIZE));

  return moved ? { ...state } : state;
}

export function isPlayerWalkableCoord(state: GameState, coord: AxialCoord): boolean {
  const target = state.maze.cells.get(getHexKey(coord));

  if (!target || !target.revealed) {
    return false;
  }

  if (target.type === 'monsterNest') {
    const nest = [...state.monsterNests.values()].find((candidate) => candidate.key === target.key);

    return nest ? !nest.isAlive() : false;
  }

  return target.type === 'empty' || target.type === 'exit';
}

function applyPlayerWorldPosition(state: GameState, worldPosition: PixelPoint): boolean {
  if (state.status === 'victory') {
    return false;
  }

  const coord = pixelToAxial(worldPosition, MAP_HEX_SIZE);

  if (!isPlayerWalkableCoord(state, coord)) {
    return false;
  }

  state.player.worldPosition = { ...worldPosition };
  state.player.coord = coord;

  const target = state.maze.cells.get(getHexKey(coord));

  if (target?.type === 'exit') {
    state.status = 'victory';
  }

  return true;
}

function applyPlayerMovementStep(state: GameState, step: PixelPoint): void {
  const current = state.player.worldPosition;
  const fullCandidate = {
    x: current.x + step.x,
    y: current.y + step.y,
  };

  if (applyPlayerWorldPosition(state, fullCandidate)) {
    return;
  }

  const blockedCoord = pixelToAxial(fullCandidate, MAP_HEX_SIZE);
  const slideStep = getBlockedEdgeSlideStep(state, blockedCoord, step);

  if (!slideStep) {
    return;
  }

  applyPlayerWorldPosition(state, {
    x: current.x + slideStep.x,
    y: current.y + slideStep.y,
  });
}

function getBlockedEdgeSlideStep(
  state: GameState,
  blockedCoord: AxialCoord,
  step: PixelPoint,
): PixelPoint | null {
  if (axialDistance(state.player.coord, blockedCoord) !== 1) {
    return null;
  }

  const currentCenter = axialToPixel(state.player.coord, MAP_HEX_SIZE);
  const blockedCenter = axialToPixel(blockedCoord, MAP_HEX_SIZE);
  const normal = {
    x: blockedCenter.x - currentCenter.x,
    y: blockedCenter.y - currentCenter.y,
  };
  const tangent = {
    x: -normal.y,
    y: normal.x,
  };
  const tangentLengthSquared = tangent.x * tangent.x + tangent.y * tangent.y;

  if (tangentLengthSquared === 0) {
    return null;
  }

  const dot = step.x * tangent.x + step.y * tangent.y;
  const slideStep = {
    x: (dot / tangentLengthSquared) * tangent.x,
    y: (dot / tangentLengthSquared) * tangent.y,
  };

  if (Math.hypot(slideStep.x, slideStep.y) < 0.001) {
    return null;
  }

  return slideStep;
}

export function movePlayerByWorldDelta(state: GameState, delta: PixelPoint): GameState {
  if (state.status === 'victory') {
    return state;
  }

  const distance = Math.hypot(delta.x, delta.y);

  if (distance === 0) {
    return state;
  }

  const stepCount = Math.max(1, Math.ceil(distance / MAX_PLAYER_MOVEMENT_STEP_PIXELS));
  const step = {
    x: delta.x / stepCount,
    y: delta.y / stepCount,
  };

  for (let index = 0; index < stepCount; index += 1) {
    applyPlayerMovementStep(state, step);
  }

  return state;
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
