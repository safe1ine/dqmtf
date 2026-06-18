import { describe, expect, it } from 'vitest';
import {
  getPlayerLowerBodyCollisionSamplePoints,
  getPlayerLowerBodyCollisionSize,
  PLAYER_COLLISION_HEIGHT_RATIO,
  PLAYER_COLLISION_WIDTH_RATIO,
} from './playerCollision';

describe('player lower-body collision geometry', () => {
  it('uses the selected lower 50 percent collision height', () => {
    expect(PLAYER_COLLISION_HEIGHT_RATIO).toBe(0.5);
  });

  it('uses a narrower lower-body collision width than the displayed character', () => {
    expect(PLAYER_COLLISION_WIDTH_RATIO).toBe(0.45);
  });

  it('derives lower-body collision size from the displayed player size', () => {
    expect(getPlayerLowerBodyCollisionSize(56)).toEqual({
      width: 30.240000000000002,
      height: 67.2,
    });
  });

  it('samples only the lower half above the foot anchor', () => {
    const samples = getPlayerLowerBodyCollisionSamplePoints({ x: 100, y: 200 }, 56);

    expect(samples).toEqual([
      { x: 100, y: 200 },
      { x: 84.88, y: 183.2 },
      { x: 115.12, y: 183.2 },
      { x: 84.88, y: 166.4 },
      { x: 115.12, y: 166.4 },
      { x: 84.88, y: 132.8 },
      { x: 115.12, y: 132.8 },
    ]);
  });
});
