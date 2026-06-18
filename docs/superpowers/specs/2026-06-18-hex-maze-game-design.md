# Hex Maze Game Design

## Overview

Build a browser game with Vite, TypeScript, and Phaser. The game has two screens:

1. A welcome screen with a start button.
2. A game screen with a top information bar and a lower Phaser map area.

The player explores a hidden hex-grid maze. The maze is generated completely at game start, but most cells begin covered. Long-pressing a covered cell reveals its real type. The player starts in the center of the map and must find and reach the exit.

The visual perspective is a flat top-down view. Hex cells are rendered as regular flat hexagons, not angled or isometric tiles.

## Core Rules

- The map is a radius-6 hex grid using axial coordinates.
- Total cell count is 127.
- The player starts at the center cell `(0, 0)`.
- The center cell and the six neighboring cells start revealed.
- Those seven starting cells must always be empty walkable cells.
- All other cells start covered.
- Covered cells already have fixed generated types. Revealing a cell never rerolls its type.
- Cell types for the first version are:
  - Covered
  - Empty
  - Wall
  - Exit
- The player can move only onto revealed empty cells or the revealed exit cell.
- The player cannot move onto covered cells or wall cells.
- Reaching the exit wins the game.

## Maze Generation

The maze must always be solvable.

At game start, generate the full hidden map in this order:

1. Create all radius-6 axial hex cells.
2. Mark the center and distance-1 neighbor ring as the safe starting area.
3. Pick one outer-ring cell as the exit.
4. Generate a guaranteed walkable path from the starting area to the exit.
5. Mark all path cells as empty.
6. Fill remaining non-protected cells with empty or wall types.

The first version should use a wall ratio around 35 percent for non-path, non-starting, non-exit cells. The exact ratio can be tuned after seeing the game feel.

The exit starts covered unless it happens to be inside the starting area, which should not happen because it is selected from the outer ring.

## Game Screen Layout

The game screen is split vertically:

- Top information area: fixed-height status bar.
- Bottom map area: Phaser canvas.

The information area displays:

- Total cells, for example `127`
- Revealed cells, for example `7 / 127`
- Player HP, initially `100`
- Player attack, initially `10`
- Current game state, for example exploring or victory

HP and attack are shown in the first version as player stats, but enemies and combat are out of scope for this first version.

## Input And Interaction

Movement:

- Support `WASD`.
- Support arrow keys.
- Each key press moves the player one neighboring hex cell.
- Movement fails if the target cell is outside the map, covered, or a wall.
- Movement onto the exit cell triggers victory.

Reveal:

- The player can long-press a covered cell to reveal it.
- First version long-press duration is 600 ms.
- Show simple hold progress feedback while pressing.
- Revealing updates the top information area.

The first version uses a fixed camera that keeps the full radius-6 map visible. Camera panning and zooming can be added later if needed.

## Visual Design

The game uses a clean top-down board-game style:

- Covered cells use one consistent hidden color.
- Empty cells use a lighter walkable color.
- Wall cells use a darker blocked color.
- The exit cell uses a distinct color or small icon after reveal.
- The player is a simple top-down marker centered in the current hex.

The map is centered in the lower game area. Cell sizes should be chosen so the full radius-6 grid fits on common desktop screens, with responsive scaling for smaller viewports.

## Code Structure

Planned files:

- `src/main.ts`: application entry, screen switching, Phaser bootstrapping.
- `src/game/GameScene.ts`: Phaser scene, rendering, input, animation, and scene events.
- `src/game/hex.ts`: axial coordinates, hex distance, neighbors, and screen position conversion.
- `src/game/maze.ts`: solvable hidden maze generation.
- `src/game/state.ts`: cell state, player stats, counters, and victory state.
- `src/styles.css`: welcome screen, game screen, status bar, and canvas layout.

The Phaser scene should emit state updates to the DOM layer so the top information bar can refresh without duplicating game logic.

## Verification

Manual checks:

- The welcome screen appears first.
- Clicking start opens the game screen.
- The game screen has a top information area and a lower map area.
- Total cells displays 127.
- Initial revealed count displays 7.
- The center cell and its six neighbors are revealed and empty.
- Covered cells reveal by long press.
- Movement works with `WASD` and arrow keys.
- The player cannot enter covered cells or walls.
- A path from the starting area to the exit exists in generated maps.
- Reaching the revealed exit shows the victory state.

Automated or implementation-level checks:

- Hex grid generation returns 127 cells for radius 6.
- The starting safe area contains exactly seven cells.
- Safe starting cells are empty and revealed.
- The exit is on the outer ring.
- Generated maps always contain a walkable path from the starting area to the exit.
