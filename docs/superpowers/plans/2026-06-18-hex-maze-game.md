# Hex Maze Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable top-down Phaser hex-maze exploration game with a welcome screen, status bar, hidden solvable maze, long-press reveal, keyboard movement, and win condition.

**Architecture:** Use Vite and TypeScript for the browser app, Phaser 3 for the canvas game scene, and a small DOM shell for the welcome screen and top game information bar. Keep pure game logic in testable modules (`hex.ts`, `maze.ts`, `state.ts`) and keep Phaser-specific rendering/input in `GameScene.ts`.

**Tech Stack:** Vite 8, TypeScript 6, Phaser 3.90, Vitest 4.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `tsconfig.json`: TypeScript compiler settings.
- `index.html`: app mount point.
- `src/vite-env.d.ts`: Vite type declarations.
- `src/styles.css`: welcome screen, game screen, status bar, and map area layout.
- `src/main.ts`: DOM lifecycle, welcome-to-game transition, Phaser boot, status bar updates.
- `src/game/hex.ts`: axial coordinates, map generation, neighbors, distances, and top-down pixel conversion.
- `src/game/hex.test.ts`: unit tests for hex math.
- `src/game/maze.ts`: solvable hidden maze generation.
- `src/game/maze.test.ts`: unit tests for maze invariants and solvability.
- `src/game/state.ts`: gameplay state transitions for reveal, movement, counters, and victory.
- `src/game/state.test.ts`: unit tests for movement/reveal/win rules.
- `src/game/GameScene.ts`: Phaser rendering, keyboard input, pointer long-press reveal, and scene events.

## Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/styles.css`
- Create: `src/main.ts`

- [ ] **Step 1: Create npm package and scripts**

Create `package.json`:

```json
{
  "name": "td_ctfcat",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^6.0.3",
    "vite": "^8.0.16",
    "vitest": "^4.1.9"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create HTML mount point**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hex Maze Escape</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: Add minimal Vite and app files**

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Create `src/main.ts`:

```ts
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount element');
}

app.innerHTML = `
  <main class="welcome-screen">
    <section class="welcome-panel">
      <p class="eyebrow">Hex Maze</p>
      <h1>蜂窝迷宫逃脱</h1>
      <button id="start-game" class="primary-button" type="button">开始游戏</button>
    </section>
  </main>
`;
```

Create `src/styles.css`:

```css
:root {
  color: #172018;
  background: #eef4e8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button {
  font: inherit;
}

#app {
  min-height: 100vh;
}

.welcome-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(rgba(238, 244, 232, 0.88), rgba(238, 244, 232, 0.88)),
    repeating-linear-gradient(30deg, #d6e3cc 0 2px, transparent 2px 34px);
}

.welcome-panel {
  width: min(460px, 100%);
  display: grid;
  gap: 20px;
  justify-items: center;
  text-align: center;
}

.eyebrow {
  margin: 0;
  color: #65705c;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.5rem, 9vw, 5rem);
  line-height: 1;
}

.primary-button {
  min-height: 48px;
  padding: 0 24px;
  border: 0;
  border-radius: 6px;
  color: #fff;
  background: #256d45;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:hover {
  background: #1c5b39;
}
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 6: Verify scaffold builds**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete without errors.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.json index.html src/vite-env.d.ts src/main.ts src/styles.css
git commit -m "chore: scaffold vite phaser app"
```

### Task 2: Hex Grid Math

**Files:**
- Create: `src/game/hex.test.ts`
- Create: `src/game/hex.ts`

- [ ] **Step 1: Write failing hex tests**

Create `src/game/hex.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  HEX_DIRECTIONS,
  axialDistance,
  axialToPixel,
  createHexGrid,
  getHexKey,
  getNeighbors,
} from './hex';

describe('hex grid helpers', () => {
  it('creates 127 cells for radius 6', () => {
    expect(createHexGrid(6)).toHaveLength(127);
  });

  it('uses stable coordinate keys', () => {
    expect(getHexKey({ q: -2, r: 5 })).toBe('-2,5');
  });

  it('calculates axial distances from the center', () => {
    expect(axialDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    expect(axialDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
    expect(axialDistance({ q: 0, r: 0 }, { q: 3, r: -2 })).toBe(3);
  });

  it('returns six neighboring coordinates', () => {
    expect(HEX_DIRECTIONS).toHaveLength(6);
    expect(getNeighbors({ q: 0, r: 0 })).toEqual([
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ]);
  });

  it('converts flat-top axial coordinates to pixel positions', () => {
    expect(axialToPixel({ q: 0, r: 0 }, 24)).toEqual({ x: 0, y: 0 });
    expect(axialToPixel({ q: 1, r: 0 }, 24)).toEqual({
      x: 36,
      y: 20.784609690826528,
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/game/hex.test.ts
```

Expected: FAIL because `src/game/hex.ts` does not exist.

- [ ] **Step 3: Implement hex helpers**

Create `src/game/hex.ts` with exported `AxialCoord`, `HEX_DIRECTIONS`, `getHexKey`, `axialDistance`, `getNeighbors`, `createHexGrid`, and `axialToPixel`. Use flat-top axial layout:

```ts
export interface AxialCoord {
  q: number;
  r: number;
}

export const HEX_DIRECTIONS: readonly AxialCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getHexKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

export function axialDistance(a: AxialCoord, b: AxialCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

export function getNeighbors(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map((direction) => ({
    q: coord.q + direction.q,
    r: coord.r + direction.r,
  }));
}

export function createHexGrid(radius: number): AxialCoord[] {
  const cells: AxialCoord[] = [];

  for (let q = -radius; q <= radius; q += 1) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);

    for (let r = rMin; r <= rMax; r += 1) {
      cells.push({ q, r });
    }
  }

  return cells;
}

export function axialToPixel(coord: AxialCoord, size: number): { x: number; y: number } {
  return {
    x: size * 1.5 * coord.q,
    y: size * Math.sqrt(3) * (coord.r + coord.q / 2),
  };
}
```

- [ ] **Step 4: Run hex tests**

Run:

```bash
npm test -- src/game/hex.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit hex helpers**

Run:

```bash
git add src/game/hex.ts src/game/hex.test.ts
git commit -m "feat: add hex grid helpers"
```

### Task 3: Solvable Maze Generation

**Files:**
- Create: `src/game/maze.test.ts`
- Create: `src/game/maze.ts`

- [ ] **Step 1: Write failing maze tests**

Create `src/game/maze.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { axialDistance, getHexKey, getNeighbors } from './hex';
import { generateMaze, type MazeCell } from './maze';

function hasPathToExit(cells: Map<string, MazeCell>, startKey: string, exitKey: string): boolean {
  const queue = [startKey];
  const visited = new Set(queue);

  while (queue.length > 0) {
    const currentKey = queue.shift();
    if (!currentKey) {
      continue;
    }
    if (currentKey === exitKey) {
      return true;
    }

    const current = cells.get(currentKey);
    if (!current) {
      continue;
    }

    for (const neighbor of getNeighbors(current.coord)) {
      const neighborKey = getHexKey(neighbor);
      const neighborCell = cells.get(neighborKey);
      if (!neighborCell || visited.has(neighborKey) || neighborCell.type === 'wall') {
        continue;
      }
      visited.add(neighborKey);
      queue.push(neighborKey);
    }
  }

  return false;
}

describe('generateMaze', () => {
  it('creates a radius 6 maze with 127 cells and 7 revealed safe cells', () => {
    const maze = generateMaze({ radius: 6, seed: 1 });
    const revealedCells = [...maze.cells.values()].filter((cell) => cell.revealed);

    expect(maze.radius).toBe(6);
    expect(maze.cells.size).toBe(127);
    expect(revealedCells).toHaveLength(7);
    expect(maze.totalCells).toBe(127);
    expect(maze.revealedCount).toBe(7);
  });

  it('keeps center and neighbor ring revealed and empty', () => {
    const maze = generateMaze({ radius: 6, seed: 2 });
    const safeCells = [...maze.cells.values()].filter(
      (cell) => axialDistance(cell.coord, { q: 0, r: 0 }) <= 1,
    );

    expect(safeCells).toHaveLength(7);
    expect(safeCells.every((cell) => cell.revealed && cell.type === 'empty')).toBe(true);
  });

  it('places the exit on the outer ring and keeps it initially covered', () => {
    const maze = generateMaze({ radius: 6, seed: 3 });
    const exit = maze.cells.get(maze.exitKey);

    expect(exit).toBeDefined();
    expect(exit?.type).toBe('exit');
    expect(exit?.revealed).toBe(false);
    expect(exit ? axialDistance(exit.coord, { q: 0, r: 0 }) : 0).toBe(6);
  });

  it('always leaves a walkable path from start to exit across seeded maps', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const maze = generateMaze({ radius: 6, seed });
      expect(hasPathToExit(maze.cells, maze.startKey, maze.exitKey)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/game/maze.test.ts
```

Expected: FAIL because `src/game/maze.ts` does not exist.

- [ ] **Step 3: Implement maze generation**

Create `src/game/maze.ts` with:

```ts
import {
  type AxialCoord,
  axialDistance,
  createHexGrid,
  getHexKey,
  getNeighbors,
} from './hex';

export type CellType = 'empty' | 'wall' | 'exit';

export interface MazeCell {
  coord: AxialCoord;
  key: string;
  type: CellType;
  revealed: boolean;
}

export interface MazeData {
  radius: number;
  cells: Map<string, MazeCell>;
  startKey: string;
  exitKey: string;
  totalCells: number;
  revealedCount: number;
}

export interface GenerateMazeOptions {
  radius?: number;
  wallRatio?: number;
  seed?: number;
}

function createRandom(seed = Date.now()): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickRandom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function buildPathToExit(exit: AxialCoord): AxialCoord[] {
  const path: AxialCoord[] = [{ q: 0, r: 0 }];
  let current: AxialCoord = { q: 0, r: 0 };

  while (current.q !== exit.q || current.r !== exit.r) {
    const candidates = getNeighbors(current)
      .filter((candidate) => axialDistance(candidate, exit) < axialDistance(current, exit))
      .sort((a, b) => axialDistance(a, exit) - axialDistance(b, exit));
    current = candidates[0];
    path.push(current);
  }

  return path;
}

export function generateMaze(options: GenerateMazeOptions = {}): MazeData {
  const radius = options.radius ?? 6;
  const wallRatio = options.wallRatio ?? 0.35;
  const random = createRandom(options.seed);
  const coords = createHexGrid(radius);
  const startKey = getHexKey({ q: 0, r: 0 });
  const outerRing = coords.filter((coord) => axialDistance(coord, { q: 0, r: 0 }) === radius);
  const exitCoord = pickRandom(outerRing, random);
  const exitKey = getHexKey(exitCoord);
  const protectedKeys = new Set<string>();

  for (const coord of coords) {
    if (axialDistance(coord, { q: 0, r: 0 }) <= 1) {
      protectedKeys.add(getHexKey(coord));
    }
  }

  for (const coord of buildPathToExit(exitCoord)) {
    protectedKeys.add(getHexKey(coord));
  }

  protectedKeys.add(exitKey);

  const cells = new Map<string, MazeCell>();

  for (const coord of coords) {
    const key = getHexKey(coord);
    const safeStart = axialDistance(coord, { q: 0, r: 0 }) <= 1;
    const isExit = key === exitKey;
    const type: CellType = isExit
      ? 'exit'
      : protectedKeys.has(key) || random() > wallRatio
        ? 'empty'
        : 'wall';

    cells.set(key, {
      coord,
      key,
      type,
      revealed: safeStart,
    });
  }

  return {
    radius,
    cells,
    startKey,
    exitKey,
    totalCells: cells.size,
    revealedCount: [...cells.values()].filter((cell) => cell.revealed).length,
  };
}
```

- [ ] **Step 4: Run maze tests**

Run:

```bash
npm test -- src/game/maze.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit maze generation**

Run:

```bash
git add src/game/maze.ts src/game/maze.test.ts
git commit -m "feat: generate solvable hex maze"
```

### Task 4: Game State Rules

**Files:**
- Create: `src/game/state.test.ts`
- Create: `src/game/state.ts`

- [ ] **Step 1: Write failing state tests**

Create `src/game/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createGameState, movePlayer, revealCell } from './state';

describe('game state', () => {
  it('starts at center with fixed stats and counters', () => {
    const state = createGameState(7);

    expect(state.player.coord).toEqual({ q: 0, r: 0 });
    expect(state.player.hp).toBe(100);
    expect(state.player.attack).toBe(10);
    expect(state.stats.totalCells).toBe(127);
    expect(state.stats.revealedCells).toBe(7);
    expect(state.status).toBe('exploring');
  });

  it('reveals a covered cell once', () => {
    const state = createGameState(8);
    const covered = [...state.maze.cells.values()].find((cell) => !cell.revealed && cell.type !== 'wall');
    expect(covered).toBeDefined();

    const first = revealCell(state, covered?.key ?? '');
    const second = revealCell(first, covered?.key ?? '');

    expect(first.maze.cells.get(covered?.key ?? '')?.revealed).toBe(true);
    expect(first.stats.revealedCells).toBe(8);
    expect(second.stats.revealedCells).toBe(8);
  });

  it('does not move into covered cells', () => {
    const state = createGameState(9);
    const result = movePlayer(state, { q: 1, r: 0 });

    expect(result.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('moves into revealed empty neighbor cells', () => {
    const state = createGameState(10);
    const result = movePlayer(state, { q: 1, r: 0 });

    expect(result.player.coord).toEqual({ q: 1, r: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: FAIL because `src/game/state.ts` does not exist.

- [ ] **Step 3: Implement state transitions**

Create `src/game/state.ts` with:

```ts
import { type AxialCoord, axialDistance, getHexKey } from './hex';
import { generateMaze, type MazeData } from './maze';

export type GameStatus = 'exploring' | 'victory';

export interface PlayerState {
  coord: AxialCoord;
  hp: number;
  attack: number;
}

export interface GameStats {
  totalCells: number;
  revealedCells: number;
}

export interface GameState {
  maze: MazeData;
  player: PlayerState;
  stats: GameStats;
  status: GameStatus;
}

function cloneMaze(maze: MazeData): MazeData {
  return {
    ...maze,
    cells: new Map([...maze.cells.entries()].map(([key, cell]) => [key, { ...cell }])),
  };
}

function countRevealed(maze: MazeData): number {
  return [...maze.cells.values()].filter((cell) => cell.revealed).length;
}

export function createGameState(seed?: number): GameState {
  const maze = generateMaze({ radius: 6, seed });

  return {
    maze,
    player: {
      coord: { q: 0, r: 0 },
      hp: 100,
      attack: 10,
    },
    stats: {
      totalCells: maze.totalCells,
      revealedCells: maze.revealedCount,
    },
    status: 'exploring',
  };
}

export function revealCell(state: GameState, key: string): GameState {
  const maze = cloneMaze(state.maze);
  const cell = maze.cells.get(key);

  if (!cell || cell.revealed) {
    return state;
  }

  cell.revealed = true;
  maze.revealedCount = countRevealed(maze);

  return {
    ...state,
    maze,
    stats: {
      ...state.stats,
      revealedCells: maze.revealedCount,
    },
  };
}

export function movePlayer(state: GameState, coord: AxialCoord): GameState {
  if (state.status === 'victory' || axialDistance(state.player.coord, coord) !== 1) {
    return state;
  }

  const target = state.maze.cells.get(getHexKey(coord));

  if (!target || !target.revealed || target.type === 'wall') {
    return state;
  }

  return {
    ...state,
    player: {
      ...state.player,
      coord,
    },
    status: target.type === 'exit' ? 'victory' : state.status,
  };
}
```

- [ ] **Step 4: Run state tests**

Run:

```bash
npm test -- src/game/state.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all logic tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit state rules**

Run:

```bash
git add src/game/state.ts src/game/state.test.ts
git commit -m "feat: add hex maze game state"
```

### Task 5: Phaser Scene

**Files:**
- Create: `src/game/GameScene.ts`
- Modify: `src/game/state.ts`

- [ ] **Step 1: Add mutable scene adapter functions to state**

Modify `src/game/state.ts` to export `getGameSummary(state)`:

```ts
export interface GameSummary {
  totalCells: number;
  revealedCells: number;
  hp: number;
  attack: number;
  status: GameStatus;
}

export function getGameSummary(state: GameState): GameSummary {
  return {
    totalCells: state.stats.totalCells,
    revealedCells: state.stats.revealedCells,
    hp: state.player.hp,
    attack: state.player.attack,
    status: state.status,
  };
}
```

- [ ] **Step 2: Create Phaser scene**

Create `src/game/GameScene.ts` with a scene that:

- Creates `GameState` in `create()`.
- Calculates a responsive hex size from canvas width and height.
- Renders every cell with a `Phaser.GameObjects.Graphics` polygon.
- Renders covered, empty, wall, and exit colors.
- Renders player as a centered circle.
- Handles arrow keys and `WASD`.
- Starts a 600 ms hold timer on pointer down over a covered cell.
- Reveals the cell when the hold timer completes.
- Emits `state-changed` through `this.game.events.emit('state-changed', getGameSummary(this.state))`.
- Emits `victory` when player reaches the exit.

Use these constants inside the scene:

```ts
const HOLD_DURATION_MS = 600;
const COLORS = {
  covered: 0x6f776b,
  empty: 0xdfe8d2,
  wall: 0x2b3029,
  exit: 0xd69732,
  stroke: 0xffffff,
  player: 0x2f6fed,
  hold: 0x46b36d,
};
```

- [ ] **Step 3: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit Phaser scene**

Run:

```bash
git add src/game/GameScene.ts src/game/state.ts
git commit -m "feat: add phaser hex maze scene"
```

### Task 6: DOM Shell And Status Bar

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Wire start button to game screen**

Replace the welcome-only `src/main.ts` with code that:

- Imports Phaser and `GameScene`.
- Renders the welcome screen first.
- On start click, renders the game shell.
- Creates a Phaser game inside `#game-container`.
- Updates `#total-cells`, `#revealed-cells`, `#player-hp`, `#player-attack`, and `#game-status` from scene events.
- Destroys the old Phaser game before starting a new one.

- [ ] **Step 2: Add final layout styles**

Update `src/styles.css` to include:

- Full-height app shell.
- Fixed-height top status bar.
- Lower map area with `#game-container` filling available space.
- Responsive status cells that do not overflow on mobile.
- Victory status styling.

- [ ] **Step 3: Run full checks**

Run:

```bash
npm test
npm run build
```

Expected: both commands PASS.

- [ ] **Step 4: Commit DOM shell**

Run:

```bash
git add src/main.ts src/styles.css
git commit -m "feat: add game shell and status bar"
```

### Task 7: Final Verification

**Files:**
- Modify only if verification exposes a concrete issue.

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL.

- [ ] **Step 2: Browser verification**

Open the local URL and verify:

- Welcome screen appears first.
- Start button opens the game.
- Top bar displays total cells, revealed count, HP, attack, and status.
- Total cells is 127.
- Initial revealed count is 7.
- Map is a flat top-down hex grid.
- Center and six neighbors are visible empty cells.
- Long-press reveals a covered cell.
- Arrow keys and `WASD` move the player.
- Player cannot enter covered or wall cells.
- Player can enter revealed empty cells.
- Reaching the revealed exit shows victory.

- [ ] **Step 3: Stop dev server**

Stop the Vite process after verification.

- [ ] **Step 4: Commit verification fixes**

If fixes were required, run:

```bash
git add src package.json package-lock.json tsconfig.json index.html
git commit -m "fix: polish hex maze gameplay"
```

If no fixes were required, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers the two screens, top status bar, bottom Phaser map, radius-6 hex grid, 127 cells, starting safe area, hidden pre-generated solvable maze, long-press reveal, keyboard movement, blocked covered/wall cells, player HP/attack display, top-down visuals, and victory on reaching the exit.
- Marker scan: The plan contains no reserved marker strings and no intentionally vague implementation tasks.
- Type consistency: `AxialCoord`, `MazeCell`, `MazeData`, `GameState`, `GameSummary`, `generateMaze`, `createGameState`, `revealCell`, and `movePlayer` use consistent names across tasks.
