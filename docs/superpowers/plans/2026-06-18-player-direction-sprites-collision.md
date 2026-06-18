# Player Direction Sprites And Lower-Body Collision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the circular player marker with 8 corrected-direction Doubao character sprites, keep the last facing direction while idle, and make terrain collision use only the lower 50% of the displayed character.

**Architecture:** Add pure player presentation helpers for sprite asset mapping, direction octants, display size, and lower-body collision sample points. Keep collision validation in `state.ts`, where movement already handles walkability and sloped-wall sliding. Keep `GameScene.ts` responsible for loading/rendering the sprite and updating the last visual facing direction from held movement input.

**Tech Stack:** TypeScript, Vite, Phaser 3, Vitest, public web assets.

---

## Current Workspace Notes

- `src/game/GameScene.ts` already contains uncommitted continuous movement plus tile/wall overlay rendering work. Implement against the current file content; do not revert those changes.
- `src/game/tileRendering.ts`, `src/game/tileRendering.test.ts`, `public/`, `pnpm-lock.yaml`, `.superpowers/`, and `docs/superpowers/plans/2026-06-18-connected-wall-overlays.md` are already untracked or dirty. Do not remove them.
- The player zip source is `/mnt/c/Users/maosite/Downloads/豆包.zip`. Runtime code must use copied files under `public/assets/player/doubao/`, not the Downloads path.

## File Structure

- Create `src/game/playerSprites.ts`: player direction enum, corrected asset paths, vector-to-direction mapping, and display size helper.
- Create `src/game/playerSprites.test.ts`: corrected left/right asset mapping and 8-octant direction tests.
- Create `src/game/playerCollision.ts`: lower-body collision constants and sample point generation.
- Create `src/game/playerCollision.test.ts`: lower-body sample geometry tests.
- Modify `src/game/state.ts`: validate movement candidates with lower-body sample points and keep sloped-wall sliding.
- Modify `src/game/state.test.ts`: lower-body blocking and upper-body-overlap behavior tests.
- Modify `src/game/GameScene.ts`: preload player sprites, render persistent player image, update last facing direction from movement.
- Copy assets to `public/assets/player/doubao/`: eight `.webp` direction images from the zip.

---

### Task 1: Player Sprite Direction Mapping

**Files:**
- Create: `src/game/playerSprites.ts`
- Create: `src/game/playerSprites.test.ts`
- Create assets under: `public/assets/player/doubao/`

- [ ] **Step 1: Extract the player sprite assets**

Run:

```bash
mkdir -p public/assets/player/doubao
python3 - <<'PY'
import pathlib
import zipfile

zip_path = pathlib.Path('/mnt/c/Users/maosite/Downloads/豆包.zip')
out_dir = pathlib.Path('public/assets/player/doubao')
files = [
    'front.webp',
    'front_right.webp',
    'right.webp',
    'back_right.webp',
    'back.webp',
    'back_left.webp',
    'left.webp',
    'front_left.webp',
]

with zipfile.ZipFile(zip_path) as archive:
    for file_name in files:
        out_path = out_dir / file_name
        out_path.write_bytes(archive.read(f'slices/{file_name}'))
PY
```

Expected: `public/assets/player/doubao/` contains all 8 webp files.

- [ ] **Step 2: Write failing sprite helper tests**

Create `src/game/playerSprites.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getPlayerDirectionForVector,
  getPlayerSpriteDisplaySize,
  PLAYER_SPRITE_ASSETS,
} from './playerSprites';

describe('player sprite helpers', () => {
  it('uses corrected asset mapping when source left and right file names are reversed', () => {
    expect(PLAYER_SPRITE_ASSETS.front.path).toBe('/assets/player/doubao/front.webp');
    expect(PLAYER_SPRITE_ASSETS.frontRight.path).toBe('/assets/player/doubao/front_left.webp');
    expect(PLAYER_SPRITE_ASSETS.right.path).toBe('/assets/player/doubao/left.webp');
    expect(PLAYER_SPRITE_ASSETS.backRight.path).toBe('/assets/player/doubao/back_left.webp');
    expect(PLAYER_SPRITE_ASSETS.back.path).toBe('/assets/player/doubao/back.webp');
    expect(PLAYER_SPRITE_ASSETS.backLeft.path).toBe('/assets/player/doubao/back_right.webp');
    expect(PLAYER_SPRITE_ASSETS.left.path).toBe('/assets/player/doubao/right.webp');
    expect(PLAYER_SPRITE_ASSETS.frontLeft.path).toBe('/assets/player/doubao/front_right.webp');
  });

  it('maps screen movement vectors to 8 visual directions', () => {
    expect(getPlayerDirectionForVector({ x: 0, y: 1 })).toBe('front');
    expect(getPlayerDirectionForVector({ x: 1, y: 1 })).toBe('frontRight');
    expect(getPlayerDirectionForVector({ x: 1, y: 0 })).toBe('right');
    expect(getPlayerDirectionForVector({ x: 1, y: -1 })).toBe('backRight');
    expect(getPlayerDirectionForVector({ x: 0, y: -1 })).toBe('back');
    expect(getPlayerDirectionForVector({ x: -1, y: -1 })).toBe('backLeft');
    expect(getPlayerDirectionForVector({ x: -1, y: 0 })).toBe('left');
    expect(getPlayerDirectionForVector({ x: -1, y: 1 })).toBe('frontLeft');
  });

  it('returns null for no movement so callers can keep the previous facing direction', () => {
    expect(getPlayerDirectionForVector({ x: 0, y: 0 })).toBeNull();
  });

  it('scales the character to 2.4 hexes tall with a narrow standing aspect', () => {
    expect(getPlayerSpriteDisplaySize(56)).toEqual({
      width: 67.2,
      height: 134.4,
    });
  });
});
```

- [ ] **Step 3: Run the failing sprite helper tests**

Run:

```bash
npm test -- src/game/playerSprites.test.ts
```

Expected: fail because `src/game/playerSprites.ts` does not exist.

- [ ] **Step 4: Implement sprite helpers**

Create `src/game/playerSprites.ts`:

```ts
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
```

- [ ] **Step 5: Run sprite helper tests**

Run:

```bash
npm test -- src/game/playerSprites.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit sprite helper and assets**

```bash
git add src/game/playerSprites.ts src/game/playerSprites.test.ts public/assets/player/doubao
git commit -m "feat: add player direction sprite assets"
```

---

### Task 2: Lower-Body Collision Geometry

**Files:**
- Create: `src/game/playerCollision.ts`
- Create: `src/game/playerCollision.test.ts`

- [ ] **Step 1: Write failing lower-body collision geometry tests**

Create `src/game/playerCollision.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getPlayerLowerBodyCollisionSamplePoints,
  getPlayerLowerBodyCollisionSize,
  PLAYER_COLLISION_HEIGHT_RATIO,
  PLAYER_COLLISION_WIDTH_RATIO,
} from './playerCollision';

describe('player lower-body collision geometry', () => {
  it('uses the selected lower 50 percent collision height', () => {
    expect(PLAYER_COLLISION_HEIGHT_RATIO).toBe(0.5);
  });

  it('uses a narrower lower-body collision width than the displayed character', () => {
    expect(PLAYER_COLLISION_WIDTH_RATIO).toBe(0.45);
  });

  it('derives lower-body collision size from the displayed player size', () => {
    expect(getPlayerLowerBodyCollisionSize(56)).toEqual({
      width: 30.240000000000002,
      height: 67.2,
    });
  });

  it('samples only the lower half above the foot anchor', () => {
    const samples = getPlayerLowerBodyCollisionSamplePoints({ x: 100, y: 200 }, 56);

    expect(samples).toEqual([
      { x: 100, y: 200 },
      { x: 84.88, y: 183.2 },
      { x: 115.12, y: 183.2 },
      { x: 84.88, y: 166.4 },
      { x: 115.12, y: 166.4 },
      { x: 84.88, y: 132.8 },
      { x: 115.12, y: 132.8 },
    ]);
  });
});
```

- [ ] **Step 2: Run the failing collision geometry tests**

Run:

```bash
npm test -- src/game/playerCollision.test.ts
```

Expected: fail because `src/game/playerCollision.ts` does not exist.

- [ ] **Step 3: Implement lower-body collision geometry**

Create `src/game/playerCollision.ts`:

```ts
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
```

- [ ] **Step 4: Run collision geometry tests**

Run:

```bash
npm test -- src/game/playerCollision.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit collision geometry helper**

```bash
git add src/game/playerCollision.ts src/game/playerCollision.test.ts
git commit -m "feat: add lower body player collision geometry"
```

---

### Task 3: State Lower-Body Collision Integration

**Files:**
- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`

- [ ] **Step 1: Write failing state tests for lower-body collision**

Add `isPlayerWalkableWorldPosition` to the import from `./state` in `src/game/state.test.ts`.

Append these tests inside the existing `describe('game state', () => {` block before the victory tests:

```ts
  it('blocks movement when a lower-body sample point enters a wall', () => {
    const state = createGameState(17);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: 0 }));

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    const candidate = { x: 28, y: 0 };

    expect(isPlayerWalkableWorldPosition(state, candidate)).toBe(false);
    movePlayerByWorldDelta(state, candidate);
    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('allows upper-body visual overlap when lower-body samples remain walkable', () => {
    const state = createGameState(18);
    const upperWall = state.maze.cells.get(getHexKey({ q: 0, r: -1 }));

    expect(upperWall).toBeDefined();
    upperWall!.type = 'wall';
    upperWall!.revealed = true;

    state.player.coord = { q: 0, r: 1 };
    state.player.worldPosition = { x: 0, y: 55 };
    const candidate = { x: 10, y: 55 };

    expect(isPlayerWalkableWorldPosition(state, candidate)).toBe(true);
    movePlayerByWorldDelta(state, { x: 10, y: 0 });
    expect(state.player.worldPosition.x).toBeCloseTo(10, 6);
    expect(state.player.worldPosition.y).toBeCloseTo(55, 6);
  });
```

- [ ] **Step 2: Run the failing state tests**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: fail because `isPlayerWalkableWorldPosition` is not exported and movement still checks only the foot-anchor hex.

- [ ] **Step 3: Integrate lower-body collision in state movement**

Modify imports in `src/game/state.ts`:

```ts
import { getPlayerLowerBodyCollisionSamplePoints } from './playerCollision';
```

Add this exported helper after `isPlayerWalkableCoord`:

```ts
export function isPlayerWalkableWorldPosition(state: GameState, worldPosition: PixelPoint): boolean {
  return getPlayerBlockedCoord(state, worldPosition) === null;
}

function getPlayerBlockedCoord(state: GameState, worldPosition: PixelPoint): AxialCoord | null {
  for (const sample of getPlayerLowerBodyCollisionSamplePoints(worldPosition, MAP_HEX_SIZE)) {
    const coord = pixelToAxial(sample, MAP_HEX_SIZE);

    if (!isPlayerWalkableCoord(state, coord)) {
      return coord;
    }
  }

  return null;
}
```

Replace `applyPlayerWorldPosition` with:

```ts
function applyPlayerWorldPosition(state: GameState, worldPosition: PixelPoint): boolean {
  if (state.status === 'victory' || !isPlayerWalkableWorldPosition(state, worldPosition)) {
    return false;
  }

  const coord = pixelToAxial(worldPosition, MAP_HEX_SIZE);

  state.player.worldPosition = { ...worldPosition };
  state.player.coord = coord;

  const target = state.maze.cells.get(getHexKey(coord));

  if (target?.type === 'exit') {
    state.status = 'victory';
  }

  return true;
}
```

In `applyPlayerMovementStep`, replace:

```ts
  const blockedCoord = pixelToAxial(fullCandidate, MAP_HEX_SIZE);
```

with:

```ts
  const blockedCoord = getPlayerBlockedCoord(state, fullCandidate);

  if (!blockedCoord) {
    return;
  }
```

Keep the existing `getBlockedEdgeSlideStep` call after this guard.

- [ ] **Step 4: Run state tests**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit state collision integration**

```bash
git add src/game/state.ts src/game/state.test.ts
git commit -m "feat: use lower body player collision"
```

---

### Task 4: Phaser Player Sprite Rendering

**Files:**
- Modify: `src/game/GameScene.ts`

- [ ] **Step 1: Update scene imports**

In `src/game/GameScene.ts`, add imports from `playerSprites.ts`:

```ts
import {
  getPlayerDirectionForVector,
  getPlayerSpriteDisplaySize,
  PLAYER_SPRITE_ASSETS,
  type PlayerDirection,
} from './playerSprites';
```

- [ ] **Step 2: Replace player graphics field with persistent image state**

Replace:

```ts
  private playerGraphics!: Phaser.GameObjects.Graphics;
```

with:

```ts
  private playerImage!: Phaser.GameObjects.Image;
```

Add this field near `heldMovementDirections`:

```ts
  private lastPlayerDirection: PlayerDirection = 'front';
```

- [ ] **Step 3: Preload player sprite assets**

In `preload`, after the tile asset loop, add:

```ts
    for (const asset of Object.values(PLAYER_SPRITE_ASSETS)) {
      this.load.image(asset.key, asset.path);
    }
```

- [ ] **Step 4: Create the player image**

In `create`, replace:

```ts
    this.playerGraphics = this.add.graphics().setDepth(DEPTHS.player);
```

with:

```ts
    this.playerImage = this.add
      .image(0, 0, PLAYER_SPRITE_ASSETS[this.lastPlayerDirection].key)
      .setDepth(DEPTHS.player)
      .setOrigin(0.5, 1);
```

- [ ] **Step 5: Update facing direction from movement vector**

In `updatePlayerMovement`, after `const vector = getMovementVector(this.heldMovementDirections);`, add:

```ts
    const direction = getPlayerDirectionForVector(vector);

    if (direction) {
      this.lastPlayerDirection = direction;
    }
```

Keep the existing zero-vector early return after this block.

- [ ] **Step 6: Render the player image at bottom-center anchor**

Replace `drawPlayer` with:

```ts
  private drawPlayer(): void {
    const center = {
      x: this.scale.width / 2,
      y: this.scale.height / 2,
    };
    const displaySize = getPlayerSpriteDisplaySize(this.hexSize);

    this.playerImage
      .setTexture(PLAYER_SPRITE_ASSETS[this.lastPlayerDirection].key)
      .setPosition(center.x, center.y)
      .setDisplaySize(displaySize.width, displaySize.height)
      .setVisible(true);
  }
```

In `renderScene`, replace the guard:

```ts
    if (!this.mapGraphics || !this.wallGraphics || !this.playerGraphics || !this.combatGraphics) {
      return;
    }
```

with:

```ts
    if (!this.mapGraphics || !this.wallGraphics || !this.playerImage || !this.combatGraphics) {
      return;
    }
```

- [ ] **Step 7: Build scene code**

Run:

```bash
npm run build
```

Expected: pass. If TypeScript reports `playerGraphics` still exists, remove the leftover reference. If Phaser build reports missing image assets, verify the eight `.webp` files exist under `public/assets/player/doubao/`.

- [ ] **Step 8: Commit scene rendering integration**

Because `src/game/GameScene.ts` already has unrelated uncommitted wall/tile rendering changes, review the staged diff before committing:

```bash
git add src/game/GameScene.ts
git diff --cached -- src/game/GameScene.ts
git commit -m "feat: render directional player sprite"
```

Expected: the commit includes the player sprite rendering changes and preserves the current wall/tile rendering work in the same file. Do not stage `.superpowers/`.

---

### Task 5: Full Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: all test files pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start or reuse local dev server**

Run:

```bash
npm run dev -- --port 5173
```

Expected: Vite prints a local URL. If port `5173` is already used, use the alternative port Vite prints.

- [ ] **Step 4: Manual game checks**

Open the Vite URL and verify:

- The player appears as the Doubao character sprite, not a blue circle.
- Moving down shows `front.webp`.
- Moving right shows the visually right-facing sprite sourced from `left.webp`.
- Moving left shows the visually left-facing sprite sourced from `right.webp`.
- Moving diagonally shows the corrected diagonal sprite.
- Releasing keys keeps the last movement direction.
- Upper body can visually overlap walls.
- Lower half cannot enter walls, covered cells, living monster nests, or outside-map space.
- Pushing into the upper-right sloped wall still slides the player downward.

---

## Self-Review Notes

- Spec coverage: the plan covers asset extraction from zip, corrected left/right mapping, 8-direction vector mapping, idle facing retention, persistent Phaser image rendering, bottom-center anchor, display scaling, lower 50% collision, multi-point sample validation, sloped-wall sliding preservation, and manual verification.
- Type consistency: `PlayerDirection`, `PLAYER_SPRITE_ASSETS`, `getPlayerDirectionForVector`, `getPlayerSpriteDisplaySize`, `getPlayerLowerBodyCollisionSamplePoints`, and `isPlayerWalkableWorldPosition` are introduced before use.
- Scope: walking animation frames, attack animation, hit reactions, inventory, and mouse movement remain out of scope.
