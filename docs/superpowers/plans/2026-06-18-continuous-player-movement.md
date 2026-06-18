# Continuous Player Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace keypress-to-hex movement with held-key 8-direction continuous player movement while keeping hex cells as terrain, reveal, victory, and combat boundaries.

**Architecture:** Store both a continuous world pixel position and the current containing axial hex on `PlayerEntity`. Pure helpers handle pixel-to-hex conversion, held-key vector normalization, map layout centering, and walkability-checked movement. `GameScene` reads held keyboard state each frame, asks state logic to move by a world delta, and renders the map centered on `player.worldPosition`.

**Tech Stack:** TypeScript, Vite, Phaser 3, Vitest.

---

## File Structure

- Modify `src/game/hex.ts`: add pixel-to-axial conversion and axial rounding helpers.
- Modify `src/game/hex.test.ts`: cover the inverse coordinate conversion.
- Create `src/game/movementInput.ts`: pure held-key direction mapping and vector normalization.
- Create `src/game/movementInput.test.ts`: cover WASD/arrow mapping and normalized diagonal vectors.
- Modify `src/game/entities/defaults.ts`: add `player.moveSpeed`.
- Modify `src/game/entities/PlayerEntity.ts`: add `worldPosition` and `moveSpeed`.
- Modify `src/game/entities/entities.test.ts`: cover initial continuous player movement fields.
- Modify `src/game/mapLayout.ts`: allow map layout to center on a world pixel focus.
- Modify `src/game/mapLayout.test.ts`: cover continuous focus positioning and keep legacy coordinate focus coverage.
- Modify `src/game/state.ts`: add walkability and continuous movement helpers; keep `movePlayer` for compatibility.
- Modify `src/game/state.test.ts`: cover continuous movement, blocking, substeps, victory, and existing reveal compatibility.
- Modify `src/game/GameScene.ts`: remove step movement animation, track held movement keys, move every update, and center on `player.worldPosition`.

---

### Task 1: Pixel-To-Hex Conversion

**Files:**
- Modify: `src/game/hex.ts`
- Modify: `src/game/hex.test.ts`

- [ ] **Step 1: Write failing coordinate conversion tests**

Append these tests inside `describe('hex grid helpers', () => { ... })` in `src/game/hex.test.ts`, and add `pixelToAxial` and `roundAxialCoord` to the import list:

```ts
import {
  HEX_DIRECTIONS,
  axialDistance,
  axialToPixel,
  createHexGrid,
  getHexKey,
  getNeighbors,
  pixelToAxial,
  roundAxialCoord,
} from './hex';
```

```ts
  it('rounds fractional axial coordinates to the nearest hex', () => {
    expect(roundAxialCoord({ q: 0.49, r: 0.1 })).toEqual({ q: 0, r: 0 });
    expect(roundAxialCoord({ q: 0.75, r: -0.1 })).toEqual({ q: 1, r: 0 });
    expect(roundAxialCoord({ q: 0.2, r: 0.78 })).toEqual({ q: 0, r: 1 });
  });

  it('converts flat-top pixel positions back to axial coordinates', () => {
    expect(pixelToAxial({ x: 0, y: 0 }, 24)).toEqual({ q: 0, r: 0 });
    expect(pixelToAxial(axialToPixel({ q: 1, r: 0 }, 24), 24)).toEqual({ q: 1, r: 0 });
    expect(pixelToAxial(axialToPixel({ q: -1, r: 1 }, 24), 24)).toEqual({ q: -1, r: 1 });
  });
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm test -- src/game/hex.test.ts
```

Expected: fail because `pixelToAxial` and `roundAxialCoord` are not exported.

- [ ] **Step 3: Implement pixel conversion helpers**

Add `PixelPoint`, `roundAxialCoord`, and `pixelToAxial` to `src/game/hex.ts` after `axialToPixel`:

```ts
export interface PixelPoint {
  x: number;
  y: number;
}

export function axialToPixel(coord: AxialCoord, size: number): PixelPoint {
  return {
    x: size * 1.5 * coord.q,
    y: size * Math.sqrt(3) * (coord.r + coord.q / 2),
  };
}

export function roundAxialCoord(coord: AxialCoord): AxialCoord {
  let cubeX = Math.round(coord.q);
  let cubeZ = Math.round(coord.r);
  let cubeY = Math.round(-coord.q - coord.r);

  const xDiff = Math.abs(cubeX - coord.q);
  const yDiff = Math.abs(cubeY + coord.q + coord.r);
  const zDiff = Math.abs(cubeZ - coord.r);

  if (xDiff > yDiff && xDiff > zDiff) {
    cubeX = -cubeY - cubeZ;
  } else if (yDiff > zDiff) {
    cubeY = -cubeX - cubeZ;
  } else {
    cubeZ = -cubeX - cubeY;
  }

  return {
    q: cubeX,
    r: cubeZ,
  };
}

export function pixelToAxial(point: PixelPoint, size: number): AxialCoord {
  return roundAxialCoord({
    q: ((2 / 3) * point.x) / size,
    r: ((-1 / 3) * point.x + (Math.sqrt(3) / 3) * point.y) / size,
  });
}
```

Replace the existing `axialToPixel` signature with the `PixelPoint` return type shown above instead of keeping a duplicate function.

- [ ] **Step 4: Run the coordinate conversion tests**

Run:

```bash
npm test -- src/game/hex.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/hex.ts src/game/hex.test.ts
git commit -m "feat: add pixel to hex conversion"
```

---

### Task 2: Held-Key Movement Input

**Files:**
- Create: `src/game/movementInput.ts`
- Create: `src/game/movementInput.test.ts`

- [ ] **Step 1: Write failing input tests**

Create `src/game/movementInput.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the failing input tests**

Run:

```bash
npm test -- src/game/movementInput.test.ts
```

Expected: fail because `src/game/movementInput.ts` does not exist.

- [ ] **Step 3: Implement input helpers**

Create `src/game/movementInput.ts`:

```ts
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
```

- [ ] **Step 4: Run the input tests**

Run:

```bash
npm test -- src/game/movementInput.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/movementInput.ts src/game/movementInput.test.ts
git commit -m "feat: add movement input helpers"
```

---

### Task 3: Player Continuous Position

**Files:**
- Modify: `src/game/entities/defaults.ts`
- Modify: `src/game/entities/PlayerEntity.ts`
- Modify: `src/game/entities/entities.test.ts`

- [ ] **Step 1: Write failing player entity tests**

In `src/game/entities/entities.test.ts`, add this test inside `describe('entity classes', () => { ... })`:

```ts
  it('tracks player world position and movement speed', () => {
    const player = new PlayerEntity({ id: 'player', coord: { q: 0, r: 0 } });

    expect(player.worldPosition).toEqual({ x: 0, y: 0 });
    expect(player.moveSpeed).toBe(ENTITY_DEFAULTS.player.moveSpeed);
  });
```

- [ ] **Step 2: Run the failing entity tests**

Run:

```bash
npm test -- src/game/entities/entities.test.ts
```

Expected: fail because `worldPosition` and `moveSpeed` do not exist.

- [ ] **Step 3: Add player defaults and fields**

Modify `src/game/entities/defaults.ts`:

```ts
export const ENTITY_DEFAULTS = {
  player: {
    hp: 100,
    attack: 10,
    attackRange: 3,
    attackIntervalMs: 700,
    moveSpeed: 220,
  },
  monster: {
    hp: 20,
    attack: 4,
    attackRange: 1,
    attackIntervalMs: 1000,
    wanderRadius: 2,
  },
  monsterNest: {
    hp: 120,
    attack: 0,
    attackRange: 3,
    spawnIntervalMs: 5000,
    maxMonsters: 5,
    regenPerSecond: 2,
    generationChance: 0.1,
  },
} as const;
```

Modify `src/game/entities/PlayerEntity.ts`:

```ts
import type { AxialCoord, PixelPoint } from '../hex';
import { ActorEntity } from './ActorEntity';
import { ENTITY_DEFAULTS } from './defaults';

export interface PlayerEntityOptions {
  id: string;
  coord: AxialCoord;
  worldPosition?: PixelPoint;
}

export class PlayerEntity extends ActorEntity {
  worldPosition: PixelPoint;
  readonly moveSpeed = ENTITY_DEFAULTS.player.moveSpeed;

  constructor(options: PlayerEntityOptions) {
    super({
      id: options.id,
      coord: options.coord,
      hp: ENTITY_DEFAULTS.player.hp,
      attack: ENTITY_DEFAULTS.player.attack,
      attackRange: ENTITY_DEFAULTS.player.attackRange,
      attackIntervalMs: ENTITY_DEFAULTS.player.attackIntervalMs,
    });

    this.worldPosition = options.worldPosition ? { ...options.worldPosition } : { x: 0, y: 0 };
  }
}
```

- [ ] **Step 4: Run the entity tests**

Run:

```bash
npm test -- src/game/entities/entities.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/defaults.ts src/game/entities/PlayerEntity.ts src/game/entities/entities.test.ts
git commit -m "feat: add player world position"
```

---

### Task 4: Continuous Map Centering

**Files:**
- Modify: `src/game/mapLayout.ts`
- Modify: `src/game/mapLayout.test.ts`

- [ ] **Step 1: Write failing layout tests**

In `src/game/mapLayout.test.ts`, replace the import with:

```ts
import { describe, expect, it } from 'vitest';
import { axialToPixel, getHexKey } from './hex';
import { calculateMapLayout, MAP_HEX_SIZE } from './mapLayout';
```

Replace the two interpolation tests with this continuous focus test:

```ts
  it('supports continuous world focus positions during movement', () => {
    const focusWorldPosition = {
      x: axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE).x + 12,
      y: axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE).y + 8,
    };
    const layout = calculateMapLayout({
      cells,
      focusWorldPosition,
      viewport: { width: 1440, height: 713 },
    });
    const originCenter = layout.cellCenters.get(getHexKey({ q: 0, r: 0 }));

    expect(originCenter).toEqual({
      x: 708,
      y: 348.5,
    });
  });
```

Keep the existing tests that pass `playerCoord` so backward-compatible layout centering remains covered.

- [ ] **Step 2: Run the failing layout tests**

Run:

```bash
npm test -- src/game/mapLayout.test.ts
```

Expected: fail because `focusWorldPosition` is not accepted and `interpolateAxialCoord` may still be imported by the old test file.

- [ ] **Step 3: Implement world-position focus layout**

Modify `src/game/mapLayout.ts`:

```ts
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
```

Remove `interpolateAxialCoord`; continuous movement will no longer use axial interpolation.

- [ ] **Step 4: Run the layout tests**

Run:

```bash
npm test -- src/game/mapLayout.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/mapLayout.ts src/game/mapLayout.test.ts
git commit -m "feat: center map on continuous position"
```

---

### Task 5: Walkability-Checked Continuous Movement State

**Files:**
- Modify: `src/game/state.ts`
- Modify: `src/game/state.test.ts`

- [ ] **Step 1: Write failing continuous movement state tests**

Replace the import block in `src/game/state.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { axialToPixel, getHexKey, getNeighbors } from './hex';
import { MAP_HEX_SIZE } from './mapLayout';
import {
  createGameState,
  GAME_MAP_RADIUS,
  getGameSummary,
  isPlayerWalkableCoord,
  movePlayer,
  movePlayerByWorldDelta,
  revealCell,
} from './state';
import { MonsterNestCellEntity } from './entities/cells';
```

Add these tests inside `describe('game state', () => { ... })`:

```ts
  it('starts with player world position centered at the start hex', () => {
    const state = createGameState(7);

    expect(state.player.worldPosition).toEqual(axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE));
  });

  it('moves continuously through revealed empty space and updates containing hex', () => {
    const state = createGameState(10);
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);
    const result = movePlayerByWorldDelta(state, target);

    expect(result.player.coord).toEqual({ q: 1, r: 0 });
    expect(result.player.worldPosition.x).toBeCloseTo(target.x, 6);
    expect(result.player.worldPosition.y).toBeCloseTo(target.y, 6);
  });

  it('blocks continuous movement into covered cells', () => {
    const state = createGameState(9);
    movePlayer(state, { q: 1, r: 0 });
    const coveredTarget = axialToPixel({ q: 2, r: 0 }, MAP_HEX_SIZE);

    movePlayerByWorldDelta(state, {
      x: coveredTarget.x - state.player.worldPosition.x,
      y: coveredTarget.y - state.player.worldPosition.y,
    });

    expect(state.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('blocks movement into revealed walls', () => {
    const state = createGameState(13);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: 0 }));
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    movePlayerByWorldDelta(state, target);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('blocks living monster nests and allows destroyed nests converted to empty cells', () => {
    const state = createGameState(14);
    const key = getHexKey({ q: 1, r: 0 });
    const cell = state.maze.cells.get(key);
    const nest = new MonsterNestCellEntity({
      id: `nest-${key}`,
      coord: { q: 1, r: 0 },
      key,
      revealed: true,
    });
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(cell).toBeDefined();
    cell!.type = 'monsterNest';
    cell!.revealed = true;
    state.monsterNests.set(nest.id, nest);

    expect(isPlayerWalkableCoord(state, { q: 1, r: 0 })).toBe(false);
    movePlayerByWorldDelta(state, target);
    expect(state.player.coord).toEqual({ q: 0, r: 0 });

    nest.takeDamage(nest.hp);
    state.maze.cells.set(key, nest.toMazeCell());

    expect(isPlayerWalkableCoord(state, { q: 1, r: 0 })).toBe(true);
    movePlayerByWorldDelta(state, {
      x: target.x - state.player.worldPosition.x,
      y: target.y - state.player.worldPosition.y,
    });
    expect(state.player.coord).toEqual({ q: 1, r: 0 });
  });

  it('substeps large movement deltas so the player cannot tunnel through blocked cells', () => {
    const state = createGameState(15);
    const wall = state.maze.cells.get(getHexKey({ q: 1, r: 0 }));
    const farTarget = axialToPixel({ q: 2, r: 0 }, MAP_HEX_SIZE);

    expect(wall).toBeDefined();
    wall!.type = 'wall';
    wall!.revealed = true;

    movePlayerByWorldDelta(state, farTarget);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('treats coordinates outside the maze as blocked', () => {
    const state = createGameState(15);

    expect(isPlayerWalkableCoord(state, { q: GAME_MAP_RADIUS + 1, r: 0 })).toBe(false);
  });

  it('wins after continuous movement enters a revealed exit cell', () => {
    const state = createGameState(16);
    const key = getHexKey({ q: 1, r: 0 });
    const exit = state.maze.cells.get(key);
    const target = axialToPixel({ q: 1, r: 0 }, MAP_HEX_SIZE);

    expect(exit).toBeDefined();
    exit!.type = 'exit';
    exit!.revealed = true;
    state.maze.exitKey = key;

    const result = movePlayerByWorldDelta(state, target);

    expect(result.status).toBe('victory');
    expect(result.player.coord).toEqual({ q: 1, r: 0 });
  });
```

- [ ] **Step 2: Run the failing state tests**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: fail because `isPlayerWalkableCoord` and `movePlayerByWorldDelta` do not exist.

- [ ] **Step 3: Implement continuous movement state helpers**

Modify the imports in `src/game/state.ts`:

```ts
import {
  type AxialCoord,
  type PixelPoint,
  axialDistance,
  axialToPixel,
  getHexKey,
  pixelToAxial,
} from './hex';
import { generateMaze, type MazeData } from './maze';
import { MAP_HEX_SIZE } from './mapLayout';
import { MonsterNestCellEntity } from './entities/cells';
import { MonsterEntity } from './entities/MonsterEntity';
import { PlayerEntity } from './entities/PlayerEntity';
```

Add this constant after `export const GAME_MAP_RADIUS = 10;`:

```ts
const MAX_PLAYER_MOVEMENT_STEP_PIXELS = MAP_HEX_SIZE * 0.45;
```

Update the player creation in `createGameState`:

```ts
    player: new PlayerEntity({
      id: 'player',
      coord: { q: 0, r: 0 },
      worldPosition: axialToPixel({ q: 0, r: 0 }, MAP_HEX_SIZE),
    }),
```

Replace `movePlayer` with these helpers:

```ts
export function isPlayerWalkableCoord(state: GameState, coord: AxialCoord): boolean {
  const target = state.maze.cells.get(getHexKey(coord));

  if (!target || !target.revealed) {
    return false;
  }

  if (target.type === 'monsterNest') {
    const nest = [...state.monsterNests.values()].find((candidate) => candidate.key === target.key);

    return nest ? !nest.isAlive() : false;
  }

  return target.type === 'empty' || target.type === 'exit';
}

function applyPlayerWorldPosition(state: GameState, worldPosition: PixelPoint): boolean {
  if (state.status === 'victory') {
    return false;
  }

  const coord = pixelToAxial(worldPosition, MAP_HEX_SIZE);

  if (!isPlayerWalkableCoord(state, coord)) {
    return false;
  }

  state.player.worldPosition = { ...worldPosition };
  state.player.coord = coord;

  const target = state.maze.cells.get(getHexKey(coord));

  if (target?.type === 'exit') {
    state.status = 'victory';
  }

  return true;
}

function applyPlayerMovementStep(state: GameState, step: PixelPoint): void {
  const current = state.player.worldPosition;
  const fullCandidate = {
    x: current.x + step.x,
    y: current.y + step.y,
  };

  applyPlayerWorldPosition(state, fullCandidate);
}

export function movePlayerByWorldDelta(state: GameState, delta: PixelPoint): GameState {
  if (state.status === 'victory') {
    return state;
  }

  const distance = Math.hypot(delta.x, delta.y);

  if (distance === 0) {
    return state;
  }

  const stepCount = Math.max(1, Math.ceil(distance / MAX_PLAYER_MOVEMENT_STEP_PIXELS));
  const step = {
    x: delta.x / stepCount,
    y: delta.y / stepCount,
  };

  for (let index = 0; index < stepCount; index += 1) {
    applyPlayerMovementStep(state, step);

    if (state.status === 'victory') {
      break;
    }
  }

  return state;
}

export function movePlayer(state: GameState, coord: AxialCoord): GameState {
  if (state.status === 'victory' || axialDistance(state.player.coord, coord) !== 1) {
    return state;
  }

  applyPlayerWorldPosition(state, axialToPixel(coord, MAP_HEX_SIZE));

  return state;
}
```

- [ ] **Step 4: Run the state tests**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/game/state.ts src/game/state.test.ts
git commit -m "feat: add continuous player movement state"
```

---

### Task 6: Phaser Scene Continuous Movement

**Files:**
- Modify: `src/game/GameScene.ts`

- [ ] **Step 1: Update scene imports and fields**

Modify imports in `src/game/GameScene.ts`:

```ts
import Phaser from 'phaser';
import { type AxialCoord, axialDistance } from './hex';
import { calculateMapLayout, type ScreenPoint } from './mapLayout';
import { type MazeCell } from './maze';
import { tickCombat } from './combat';
import {
  getMovementDirectionForKey,
  getMovementVector,
  type MovementDirection,
} from './movementInput';
import {
  getCellTileVisual,
  getHexTileDisplaySize,
  getUnlockAnimationVisual,
  TILE_ASSETS,
  UNLOCK_ANIMATION_TOTAL_MS,
} from './tileRendering';
import {
  createGameState,
  getGameSummary,
  movePlayerByWorldDelta,
  revealCell,
  type GameState,
} from './state';
```

Remove `MOVE_DURATION_MS`, `KEY_MOVES`, and the `MovementAnimation` interface.

Replace these fields:

```ts
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private movementAnimation: MovementAnimation | null = null;
```

with:

```ts
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private heldMovementDirections = new Set<MovementDirection>();
```

- [ ] **Step 2: Replace keyboard listener setup and teardown**

In `create`, replace the keyboard listener:

```ts
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
```

with:

```ts
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.input.keyboard?.on('keyup', this.handleKeyUp, this);
```

In `removeSceneListeners`, replace:

```ts
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
```

with:

```ts
    this.heldMovementDirections.clear();
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.input.keyboard?.off('keyup', this.handleKeyUp, this);
```

- [ ] **Step 3: Replace update and keyboard handlers**

Replace `update`, `handleKeyDown`, and the deleted movement animation methods with:

```ts
  update(time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    tickCombat(this.state, { elapsedMs: delta, nowMs: time });
    this.recordCombatEffects(time);
    this.renderScene();
    this.emitState();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const direction = getMovementDirectionForKey(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    this.heldMovementDirections.add(direction);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const direction = getMovementDirectionForKey(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    this.heldMovementDirections.delete(direction);
  }

  private updatePlayerMovement(delta: number): void {
    const vector = getMovementVector(this.heldMovementDirections);

    if (vector.x === 0 && vector.y === 0) {
      return;
    }

    this.clearHold();
    const distance = this.state.player.moveSpeed * (delta / 1000);
    movePlayerByWorldDelta(this.state, {
      x: vector.x * distance,
      y: vector.y * distance,
    });
  }
```

Delete these methods from `GameScene`:

```ts
  private updateMovementAnimation(): void
  private getRenderPlayerCoord(): AxialCoord
  private getMovementProgress(): number
```

- [ ] **Step 4: Remove movement-animation guards and center layout on world position**

In `handlePointerDown`, delete this guard:

```ts
    if (this.movementAnimation) {
      return;
    }
```

In `updateLayout`, replace:

```ts
      playerCoord: this.getRenderPlayerCoord(),
```

with:

```ts
      focusWorldPosition: this.state.player.worldPosition,
```

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: pass. If TypeScript reports unused imports or deleted names, remove the unused import or reference.

- [ ] **Step 6: Commit**

```bash
git add src/game/GameScene.ts
git commit -m "feat: use continuous movement in scene"
```

---

### Task 7: Full Verification

**Files:**
- No planned source edits unless verification exposes a defect.

- [ ] **Step 1: Run the full automated test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start the dev server for manual verification**

Run:

```bash
npm run dev -- --port 5173
```

Expected: Vite reports a local URL such as `http://localhost:5173/`. If port `5173` is occupied, use the port Vite prints.

- [ ] **Step 4: Manual checks in browser**

Open the Vite URL and verify:

- Holding `W`, `A`, `S`, `D`, or arrow keys moves continuously.
- Holding two perpendicular keys moves diagonally.
- Releasing movement keys stops without snapping to a hex center.
- The map scrolls smoothly while the player stays centered.
- The player cannot enter covered cells, walls, or living monster nests.
- Long-press reveal still works for adjacent covered cells.
- Revealing and entering the exit still triggers victory.
- Combat continues ticking while the player moves.

---

## Self-Review Notes

- Spec coverage: tasks cover continuous world position, 8-direction held input, diagonal normalization, pixel-to-hex conversion, blocked covered/wall/living nest collision, outside-map blocking through missing-cell walkability, low-frame substeps, continuous map centering, reveal adjacency through `player.coord`, victory on exit entry, and combat continuing during movement.
- Type consistency: `PixelPoint`, `MovementDirection`, `getMovementDirectionForKey`, `getMovementVector`, `isPlayerWalkableCoord`, and `movePlayerByWorldDelta` are introduced before use in later tasks.
- Scope: polygon edge collision, mouse movement, sprites, physics bodies, and combat redesign remain out of scope.
