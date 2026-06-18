import { describe, expect, it } from 'vitest';
import { getHexKey } from './hex';
import { tickCombat } from './combat';
import { MonsterNestCellEntity } from './entities/cells';
import { ENTITY_DEFAULTS } from './entities/defaults';
import { MonsterEntity } from './entities/MonsterEntity';
import { createGameState, type GameState } from './state';

function addNest(state: GameState, revealed = true): MonsterNestCellEntity {
  const coord = { q: 2, r: 0 };
  const key = getHexKey(coord);
  const nest = new MonsterNestCellEntity({
    id: `nest-${key}`,
    coord,
    key,
    revealed,
  });

  state.maze.cells.set(key, nest.toMazeCell());
  state.monsterNests.set(nest.id, nest);

  return nest;
}

describe('combat simulation', () => {
  it('does not spawn monsters from hidden monster nests', () => {
    const state = createGameState(1);
    addNest(state, false);

    const result = tickCombat(state, { elapsedMs: 5000, nowMs: 5000 });

    expect(result.monsters).toHaveLength(0);
  });

  it('spawns one monster every 5 seconds and caps each nest at 5 monsters', () => {
    let state = createGameState(1);
    const nest = addNest(state, true);
    state.player.coord = { q: -10, r: 0 };

    for (let i = 1; i <= 6; i += 1) {
      state = tickCombat(state, { elapsedMs: 5000, nowMs: i * 5000 });
    }

    expect(state.monsters).toHaveLength(ENTITY_DEFAULTS.monsterNest.maxMonsters);
    expect(state.monsters.every((monster) => monster.nestId === nest.id)).toBe(true);
  });

  it('regenerates revealed living monster nests over time', () => {
    const state = createGameState(1);
    const nest = addNest(state, true);
    state.player.coord = { q: -10, r: 0 };
    nest.takeDamage(20);

    tickCombat(state, { elapsedMs: 1000, nowMs: 1000 });

    expect(nest.hp).toBe(ENTITY_DEFAULTS.monsterNest.hp - 18);
  });

  it('player attacks the nearest monster before attacking a nest', () => {
    const state = createGameState(1);
    const nest = addNest(state, true);
    const farMonster = new MonsterEntity({
      id: 'monster-far',
      coord: { q: 2, r: 0 },
      nestId: nest.id,
      homeCoord: nest.coord,
    });
    const nearMonster = new MonsterEntity({
      id: 'monster-near',
      coord: { q: 1, r: 0 },
      nestId: nest.id,
      homeCoord: nest.coord,
    });
    state.monsters.push(farMonster, nearMonster);

    tickCombat(state, { elapsedMs: 100, nowMs: 100 });

    expect(nearMonster.hp).toBe(ENTITY_DEFAULTS.monster.hp - ENTITY_DEFAULTS.player.attack);
    expect(farMonster.hp).toBe(ENTITY_DEFAULTS.monster.hp);
    expect(nest.hp).toBe(ENTITY_DEFAULTS.monsterNest.hp);
  });

  it('player attacks a revealed monster nest when no monster is in range', () => {
    const state = createGameState(1);
    const nest = addNest(state, true);

    tickCombat(state, { elapsedMs: 100, nowMs: 100 });

    expect(nest.hp).toBe(ENTITY_DEFAULTS.monsterNest.hp - ENTITY_DEFAULTS.player.attack);
  });

  it('monsters attack the player when in range', () => {
    const state = createGameState(1);
    const nest = addNest(state, true);
    state.monsters.push(
      new MonsterEntity({
        id: 'monster-near',
        coord: { q: 1, r: 0 },
        nestId: nest.id,
        homeCoord: nest.coord,
      }),
    );

    tickCombat(state, { elapsedMs: 100, nowMs: 100 });

    expect(state.player.hp).toBe(ENTITY_DEFAULTS.player.hp - ENTITY_DEFAULTS.monster.attack);
  });

  it('converts destroyed monster nests into empty cells', () => {
    const state = createGameState(1);
    const nest = addNest(state, true);
    nest.takeDamage(ENTITY_DEFAULTS.monsterNest.hp - 5);

    tickCombat(state, { elapsedMs: 100, nowMs: 100 });

    expect(nest.isAlive()).toBe(false);
    expect(state.maze.cells.get(nest.key)?.type).toBe('empty');
  });
});
