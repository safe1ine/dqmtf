# Connected Wall Overlays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render revealed walls as connected stone-fence overlays on top of the standard empty tile background.

**Architecture:** Keep tile background selection in `src/game/tileRendering.ts`, and add pure helper logic that calculates revealed neighboring wall connections using the existing hex direction order. Keep Phaser drawing in `src/game/GameScene.ts`: draw every revealed cell with the empty stone texture, then layer wall/special-cell overlays above it.

**Tech Stack:** TypeScript, Phaser Graphics, Vitest.

---

### Task 1: Tile Background And Wall Connection Logic

**Files:**
- Modify: `src/game/tileRendering.ts`
- Modify: `src/game/tileRendering.test.ts`

- [ ] **Step 1: Write failing tests**

Add expectations that wall, exit, and monster nest cells use `TILE_ASSETS.emptyStone.key` as their base texture. Add a test for `getRevealedWallConnections(centerWall, cells)` returning six booleans in `HEX_DIRECTIONS` order, with `true` only for neighboring cells that are both `revealed` and `type === 'wall'`.

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- src/game/tileRendering.test.ts`

Expected: fail because walls still use `wallStone`, special cells still use `fill`, and `getRevealedWallConnections` does not exist.

- [ ] **Step 3: Implement minimal logic**

In `src/game/tileRendering.ts`, update `getCellTileVisual()` so all revealed cells return `emptyStone` as their background texture unless an unlock animation overrides them. Export:

```ts
export type WallConnections = readonly boolean[];

export function getRevealedWallConnections(
  cell: MazeCell,
  cells: ReadonlyMap<string, MazeCell>,
): WallConnections;
```

Use `HEX_DIRECTIONS` and `getHexKey` to inspect neighbors. Connect only to revealed wall neighbors.

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- src/game/tileRendering.test.ts`

Expected: pass.

### Task 2: Phaser Overlay Rendering

**Files:**
- Modify: `src/game/GameScene.ts`

- [ ] **Step 1: Add a wall overlay graphics layer**

Create `wallGraphics` at a depth between tile background textures and combat/player graphics. Clear it every render.

- [ ] **Step 2: Draw overlays after tile backgrounds**

For each revealed wall cell, call `getRevealedWallConnections(cell, this.state.maze.cells)` and draw a compact central stone-fence hub plus one branch toward each connected revealed wall neighbor. For revealed exit and monster nest cells, draw smaller color markers on top of the empty stone background so their gameplay meaning remains visible.

- [ ] **Step 3: Verify whole app**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and the production build completes.
