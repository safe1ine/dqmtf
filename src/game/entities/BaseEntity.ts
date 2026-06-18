import type { AxialCoord } from '../hex';

export interface BaseEntityOptions {
  id: string;
  coord: AxialCoord;
  hp: number;
  attack: number;
  attackRange: number;
  attackIntervalMs: number;
}

export class BaseEntity {
  readonly id: string;
  coord: AxialCoord;
  readonly maxHp: number;
  hp: number;
  readonly attack: number;
  readonly attackRange: number;
  readonly attackIntervalMs: number;
  lastAttackAt = -Infinity;

  constructor(options: BaseEntityOptions) {
    this.id = options.id;
    this.coord = { ...options.coord };
    this.maxHp = options.hp;
    this.hp = options.hp;
    this.attack = options.attack;
    this.attackRange = options.attackRange;
    this.attackIntervalMs = options.attackIntervalMs;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - Math.max(0, amount));
  }

  heal(amount: number): void {
    if (!this.isAlive()) {
      return;
    }

    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, amount));
  }

  canAttack(nowMs: number): boolean {
    return this.isAlive() && nowMs - this.lastAttackAt >= this.attackIntervalMs;
  }

  markAttacked(nowMs: number): void {
    this.lastAttackAt = nowMs;
  }
}
