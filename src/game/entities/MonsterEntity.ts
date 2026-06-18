import type { AxialCoord } from '../hex';
import { ActorEntity } from './ActorEntity';
import { ENTITY_DEFAULTS } from './defaults';

export interface MonsterEntityOptions {
  id: string;
  coord: AxialCoord;
  nestId: string;
  homeCoord: AxialCoord;
}

export class MonsterEntity extends ActorEntity {
  readonly nestId: string;
  readonly homeCoord: AxialCoord;
  wanderTarget: AxialCoord;

  constructor(options: MonsterEntityOptions) {
    super({
      id: options.id,
      coord: options.coord,
      hp: ENTITY_DEFAULTS.monster.hp,
      attack: ENTITY_DEFAULTS.monster.attack,
      attackRange: ENTITY_DEFAULTS.monster.attackRange,
      attackIntervalMs: ENTITY_DEFAULTS.monster.attackIntervalMs,
    });
    this.nestId = options.nestId;
    this.homeCoord = { ...options.homeCoord };
    this.wanderTarget = { ...options.coord };
  }
}
