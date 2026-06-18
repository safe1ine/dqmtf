import { describe, expect, it } from 'vitest';
import {
  getMovementDirectionForKey,
  getMovementVector,
  type MovementDirection,
} from './movementInput';

describe('movement input helpers', () => {
  it('maps WASD and arrow keys to movement directions', () => {
    expect(getMovementDirectionForKey('w')).toBe('up');
    expect(getMovementDirectionForKey('ArrowUp')).toBe('up');
    expect(getMovementDirectionForKey('s')).toBe('down');
    expect(getMovementDirectionForKey('ArrowDown')).toBe('down');
    expect(getMovementDirectionForKey('a')).toBe('left');
    expect(getMovementDirectionForKey('ArrowLeft')).toBe('left');
    expect(getMovementDirectionForKey('d')).toBe('right');
    expect(getMovementDirectionForKey('ArrowRight')).toBe('right');
    expect(getMovementDirectionForKey('Escape')).toBeNull();
  });

  it('returns zero movement when opposite directions cancel out', () => {
    const held = new Set<MovementDirection>(['left', 'right', 'up', 'down']);

    expect(getMovementVector(held)).toEqual({ x: 0, y: 0 });
  });

  it('normalizes diagonal movement', () => {
    const held = new Set<MovementDirection>(['right', 'up']);
    const vector = getMovementVector(held);

    expect(vector.x).toBeCloseTo(Math.SQRT1_2, 6);
    expect(vector.y).toBeCloseTo(-Math.SQRT1_2, 6);
    expect(Math.hypot(vector.x, vector.y)).toBeCloseTo(1, 6);
  });
});
