import { HEX_DIRECTIONS, getHexKey } from './hex';
import type { MazeCell } from './maze';

export const TILE_ASSETS = {
  unrevealedStone: {
    key: 'tile-unrevealed-stone',
    path: '/assets/tiles/unrevealed-stone-hex.webp',
  },
  emptyStone: {
    key: 'tile-empty-stone',
    path: '/assets/tiles/empty-stone-hex.webp',
  },
  wallPostStone: {
    key: 'tile-wall-post-stone',
    path: '/assets/tiles/wall-post-stone.webp',
  },
  wallConnectorStone: {
    key: 'tile-wall-connector-stone',
    path: '/assets/tiles/wall-connector-stone.webp',
  },
  unlockCrack1: {
    key: 'tile-unlock-crack-1',
    path: '/assets/tiles/unlock-crack-1.webp',
  },
  unlockCrack2: {
    key: 'tile-unlock-crack-2',
    path: '/assets/tiles/unlock-crack-2.webp',
  },
  unlockCrack3: {
    key: 'tile-unlock-crack-3',
    path: '/assets/tiles/unlock-crack-3.webp',
  },
  unlockCrack4: {
    key: 'tile-unlock-crack-4',
    path: '/assets/tiles/unlock-crack-4.webp',
  },
  unlockCrack5: {
    key: 'tile-unlock-crack-5',
    path: '/assets/tiles/unlock-crack-5.webp',
  },
} as const;

export const UNLOCK_ANIMATION_FRAME_KEYS = [
  TILE_ASSETS.unlockCrack1.key,
  TILE_ASSETS.unlockCrack2.key,
  TILE_ASSETS.unlockCrack3.key,
  TILE_ASSETS.unlockCrack4.key,
  TILE_ASSETS.unlockCrack5.key,
] as const;

export const UNLOCK_ANIMATION_FRAME_MS = 180;
export const UNLOCK_ANIMATION_TOTAL_MS = UNLOCK_ANIMATION_FRAME_KEYS.length * UNLOCK_ANIMATION_FRAME_MS;

export type CellTileVisual =
  | {
      kind: 'texture';
      key: string;
    }
  | {
      kind: 'fill';
    };

export type WallConnections = readonly boolean[];

export interface WallOverlaySegment {
  id: string;
  kind: 'post' | 'connector';
  directionIndex: number | null;
}

export interface WallOverlayDisplaySize {
  width: number;
  height: number;
}

export function getCellTileVisual(cell: MazeCell): CellTileVisual {
  if (!cell.revealed) {
    return {
      kind: 'texture',
      key: TILE_ASSETS.unrevealedStone.key,
    };
  }

  return {
    kind: 'texture',
    key: TILE_ASSETS.emptyStone.key,
  };
}

export function getRevealedWallConnections(
  cell: MazeCell,
  cells: ReadonlyMap<string, MazeCell>,
): WallConnections {
  return HEX_DIRECTIONS.map((direction) => {
    const neighbor = cells.get(
      getHexKey({
        q: cell.coord.q + direction.q,
        r: cell.coord.r + direction.r,
      }),
    );

    return neighbor?.revealed === true && neighbor.type === 'wall';
  });
}

export function getWallOverlaySegments(connections: WallConnections): WallOverlaySegment[] {
  const connectedSegments = connections.flatMap((connected, directionIndex) => {
    const drawsUniqueConnector = directionIndex < 3;

    return connected && drawsUniqueConnector
      ? [
          {
            id: `connector-${directionIndex}`,
            kind: 'connector' as const,
            directionIndex,
          },
        ]
      : [];
  });

  return [
    {
      id: 'post',
      kind: 'post',
      directionIndex: null,
    },
    ...connectedSegments,
  ];
}

export function getWallOverlayDisplaySize(
  hexSize: number,
  kind: WallOverlaySegment['kind'],
): WallOverlayDisplaySize {
  if (kind === 'post') {
    return {
      width: hexSize,
      height: hexSize,
    };
  }

  return {
    width: hexSize * 0.96,
    height: hexSize * 0.6,
  };
}

export function getHexTileDisplaySize(hexSize: number): { width: number; height: number } {
  return {
    width: hexSize * 2,
    height: Math.sqrt(3) * hexSize,
  };
}

export function getUnlockAnimationVisual(elapsedMs: number): CellTileVisual | null {
  if (elapsedMs < 0 || elapsedMs >= UNLOCK_ANIMATION_TOTAL_MS) {
    return null;
  }

  const frameIndex = Math.floor(elapsedMs / UNLOCK_ANIMATION_FRAME_MS);

  return {
    kind: 'texture',
    key: UNLOCK_ANIMATION_FRAME_KEYS[frameIndex],
  };
}
