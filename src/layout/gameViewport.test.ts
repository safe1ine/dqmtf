import { describe, expect, it } from 'vitest';
import { calculateGameViewport } from './gameViewport';

describe('calculateGameViewport', () => {
  it('caps wide available space at 1440 by 810', () => {
    expect(calculateGameViewport({ width: 1920, height: 1080 })).toEqual({
      width: 1440,
      height: 810,
    });
  });

  it('scales down proportionally below 1440 width', () => {
    expect(calculateGameViewport({ width: 1280, height: 720 })).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it('uses available width for narrow spaces', () => {
    expect(calculateGameViewport({ width: 800, height: 1000 })).toEqual({
      width: 800,
      height: 450,
    });
  });

  it('uses available height when height is the limiting dimension', () => {
    const size = calculateGameViewport({ width: 1200, height: 500 });

    expect(size.width).toBeCloseTo(8000 / 9, 3);
    expect(size.height).toBe(500);
  });

  it('returns zero size when no space is available', () => {
    expect(calculateGameViewport({ width: 0, height: 500 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});
