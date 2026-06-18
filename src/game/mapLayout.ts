import { type AxialCoord, axialToPixel } from './hex';

export const MAP_HEX_SIZE = 56;

export interface LayoutCell {
  key: string;
  coord: AxialCoord;
}

export interface MapViewport {
  width: number;
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface MapLayout {
  hexSize: number;
  cellCenters: Map<string, ScreenPoint>;
}

export function calculateMapLayout(options: {
  cells: Iterable<LayoutCell>;
  playerCoord: AxialCoord;
  viewport: MapViewport;
}): MapLayout {
  const playerPixel = axialToPixel(options.playerCoord, MAP_HEX_SIZE);
  const viewportCenter = {
    x: options.viewport.width / 2,
    y: options.viewport.height / 2,
  };
  const cellCenters = new Map<string, ScreenPoint>();

  for (const cell of options.cells) {
    const pixel = axialToPixel(cell.coord, MAP_HEX_SIZE);

    cellCenters.set(cell.key, {
      x: viewportCenter.x + pixel.x - playerPixel.x,
      y: viewportCenter.y + pixel.y - playerPixel.y,
    });
  }

  return {
    hexSize: MAP_HEX_SIZE,
    cellCenters,
  };
}
