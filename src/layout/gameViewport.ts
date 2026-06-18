const ASPECT_WIDTH = 16;
const ASPECT_HEIGHT = 9;
const MAX_VIEWPORT_WIDTH = 1440;

export interface AvailableViewport {
  width: number;
  height: number;
}

export interface GameViewportSize {
  width: number;
  height: number;
}

export function calculateGameViewport(available: AvailableViewport): GameViewportSize {
  const availableWidth = Math.max(0, available.width);
  const availableHeight = Math.max(0, available.height);

  if (availableWidth === 0 || availableHeight === 0) {
    return { width: 0, height: 0 };
  }

  const widthFromAvailable = Math.min(availableWidth, MAX_VIEWPORT_WIDTH);
  const heightFromWidth = (widthFromAvailable * ASPECT_HEIGHT) / ASPECT_WIDTH;

  if (heightFromWidth <= availableHeight) {
    return {
      width: widthFromAvailable,
      height: heightFromWidth,
    };
  }

  return {
    width: (availableHeight * ASPECT_WIDTH) / ASPECT_HEIGHT,
    height: availableHeight,
  };
}
