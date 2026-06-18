import { axialDistance, getHexKey, getNeighbors } from './hex';
import { MonsterEntity } from './entities/MonsterEntity';
import { ENTITY_DEFAULTS } from './entities/defaults';
import type { GameState } from './state';

export interface CombatTick {
  elapsedMs: number;
  nowMs: number;
}

export function tickCombat(state: GameState, tick: CombatTick): GameState {
  state.combatEvents = [];

  spawnMonsters(state, tick);
  healMonsterNests(state, tick);
  playerAttack(state, tick.nowMs);
  monstersAttack(state, tick.nowMs);
  wanderMonsters(state, tick.nowMs);
  removeDeadMonsters(state);
  convertDeadNests(state);

  return state;
}

function spawnMonsters(state: GameState, tick: CombatTick): void {
  for (const nest of state.monsterNests.values()) {
    if (!nest.revealed || !nest.isAlive()) {
      continue;
    }

    const livingCount = state.monsters.filter(
      (monster) => monster.isAlive() && monster.nestId === nest.id,
    ).length;

    if (livingCount >= nest.maxMonsters || tick.nowMs - nest.lastSpawnAt < nest.spawnIntervalMs) {
      continue;
    }

    const monster = new MonsterEntity({
      id: `monster-${state.nextMonsterId}`,
      coord: nest.coord,
      nestId: nest.id,
      homeCoord: nest.coord,
    });
    state.nextMonsterId += 1;
    nest.lastSpawnAt = tick.nowMs;
    state.monsters.push(monster);
    state.combatEvents.push({
      type: 'monsterSpawn',
      from: nest.coord,
      to: monster.coord,
      atMs: tick.nowMs,
    });
  }
}

function healMonsterNests(state: GameState, tick: CombatTick): void {
  for (const nest of state.monsterNests.values()) {
    if (!nest.revealed || !nest.isAlive()) {
      continue;
    }

    nest.heal((nest.regenPerSecond * tick.elapsedMs) / 1000);
  }
}

function playerAttack(state: GameState, nowMs: number): void {
  if (!state.player.canAttack(nowMs)) {
    return;
  }

  const monsterTarget = state.monsters
    .filter(
      (monster) =>
        monster.isAlive() && axialDistance(state.player.coord, monster.coord) <= state.player.attackRange,
    )
    .sort(
      (a, b) =>
        axialDistance(state.player.coord, a.coord) - axialDistance(state.player.coord, b.coord),
    )[0];

  if (monsterTarget) {
    monsterTarget.takeDamage(state.player.attack);
    state.player.markAttacked(nowMs);
    state.combatEvents.push({
      type: 'playerAttack',
      from: state.player.coord,
      to: monsterTarget.coord,
      atMs: nowMs,
    });
    return;
  }

  const nestTarget = [...state.monsterNests.values()]
    .filter(
      (nest) =>
        nest.revealed && nest.isAlive() && axialDistance(state.player.coord, nest.coord) <= state.player.attackRange,
    )
    .sort(
      (a, b) =>
        axialDistance(state.player.coord, a.coord) - axialDistance(state.player.coord, b.coord),
    )[0];

  if (!nestTarget) {
    return;
  }

  nestTarget.takeDamage(state.player.attack);
  state.player.markAttacked(nowMs);
  state.combatEvents.push({
    type: 'playerAttack',
    from: state.player.coord,
    to: nestTarget.coord,
    atMs: nowMs,
  });
}

function monstersAttack(state: GameState, nowMs: number): void {
  for (const monster of state.monsters) {
    if (
      !monster.canAttack(nowMs) ||
      axialDistance(monster.coord, state.player.coord) > monster.attackRange
    ) {
      continue;
    }

    state.player.takeDamage(monster.attack);
    monster.markAttacked(nowMs);
    state.combatEvents.push({
      type: 'monsterAttack',
      from: monster.coord,
      to: state.player.coord,
      atMs: nowMs,
    });
  }
}

function wanderMonsters(state: GameState, nowMs: number): void {
  for (const monster of state.monsters) {
    if (!monster.isAlive() || axialDistance(monster.coord, state.player.coord) <= monster.attackRange) {
      continue;
    }

    const options = getNeighbors(monster.coord)
      .filter((coord) => axialDistance(coord, monster.homeCoord) <= ENTITY_DEFAULTS.monster.wanderRadius)
      .filter((coord) => state.maze.cells.get(getHexKey(coord))?.type !== 'wall');

    if (options.length === 0) {
      continue;
    }

    const index = Math.floor(nowMs / 1000) % options.length;
    monster.coord = options[index];
  }
}

function removeDeadMonsters(state: GameState): void {
  state.monsters = state.monsters.filter((monster) => monster.isAlive());
}

function convertDeadNests(state: GameState): void {
  for (const nest of state.monsterNests.values()) {
    if (nest.isAlive()) {
      continue;
    }

    state.maze.cells.set(nest.key, nest.toMazeCell());
  }
}
