# Monster Nest Design

## Scope

Add monster nest cells, spawned monsters, and automatic combat to the current hex maze game.

The first version keeps the combat model simple and deterministic enough to test:

- Monster nests are generated as a new cell type.
- Hidden monster nest cells do not spawn until revealed.
- A revealed monster nest spawns one monster every 5 seconds.
- Each nest can have at most 5 living spawned monsters.
- Monsters wander near their nest and attack the player when close.
- The player automatically attacks nearby targets.
- Player targeting priority is nearest monster first, then nearest monster nest.
- Monster nests regenerate health over time.
- When a monster nest dies, its cell becomes an empty walkable cell.

## Entity Model

The code should introduce entity classes instead of adding all behavior to `state.ts` or `GameScene.ts`.

- `BaseEntity`: id, coord, max HP, current HP, attack, attack range, attack interval, alive checks, damage/heal.
- `ActorEntity`: base class for moving/attacking entities.
- `PlayerEntity`: player defaults and attack cooldown.
- `MonsterEntity`: spawned by one monster nest, wanders near origin nest, attacks player.
- `CellEntity`: base class for maze cells, including revealed and walkable behavior.
- `EmptyCellEntity`, `WallCellEntity`, `ExitCellEntity`, `MonsterNestCellEntity`: concrete cell types.

Fixed gameplay numbers should live in a shared defaults module rather than being repeated in scene or state code.

## Gameplay Defaults

First-version values:

- Player: 100 HP, 10 attack, attack range 3 hexes, attack interval 700 ms.
- Monster: 20 HP, 4 attack, attack range 1 hex, attack interval 1000 ms.
- Monster nest: 120 HP, spawn interval 5000 ms, max living spawned monsters 5, regen 2 HP per second.
- Monster nest generation chance: 10 percent on non-protected cells.
- Monster wander radius: 2 hexes from its nest.

## Map Rules

Monster nests must not appear on:

- Center spawn cell.
- Distance-1 starting safe ring.
- Guaranteed path to exit.
- Exit cell.
- Wall cells.

Monster nest cells are not walkable while alive. After destruction they become empty walkable cells.

## Combat Rules

Combat updates in a simulation tick:

- Revealed monster nests spawn monsters only when their spawn timer has elapsed and they have fewer than 5 living monsters.
- Player auto-attacks when a target is in range.
- Player targets nearest living monster first.
- If no monster is in range, player targets nearest revealed living monster nest.
- Monsters attack the player when in range.
- Nests heal every tick up to max HP.
- Dead monsters are removed from active combat.
- Dead nests convert to empty cells and stop spawning/healing.

## Rendering

Phaser scene renders:

- Monster nest cell as a distinct revealed cell color/icon.
- Monsters as small red markers near their current hex.
- Simple bullet/projectile visual when the player attacks.
- Small HP bars for monsters and monster nests.

The scene should call the combat simulation on each update tick and redraw when combat state changes.

## Out Of Scope For This Version

- Complex pathfinding.
- Manual aiming.
- Enemy projectiles.
- Inventory, loot, XP, or upgrades.
- Game over screen beyond HP reaching zero state data.
