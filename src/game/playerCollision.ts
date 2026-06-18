import type { PixelPoint } from './hex';
import { getPlayerSpriteDisplaySize } from './playerSprites';

export const PLAYER_COLLISION_WIDTH_RATIO = 0.45;
export const PLAYER_COLLISION_HEIGHT_RATIO = 0.5;

export function getPlayerLowerBodyCollisionSize(hexSize: number): { width: number; height: number } {
  const displaySize = getPlayerSpriteDisplaySize(hexSize);

  return {
    width: displaySize.width * PLAYER_COLLISION_WIDTH_RATIO,
    height: displaySize.height * PLAYER_COLLISION_HEIGHT_RATIO,
  };
}

function roundPoint(point: PixelPoint): PixelPoint {
  return {
    x: Number(point.x.toFixed(6)),
    y: Number(point.y.toFixed(6)),
  };
}

export function getPlayerLowerBodyCollisionSamplePoints(anchor: PixelPoint, hexSize: number): PixelPoint[] {
  const size = getPlayerLowerBodyCollisionSize(hexSize);
  const halfWidth = size.width / 2;
  const lowerY = anchor.y - size.height * 0.25;
  const middleY = anchor.y - size.height * 0.5;
  const topY = anchor.y - size.height;

  return [
    roundPoint(anchor),
    roundPoint({ x: anchor.x - halfWidth, y: lowerY }),
    roundPoint({ x: anchor.x + halfWidth, y: lowerY }),
    roundPoint({ x: anchor.x - halfWidth, y: middleY }),
    roundPoint({ x: anchor.x + halfWidth, y: middleY }),
    roundPoint({ x: anchor.x - halfWidth, y: topY }),
    roundPoint({ x: anchor.x + halfWidth, y: topY }),
  ];
}
