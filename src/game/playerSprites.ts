import type { PixelPoint } from './hex';

export type PlayerDirection =
  | 'front'
  | 'frontRight'
  | 'right'
  | 'backRight'
  | 'back'
  | 'backLeft'
  | 'left'
  | 'frontLeft';

export const PLAYER_SPRITE_DISPLAY_HEIGHT_HEXES = 2.4;
export const PLAYER_SPRITE_DISPLAY_ASPECT_RATIO = 0.5;

export const PLAYER_SPRITE_ASSETS: Record<PlayerDirection, { key: string; path: string }> = {
  front: {
    key: 'player-doubao-front',
    path: '/assets/player/doubao/front.webp',
  },
  frontRight: {
    key: 'player-doubao-front-right',
    path: '/assets/player/doubao/front_left.webp',
  },
  right: {
    key: 'player-doubao-right',
    path: '/assets/player/doubao/left.webp',
  },
  backRight: {
    key: 'player-doubao-back-right',
    path: '/assets/player/doubao/back_left.webp',
  },
  back: {
    key: 'player-doubao-back',
    path: '/assets/player/doubao/back.webp',
  },
  backLeft: {
    key: 'player-doubao-back-left',
    path: '/assets/player/doubao/back_right.webp',
  },
  left: {
    key: 'player-doubao-left',
    path: '/assets/player/doubao/right.webp',
  },
  frontLeft: {
    key: 'player-doubao-front-left',
    path: '/assets/player/doubao/front_right.webp',
  },
};

const DIRECTION_BY_OCTANT: readonly PlayerDirection[] = [
  'right',
  'frontRight',
  'front',
  'frontLeft',
  'left',
  'backLeft',
  'back',
  'backRight',
];

export function getPlayerDirectionForVector(vector: PixelPoint): PlayerDirection | null {
  if (vector.x === 0 && vector.y === 0) {
    return null;
  }

  const angle = Math.atan2(vector.y, vector.x);
  const octant = (Math.round(angle / (Math.PI / 4)) + 8) % 8;

  return DIRECTION_BY_OCTANT[octant];
}

export function getPlayerSpriteDisplaySize(hexSize: number): { width: number; height: number } {
  const height = hexSize * PLAYER_SPRITE_DISPLAY_HEIGHT_HEXES;

  return {
    width: height * PLAYER_SPRITE_DISPLAY_ASPECT_RATIO,
    height,
  };
}
