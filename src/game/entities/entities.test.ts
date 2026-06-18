import { describe, expect, it } from 'vitest';
import { EmptyCellEntity, MonsterNestCellEntity, WallCellEntity } from './cells';
import { ENTITY_DEFAULTS } from './defaults';
import { MonsterEntity } from './MonsterEntity';
import { PlayerEntity } from './PlayerEntity';

describe('entity classes', () => {
  it('applies damage and caps healing at max hp', () => {
    const player = new PlayerEntity({ id: 'player', coord: { q: 0, r: 0 } });

    player.takeDamage(30);
    expect(player.hp).toBe(70);

    player.heal(200);
    expect(player.hp).toBe(ENTITY_DEFAULTS.player.hp);
  });

  it('exposes alive state after lethal damage', () => {
    const monster = new MonsterEntity({
      id: 'monster-1',
      coord: { q: 1, r: 0 },
      nestId: 'nest-1',
      homeCoord: { q: 1, r: 0 },
    });

    monster.takeDamage(ENTITY_DEFAULTS.monster.hp);

    expect(monster.isAlive()).toBe(false);
    expect(monster.hp).toBe(0);
  });

  it('uses shared defaults for player, monster, and monster nest', () => {
    const player = new PlayerEntity({ id: 'player', coord: { q: 0, r: 0 } });
    const monster = new MonsterEntity({
      id: 'monster-1',
      coord: { q: 1, r: 0 },
      nestId: 'nest-1',
      homeCoord: { q: 1, r: 0 },
    });
    const nest = new MonsterNestCellEntity({
      id: 'nest-1',
      coord: { q: 2, r: 0 },
      key: '2,0',
      revealed: true,
    });

    expect(player.attack).toBe(ENTITY_DEFAULTS.player.attack);
    expect(monster.attack).toBe(ENTITY_DEFAULTS.monster.attack);
    expect(nest.maxMonsters).toBe(ENTITY_DEFAULTS.monsterNest.maxMonsters);
    expect(nest.spawnIntervalMs).toBe(ENTITY_DEFAULTS.monsterNest.spawnIntervalMs);
  });

  it('keeps wall and living monster nest cells blocked, empty cells walkable', () => {
    const empty = new EmptyCellEntity({ id: 'empty', coord: { q: 0, r: 0 }, key: '0,0', revealed: true });
    const wall = new WallCellEntity({ id: 'wall', coord: { q: 1, r: 0 }, key: '1,0', revealed: true });
    const nest = new MonsterNestCellEntity({
      id: 'nest',
      coord: { q: 2, r: 0 },
      key: '2,0',
      revealed: true,
    });

    expect(empty.isWalkable()).toBe(true);
    expect(wall.isWalkable()).toBe(false);
    expect(nest.isWalkable()).toBe(false);

    nest.takeDamage(nest.hp);

    expect(nest.isWalkable()).toBe(true);
    expect(nest.toMazeCell().type).toBe('empty');
  });
});
