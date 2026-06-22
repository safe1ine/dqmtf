import { describe, expect, it } from 'vitest';
import {
  getCellTileVisual,
  getHexTileDisplaySize,
  getRevealedWallConnections,
  getWallOverlayDisplaySize,
  getWallOverlaySegments,
  getUnlockAnimationVisual,
  TILE_ASSETS,
  UNLOCK_ANIMATION_FRAME_KEYS,
  UNLOCK_ANIMATION_FRAME_MS,
  UNLOCK_ANIMATION_TOTAL_MS,
} from './tileRendering';
import type { MazeCell } from './maze';
import type { AxialCoord } from './hex';

function createCell(
  revealed: boolean,
  type: MazeCell['type'] = 'empty',
  coord: AxialCoord = { q: 0, r: 0 },
): MazeCell {
  return {
    key: `${coord.q},${coord.r}`,
    coord,
    type,
    revealed,
  };
}

describe('tile rendering helpers', () => {
  it('uses the stone texture for unrevealed cells', () => {
    expect(getCellTileVisual(createCell(false))).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unrevealedStone.key,
    });
  });

  it('uses the empty stone texture for revealed empty cells', () => {
    expect(getCellTileVisual(createCell(true, 'empty'))).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.emptyStone.key,
    });
  });

  it('uses the empty stone texture as the background for revealed wall cells', () => {
    expect(getCellTileVisual(createCell(true, 'wall'))).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.emptyStone.key,
    });
  });

  it('uses the empty stone texture as the background for special revealed cells', () => {
    expect(getCellTileVisual(createCell(true, 'exit'))).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.emptyStone.key,
    });
    expect(getCellTileVisual(createCell(true, 'monsterNest'))).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.emptyStone.key,
    });
  });

  it('connects wall overlays only to revealed neighboring walls', () => {
    const center = createCell(true, 'wall', { q: 0, r: 0 });
    const revealedEastWall = createCell(true, 'wall', { q: 1, r: 0 });
    const hiddenNorthEastWall = createCell(false, 'wall', { q: 1, r: -1 });
    const revealedNorthEmpty = createCell(true, 'empty', { q: 0, r: -1 });
    const revealedWestWall = createCell(true, 'wall', { q: -1, r: 0 });
    const cells = new Map(
      [center, revealedEastWall, hiddenNorthEastWall, revealedNorthEmpty, revealedWestWall].map((cell) => [
        cell.key,
        cell,
      ]),
    );

    expect(getRevealedWallConnections(center, cells)).toEqual([
      true,
      false,
      false,
      true,
      false,
      false,
    ]);
  });

  it('defines the generated stone fence post and connector overlay assets', () => {
    expect(TILE_ASSETS.wallPostStone.path).toBe('/assets/tiles/wall-post-stone.webp');
    expect(TILE_ASSETS.wallConnectorStone.path).toBe('/assets/tiles/wall-connector-stone.webp');
  });

  it('uses one centered stone post for isolated walls', () => {
    expect(getWallOverlaySegments([false, false, false, false, false, false])).toEqual([
      {
        id: 'post',
        kind: 'post',
        directionIndex: null,
      },
    ]);
  });

  it('uses one post and connector images for unique connected wall directions', () => {
    expect(getWallOverlaySegments([true, false, false, true, false, true])).toEqual([
      {
        id: 'post',
        kind: 'post',
        directionIndex: null,
      },
      {
        id: 'connector-0',
        kind: 'connector',
        directionIndex: 0,
      },
    ]);
  });

  it('sizes wall posts large and connectors visibly thick', () => {
    const hexSize = 56;

    expect(getWallOverlayDisplaySize(hexSize, 'post')).toEqual({
      width: hexSize,
      height: hexSize,
    });
    expect(getWallOverlayDisplaySize(hexSize, 'connector')).toEqual({
      width: hexSize * 0.96,
      height: hexSize * 0.68,
    });
  });

  it('matches a flat-top hex bounding box for texture display size', () => {
    expect(getHexTileDisplaySize(56)).toEqual({
      width: 112,
      height: Math.sqrt(3) * 56,
    });
  });

  it('defines five unlock crack animation frame assets', () => {
    expect(UNLOCK_ANIMATION_FRAME_KEYS).toEqual([
      TILE_ASSETS.unlockCrack1.key,
      TILE_ASSETS.unlockCrack2.key,
      TILE_ASSETS.unlockCrack3.key,
      TILE_ASSETS.unlockCrack4.key,
      TILE_ASSETS.unlockCrack5.key,
    ]);
    expect(TILE_ASSETS.unlockCrack1.path).toBe('/assets/tiles/unlock-crack-1.webp');
    expect(TILE_ASSETS.unlockCrack2.path).toBe('/assets/tiles/unlock-crack-2.webp');
    expect(TILE_ASSETS.unlockCrack3.path).toBe('/assets/tiles/unlock-crack-3.webp');
    expect(TILE_ASSETS.unlockCrack4.path).toBe('/assets/tiles/unlock-crack-4.webp');
    expect(TILE_ASSETS.unlockCrack5.path).toBe('/assets/tiles/unlock-crack-5.webp');
  });

  it('selects unlock crack frames by elapsed time', () => {
    expect(UNLOCK_ANIMATION_FRAME_MS).toBe(180);
    expect(UNLOCK_ANIMATION_TOTAL_MS).toBe(900);
    expect(getUnlockAnimationVisual(0)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack1.key,
    });
    expect(getUnlockAnimationVisual(179)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack1.key,
    });
    expect(getUnlockAnimationVisual(180)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack2.key,
    });
    expect(getUnlockAnimationVisual(360)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack3.key,
    });
    expect(getUnlockAnimationVisual(540)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack4.key,
    });
    expect(getUnlockAnimationVisual(720)).toEqual({
      kind: 'texture',
      key: TILE_ASSETS.unlockCrack5.key,
    });
    expect(getUnlockAnimationVisual(UNLOCK_ANIMATION_TOTAL_MS)).toBeNull();
  });
});
