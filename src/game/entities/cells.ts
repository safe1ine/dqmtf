import type { AxialCoord } from '../hex';
import type { CellType, MazeCell } from '../maze';
import { BaseEntity } from './BaseEntity';
import { ENTITY_DEFAULTS } from './defaults';

export interface CellEntityOptions {
  id: string;
  coord: AxialCoord;
  key: string;
  revealed: boolean;
}

export class CellEntity {
  readonly id: string;
  readonly coord: AxialCoord;
  readonly key: string;
  readonly type: CellType;
  revealed: boolean;

  constructor(options: CellEntityOptions & { type: CellType }) {
    this.id = options.id;
    this.coord = { ...options.coord };
    this.key = options.key;
    this.type = options.type;
    this.revealed = options.revealed;
  }

  isWalkable(): boolean {
    return this.type === 'empty' || this.type === 'exit';
  }

  toMazeCell(): MazeCell {
    return {
      coord: { ...this.coord },
      key: this.key,
      type: this.type,
      revealed: this.revealed,
    };
  }
}

export class EmptyCellEntity extends CellEntity {
  constructor(options: CellEntityOptions) {
    super({ ...options, type: 'empty' });
  }
}

export class WallCellEntity extends CellEntity {
  constructor(options: CellEntityOptions) {
    super({ ...options, type: 'wall' });
  }
}

export class ExitCellEntity extends CellEntity {
  constructor(options: CellEntityOptions) {
    super({ ...options, type: 'exit' });
  }
}

export class MonsterNestCellEntity extends CellEntity {
  readonly combat: BaseEntity;
  readonly spawnIntervalMs = ENTITY_DEFAULTS.monsterNest.spawnIntervalMs;
  readonly maxMonsters = ENTITY_DEFAULTS.monsterNest.maxMonsters;
  readonly regenPerSecond = ENTITY_DEFAULTS.monsterNest.regenPerSecond;
  lastSpawnAt = 0;

  constructor(options: CellEntityOptions) {
    super({ ...options, type: 'monsterNest' });
    this.combat = new BaseEntity({
      id: options.id,
      coord: options.coord,
      hp: ENTITY_DEFAULTS.monsterNest.hp,
      attack: ENTITY_DEFAULTS.monsterNest.attack,
      attackRange: ENTITY_DEFAULTS.monsterNest.attackRange,
      attackIntervalMs: Number.POSITIVE_INFINITY,
    });
  }

  get hp(): number {
    return this.combat.hp;
  }

  get maxHp(): number {
    return this.combat.maxHp;
  }

  isAlive(): boolean {
    return this.combat.isAlive();
  }

  takeDamage(amount: number): void {
    this.combat.takeDamage(amount);
  }

  heal(amount: number): void {
    this.combat.heal(amount);
  }

  override isWalkable(): boolean {
    return !this.isAlive();
  }

  override toMazeCell(): MazeCell {
    return {
      coord: { ...this.coord },
      key: this.key,
      type: this.isAlive() ? 'monsterNest' : 'empty',
      revealed: this.revealed,
    };
  }
}
