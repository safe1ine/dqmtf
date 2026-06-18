import type { AxialCoord } from '../hex';
import { ActorEntity } from './ActorEntity';
import { ENTITY_DEFAULTS } from './defaults';

export interface PlayerEntityOptions {
  id: string;
  coord: AxialCoord;
}

export class PlayerEntity extends ActorEntity {
  constructor(options: PlayerEntityOptions) {
    super({
      id: options.id,
      coord: options.coord,
      hp: ENTITY_DEFAULTS.player.hp,
      attack: ENTITY_DEFAULTS.player.attack,
      attackRange: ENTITY_DEFAULTS.player.attackRange,
      attackIntervalMs: ENTITY_DEFAULTS.player.attackIntervalMs,
    });
  }
}
