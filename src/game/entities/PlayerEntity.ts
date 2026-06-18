import type { AxialCoord, PixelPoint } from '../hex';
import { ActorEntity } from './ActorEntity';
import { ENTITY_DEFAULTS } from './defaults';

export interface PlayerEntityOptions {
  id: string;
  coord: AxialCoord;
  worldPosition?: PixelPoint;
}

export class PlayerEntity extends ActorEntity {
  worldPosition: PixelPoint;
  readonly moveSpeed = ENTITY_DEFAULTS.player.moveSpeed;

  constructor(options: PlayerEntityOptions) {
    super({
      id: options.id,
      coord: options.coord,
      hp: ENTITY_DEFAULTS.player.hp,
      attack: ENTITY_DEFAULTS.player.attack,
      attackRange: ENTITY_DEFAULTS.player.attackRange,
      attackIntervalMs: ENTITY_DEFAULTS.player.attackIntervalMs,
    });

    this.worldPosition = options.worldPosition ? { ...options.worldPosition } : { x: 0, y: 0 };
  }
}
