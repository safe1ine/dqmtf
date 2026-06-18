# Continuous Player Movement Design

## Scope

Replace the current one-keypress-per-hex movement with continuous top-down movement.

The player should no longer snap from one hex center to the next. Holding `WASD` or arrow keys moves the player smoothly in 8 directions, and the player can stop anywhere inside walkable space. The hex grid remains the gameplay map: cells still control terrain, reveal adjacency, victory, monster nest blocking, and combat range.

This change is focused on player movement feel and the minimum state changes needed to support it. It does not add pathfinding, physics bodies, mouse movement, animation sprites, zooming, or new combat mechanics.

## Current Behavior

- `GameScene` listens to `keydown`.
- Each accepted key press computes one neighboring axial coordinate.
- `movePlayer` validates the target hex and immediately writes `state.player.coord`.
- `GameScene` adds a short movement animation by interpolating between axial coordinates.
- The player marker is always drawn at the center of the viewport.
- The map is re-laid out around the current or interpolated player coordinate.

This creates a smooth visual transition, but gameplay is still grid-aligned.

## Target Behavior

- Holding movement keys continuously moves the player.
- `WASD` and arrow keys both work.
- Combined keys produce diagonal movement, so 8 directions are possible.
- Diagonal movement is normalized so it is not faster than cardinal movement.
- The player can stop at non-center positions inside walkable cells.
- The player cannot move into blocked space.
- The map still scrolls around the player, so the player remains visually centered.
- Long-press reveal still works for covered cells adjacent to the player's current hex.
- Victory still triggers when the player enters the revealed exit cell.

## Movement Model

Add a continuous world position to the player in addition to the current axial cell.

The world position uses the same pixel coordinate space produced by `axialToPixel` with `MAP_HEX_SIZE`. The start position is the pixel center of axial coordinate `(0, 0)`.

Each update frame:

1. Read the currently held movement keys.
2. Convert them to a 2D direction vector.
3. Normalize diagonal input.
4. Scale by movement speed and `delta`.
5. Split unusually large frame movement into small substeps, or clamp the effective `delta`, so low frame rates cannot tunnel through blocked cells.
6. Test each candidate world position against the map.
7. Apply the candidate if the destination cell is walkable.
8. Update `player.coord` to the hex containing the final world position.

The old `MovementAnimation` state and single-step `keydown` movement flow should be removed.

## Coordinate Conversion

The existing `axialToPixel` function maps axial hex coordinates to world pixels. Continuous movement also needs the inverse: convert a world pixel position back to the nearest axial hex.

Add a small conversion helper in `hex.ts` or `mapLayout.ts`:

- Convert pixel position to fractional axial coordinates for flat-top hexes.
- Round the fractional hex to the nearest valid axial coordinate.
- Use the rounded coordinate as the player's current cell.

The conversion must be covered by focused unit tests so movement, reveal, and collision all agree on which hex contains a position.

## Collision Rules

The first version uses cell-level collision, not polygon edge collision.

A candidate position is allowed only when the hex containing that position is walkable:

- Revealed `empty` cells are walkable.
- Revealed `exit` cells are walkable.
- A destroyed monster nest that has converted to an empty cell is walkable.
- Covered cells are blocked.
- Wall cells are blocked.
- Living monster nest cells are blocked.
- Positions outside the maze are blocked.

If the full candidate movement is blocked, the implementation may try axis-separated movement as a small quality improvement: first try moving on `x` only, then on `y` only. This lets the player slide along obstacles instead of stopping completely at corners. If this creates unreliable behavior, keep the simpler all-or-nothing candidate rejection.

## Input Handling

Replace single `keydown` movement with held-key state:

- Track `keydown` and `keyup` for movement keys.
- Clear held movement state on scene shutdown.
- In `update`, compute movement every frame from held keys.
- Prevent default browser behavior for handled movement keys.

The input mapping should support:

- `W` or `ArrowUp`: negative screen Y.
- `S` or `ArrowDown`: positive screen Y.
- `A` or `ArrowLeft`: negative screen X.
- `D` or `ArrowRight`: positive screen X.

This input is intentionally screen-direction based, not axial-direction based, because the requested feel is free top-down movement rather than hex-step movement.

## Rendering

Continue drawing the player at the viewport center.

Map layout should be centered on the player's continuous world position rather than an axial coordinate. A good implementation path is:

- Add a layout function that accepts `focusWorldPosition`.
- Calculate each cell center as `viewportCenter + cellWorldPixel - focusWorldPosition`.
- Keep `hexSize` unchanged.

This makes the map scroll continuously as the player moves.

Combat entities and attack effects can keep using hex centers for now. They will appear on the scrolling map correctly because their cell centers are still derived from the same layout.

## State And Data Flow

`PlayerEntity` should own:

- `coord`: current containing hex, used by reveal rules, combat range, and victory.
- `worldPosition`: continuous player position, used by movement and map centering.
- `moveSpeed`: a fixed gameplay default, stored with the other player defaults.

The state invariant is: `player.coord` is the rounded hex containing `player.worldPosition` after every accepted movement update.

`state.ts` should expose small helpers instead of keeping movement rules inside `GameScene`:

- A predicate or helper to decide whether a coordinate is walkable.
- A movement helper that accepts a candidate world position and returns whether it was applied.

The scene should remain responsible for reading input and passing frame movement intent to state logic.

## Reveal And Combat

Reveal remains based on `player.coord`:

- A covered cell can be revealed only when its axial distance from `player.coord` is `1`.
- The long-press flow and unlock animation remain unchanged apart from using the continuously centered layout.

Combat also remains based on `player.coord` for this version:

- Player attack range remains measured in axial distance.
- Monster attack range remains measured in axial distance.
- Monster movement can stay hex-based.
- Combat continues ticking while the player moves; there is no movement animation state that pauses combat.

This keeps the movement change scoped and avoids turning combat into a continuous physics system.

## Victory

When continuous movement updates `player.coord`, entering a revealed exit cell sets the game status to `victory`.

After victory, movement input should no longer change the player position.

## Testing

Add unit coverage for:

- Pixel-to-axial conversion and rounding.
- Initial player world position at the center cell.
- Continuous movement updates world position and current hex.
- Large frame deltas cannot tunnel through blocked cells.
- Diagonal input is normalized at the scene/helper level if the helper is testable outside Phaser.
- Movement cannot enter covered cells, walls, living monster nests, or outside-map space.
- Movement can enter revealed empty cells and the revealed exit.
- Entering the exit sets victory.

Keep Phaser-specific rendering behavior verified by build and manual checks.

## Manual Verification

Manual checks after implementation:

- Holding a movement key moves the player continuously.
- Releasing keys stops the player wherever they are, without snapping to a hex center.
- Diagonal movement works with combined keys.
- Diagonal movement does not feel faster than horizontal or vertical movement.
- The player cannot pass through unrevealed cells, walls, or living monster nests.
- The map scrolls smoothly around the centered player.
- Long-press reveal still targets cells adjacent to the player's current hex.
- Reaching the revealed exit still wins.
