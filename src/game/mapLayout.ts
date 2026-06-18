import { type AxialCoord, axialToPixel, type PixelPoint } from './hex';

export const MAP_HEX_SIZE = 56;

export interface LayoutCell {
  key: string;
  coord: AxialCoord;
}

export interface MapViewport {
  width: number;
  height: number;
}

export type ScreenPoint = PixelPoint;

export interface MapLayout {
  hexSize: number;
  cellCenters: Map<string, ScreenPoint>;
}

export function interpolateAxialCoord(
  from: AxialCoord,
  to: AxialCoord,
  progress: number,
): AxialCoord {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return {
    q: from.q + (to.q - from.q) * clampedProgress,
    r: from.r + (to.r - from.r) * clampedProgress,
  };
}

export function calculateMapLayout(options: {
  cells: Iterable<LayoutCell>;
  playerCoord?: AxialCoord;
  focusWorldPosition?: PixelPoint;
  viewport: MapViewport;
}): MapLayout {
  const focusWorldPosition =
    options.focusWorldPosition ?? axialToPixel(options.playerCoord ?? { q: 0, r: 0 }, MAP_HEX_SIZE);
  const viewportCenter = {
    x: options.viewport.width / 2,
    y: options.viewport.height / 2,
  };
  const cellCenters = new Map<string, ScreenPoint>();

  for (const cell of options.cells) {
    const pixel = axialToPixel(cell.coord, MAP_HEX_SIZE);

    cellCenters.set(cell.key, {
      x: viewportCenter.x + pixel.x - focusWorldPosition.x,
      y: viewportCenter.y + pixel.y - focusWorldPosition.y,
    });
  }

  return {
    hexSize: MAP_HEX_SIZE,
    cellCenters,
  };
}
