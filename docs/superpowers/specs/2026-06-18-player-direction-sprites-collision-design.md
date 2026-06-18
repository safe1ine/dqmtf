# Player Direction Sprites And Lower-Body Collision Design

## Scope

Replace the current player marker with the 8 directional character images from `/mnt/c/Users/maosite/Downloads/豆包.zip`, and change player collision so only the lower half of the character participates in terrain blocking.

This builds on the continuous movement system:

- Movement remains held-key 8-direction movement.
- The map still scrolls around the player.
- Walls, covered cells, living monster nests, and outside-map space still block movement.
- Existing sloped-wall sliding behavior remains.
- Combat and reveal still use the player's current containing hex.

This change does not add walking frame animation, attack animation, hit reactions, inventory, or mouse movement.

## Source Assets

The zip contains:

- `slices/front.webp`
- `slices/front_right.webp`
- `slices/right.webp`
- `slices/back_right.webp`
- `slices/back.webp`
- `slices/back_left.webp`
- `slices/left.webp`
- `slices/front_left.webp`

The left and right file names are visually reversed in the provided asset set. Runtime mapping must use the actual visual direction, not the literal file name.

Copy the 8 slice images into the app's public assets, for example:

`public/assets/player/doubao/`

Do not depend on the original Downloads zip at runtime.

## Correct Direction Mapping

Use this corrected mapping:

| Movement direction | Texture file |
| --- | --- |
| Down / front | `front.webp` |
| Down-right / front-right | `front_left.webp` |
| Right | `left.webp` |
| Up-right / back-right | `back_left.webp` |
| Up / back | `back.webp` |
| Up-left / back-left | `back_right.webp` |
| Left | `right.webp` |
| Down-left / front-left | `front_right.webp` |

The player starts facing front/down.

When movement input is active, update the facing direction from the normalized movement vector. When movement input stops, keep the last facing direction and keep showing that same texture.

## Rendering

Replace the blue circular `playerGraphics` marker with a Phaser image.

Rendering rules:

- Preload all 8 player textures.
- Use one persistent player image object instead of recreating it every frame.
- Draw the player at the viewport center because the map is centered on `player.worldPosition`.
- Anchor the image at bottom center, so the visual feet stay aligned with the player's world position.
- Scale the image to fit the current hex size. First implementation target: character height around `hexSize * 2.4`, with width preserving aspect ratio.
- Keep the player depth above map tiles and combat markers.

The current static directional images are single-frame. There is no walking cycle yet.

## Direction Selection

Add a pure helper that maps movement vectors to one of 8 player directions.

The helper should:

- Return `null` for a zero vector.
- Divide the screen-space vector into 8 octants.
- Treat positive `y` as front/down and negative `y` as back/up.
- Use the corrected asset mapping above.

`GameScene` should store the last non-null direction. On each update:

1. Read the held movement vector.
2. If vector is non-zero, update `lastPlayerDirection`.
3. Set the player image texture for `lastPlayerDirection`.
4. Move the player through existing continuous movement state logic.

## Lower-Body Collision

Only the lower 50 percent of the character should collide with terrain.

`player.worldPosition` remains the foot anchor and visual bottom-center point. Collision should sample a rectangle above that anchor representing the lower half of the displayed character:

- Width: about 45 percent of displayed character width.
- Height: 50 percent of displayed character height.
- Bottom: aligned with `player.worldPosition`.
- Center X: aligned with `player.worldPosition.x`.

For movement validation, a candidate world position is walkable only if all collision sample points are walkable. First version sample points:

- bottom center
- lower-left
- lower-right
- middle-left
- middle-right
- top-left
- top-right

Each sample point converts to an axial cell using `pixelToAxial`, then uses the existing walkability rules. This allows the upper body to visually overlap walls while the legs/feet remain blocked.

## Sloped Wall Sliding

The existing sloped-wall slide behavior remains. When the full candidate movement is blocked by the lower-body collision points, the movement code should still try the edge-slide response against the blocked neighboring cell.

If multiple sample points are blocked, prefer the blocked cell closest to the candidate movement direction. If that is too complex for the first implementation, using the first blocked neighboring cell is acceptable as long as tests cover the common upper-right sloped-wall case.

## State And Scene Responsibilities

State layer:

- Owns collision validation.
- Exposes movement helpers that test lower-body sample points.
- Keeps `player.coord` synchronized with the foot anchor position.
- Keeps victory and terrain blocking rules unchanged.

Scene layer:

- Owns image loading and rendering.
- Owns held-input direction tracking for visual facing.
- Passes movement deltas to the state layer.
- Does not perform terrain collision itself.

## Testing

Add unit tests for:

- Corrected direction-to-asset mapping.
- Vector-to-direction octants, including cardinal and diagonal vectors.
- Zero vector leaves direction unchanged at scene/helper level.
- Lower-body collision blocks when a lower-half sample point enters a wall.
- Upper-body overlap does not block when only points above the lower-half collision rectangle would touch a wall.
- Existing sloped-wall slide still pushes the player downward in the upper-right wall case.

Use build/manual checks for Phaser rendering:

- Player image appears at the center.
- Moving right uses the visually right-facing image, even though the source file is named `left.webp`.
- Moving left uses the visually left-facing image, even though the source file is named `right.webp`.
- Stopping keeps the last movement direction image.
- Only lower body collides; the upper body can visually overlap walls.

## Manual Verification

After implementation:

- Start the game and confirm the player is no longer a blue circle.
- Hold each cardinal direction and confirm the visual facing is correct.
- Hold each diagonal direction and confirm the diagonal facing is correct.
- Release movement and confirm the last direction remains visible.
- Move near a wall and confirm upper body overlap is allowed.
- Confirm the legs/feet cannot pass into covered cells, walls, living monster nests, or outside the map.
- Push into an upper-right sloped wall and confirm the player slides downward instead of sticking.
