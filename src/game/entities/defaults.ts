export const ENTITY_DEFAULTS = {
  player: {
    hp: 100,
    attack: 10,
    attackRange: 3,
    attackIntervalMs: 700,
  },
  monster: {
    hp: 20,
    attack: 4,
    attackRange: 1,
    attackIntervalMs: 1000,
    wanderRadius: 2,
  },
  monsterNest: {
    hp: 120,
    attack: 0,
    attackRange: 3,
    spawnIntervalMs: 5000,
    maxMonsters: 5,
    regenPerSecond: 2,
    generationChance: 0.1,
  },
} as const;
