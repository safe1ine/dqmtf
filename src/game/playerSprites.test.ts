import { describe, expect, it } from 'vitest';
import {
  getPlayerDirectionForVector,
  getPlayerSpriteDisplaySize,
  PLAYER_SPRITE_ASSETS,
} from './playerSprites';

describe('player sprite helpers', () => {
  it('uses corrected asset mapping when source left and right file names are reversed', () => {
    expect(PLAYER_SPRITE_ASSETS.front.path).toBe('/assets/player/doubao/front.webp');
    expect(PLAYER_SPRITE_ASSETS.frontRight.path).toBe('/assets/player/doubao/front_left.webp');
    expect(PLAYER_SPRITE_ASSETS.right.path).toBe('/assets/player/doubao/left.webp');
    expect(PLAYER_SPRITE_ASSETS.backRight.path).toBe('/assets/player/doubao/back_left.webp');
    expect(PLAYER_SPRITE_ASSETS.back.path).toBe('/assets/player/doubao/back.webp');
    expect(PLAYER_SPRITE_ASSETS.backLeft.path).toBe('/assets/player/doubao/back_right.webp');
    expect(PLAYER_SPRITE_ASSETS.left.path).toBe('/assets/player/doubao/right.webp');
    expect(PLAYER_SPRITE_ASSETS.frontLeft.path).toBe('/assets/player/doubao/front_right.webp');
  });

  it('maps screen movement vectors to 8 visual directions', () => {
    expect(getPlayerDirectionForVector({ x: 0, y: 1 })).toBe('front');
    expect(getPlayerDirectionForVector({ x: 1, y: 1 })).toBe('frontRight');
    expect(getPlayerDirectionForVector({ x: 1, y: 0 })).toBe('right');
    expect(getPlayerDirectionForVector({ x: 1, y: -1 })).toBe('backRight');
    expect(getPlayerDirectionForVector({ x: 0, y: -1 })).toBe('back');
    expect(getPlayerDirectionForVector({ x: -1, y: -1 })).toBe('backLeft');
    expect(getPlayerDirectionForVector({ x: -1, y: 0 })).toBe('left');
    expect(getPlayerDirectionForVector({ x: -1, y: 1 })).toBe('frontLeft');
  });

  it('returns null for no movement so callers can keep the previous facing direction', () => {
    expect(getPlayerDirectionForVector({ x: 0, y: 0 })).toBeNull();
  });

  it('scales the character to 1.2 hexes tall while preserving the square source aspect', () => {
    expect(getPlayerSpriteDisplaySize(56)).toEqual({
      width: 67.2,
      height: 67.2,
    });
  });
});
