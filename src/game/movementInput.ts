import type { PixelPoint } from './hex';

export type MovementDirection = 'up' | 'down' | 'left' | 'right';

const MOVEMENT_KEY_DIRECTIONS: Record<string, MovementDirection> = {
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  arrowup: 'up',
  a: 'left',
  d: 'right',
  s: 'down',
  w: 'up',
};

export function getMovementDirectionForKey(key: string): MovementDirection | null {
  return MOVEMENT_KEY_DIRECTIONS[key.toLowerCase()] ?? null;
}

export function getMovementVector(heldDirections: ReadonlySet<MovementDirection>): PixelPoint {
  const x = Number(heldDirections.has('right')) - Number(heldDirections.has('left'));
  const y = Number(heldDirections.has('down')) - Number(heldDirections.has('up'));
  const length = Math.hypot(x, y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / length,
    y: y / length,
  };
}
