# Monster Nest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add class-based monster nests, spawned monsters, automatic combat, and rendering to the hex maze game.

**Architecture:** Introduce entity classes under `src/game/entities/` and a combat simulation module under `src/game/combat.ts`. Keep map generation deterministic and testable in `maze.ts`, keep state transitions in `state.ts`, and let `GameScene.ts` render the new state and call simulation ticks.

**Tech Stack:** TypeScript, Vitest, Phaser 3.

---

## File Structure

- `src/game/entities/defaults.ts`: shared fixed values.
- `src/game/entities/BaseEntity.ts`: base HP/range/cooldown behavior.
- `src/game/entities/ActorEntity.ts`: base actor class.
- `src/game/entities/PlayerEntity.ts`: player class.
- `src/game/entities/MonsterEntity.ts`: monster class.
- `src/game/entities/cells.ts`: cell class hierarchy.
- `src/game/entities/entities.test.ts`: entity class tests.
- `src/game/combat.ts`: spawn, regen, targeting, auto attack, nest death conversion.
- `src/game/combat.test.ts`: combat simulation tests.
- Modify `src/game/maze.ts` and `src/game/maze.test.ts`: add monster nest cell generation.
- Modify `src/game/state.ts` and `src/game/state.test.ts`: use entity classes and carry combat arrays.
- Modify `src/game/GameScene.ts`: render nests, monsters, bullets, HP bars, and run combat ticks.

## Tasks

### Task 1: Entity Classes

- [ ] Add tests proving entities take damage, heal with max cap, expose alive state, and concrete default values.
- [ ] Add `BaseEntity`, actor classes, cell classes, and defaults.
- [ ] Run entity tests.

### Task 2: Monster Nest Map Generation

- [ ] Add tests proving monster nests can generate but never appear in protected cells.
- [ ] Extend `CellType` with `monsterNest`.
- [ ] Use nest chance on non-protected non-wall generated cells.
- [ ] Run maze tests.

### Task 3: State And Combat Simulation

- [ ] Add tests for revealed nest activation, 5-second spawn interval, max 5 living monsters, nest regen, player target priority, monster attack, and nest death converting to empty.
- [ ] Implement combat simulation with deterministic ids and elapsed ms updates.
- [ ] Run state and combat tests.

### Task 4: Phaser Rendering

- [ ] Render revealed nest cells distinctly.
- [ ] Render living monsters near their current coordinates.
- [ ] Render HP bars for nests and monsters.
- [ ] Render a short player bullet line when player auto-attacks.
- [ ] Call combat tick in scene update.
- [ ] Run build.

### Task 5: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm dev server still returns `200 OK`.
- [ ] Commit implementation.

## Self-Review

- Spec coverage: plan covers entity classes, defaults, nest generation, activation after reveal, spawn limit, regen, player target priority, monster attack, death conversion, and rendering.
- Marker scan: no reserved marker strings or vague implementation tasks.
- Type consistency: entity, combat, maze, state, and scene responsibilities match the design.
