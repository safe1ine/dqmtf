import Phaser from 'phaser';
import { HEX_DIRECTIONS, type AxialCoord, axialDistance, axialToPixel } from './hex';
import { calculateMapLayout, type ScreenPoint } from './mapLayout';
import { type MazeCell } from './maze';
import { tickCombat } from './combat';
import {
  getMovementDirectionForKey,
  getMovementVector,
  type MovementDirection,
} from './movementInput';
import {
  getPlayerDirectionForVector,
  getPlayerSpriteDisplaySize,
  PLAYER_SPRITE_ASSETS,
  type PlayerDirection,
} from './playerSprites';
import {
  getCellTileVisual,
  getHexTileDisplaySize,
  getRevealedWallConnections,
  getWallOverlayDisplaySize,
  getWallOverlaySegments,
  getUnlockAnimationVisual,
  TILE_ASSETS,
  UNLOCK_ANIMATION_TOTAL_MS,
  type WallOverlaySegment,
} from './tileRendering';
import {
  createGameState,
  getGameSummary,
  movePlayerByWorldDelta,
  revealCell,
  type GameState,
} from './state';

export const GAME_SCENE_KEY = 'GameScene';

const HOLD_DURATION_MS = UNLOCK_ANIMATION_TOTAL_MS;

const DEPTHS = {
  map: 10,
  coveredTiles: 11,
  wallOverlay: 12,
  combat: 20,
  player: 30,
};

const COLORS = {
  covered: 0x6f776b,
  empty: 0xdfe8d2,
  wall: 0x2b3029,
  exit: 0xd69732,
  monsterNest: 0x8f3d5b,
  monster: 0xc93932,
  hpBack: 0x1b1f1a,
  hpFill: 0x54c878,
  attackLine: 0x66d9ff,
  monsterAttackLine: 0xff715b,
  stroke: 0xffffff,
  player: 0x2f6fed,
};

interface AttackEffect {
  from: AxialCoord;
  to: AxialCoord;
  expiresAt: number;
  color: number;
}

interface UnlockAnimation {
  startedAt: number;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private combatGraphics!: Phaser.GameObjects.Graphics;
  private playerImage!: Phaser.GameObjects.Image;
  private tileImages = new Map<string, Phaser.GameObjects.Image>();
  private wallOverlayImages = new Map<string, Phaser.GameObjects.Image>();
  private cellCenters = new Map<string, ScreenPoint>();
  private hexSize = 24;
  private holdTargetKey: string | null = null;
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private heldMovementDirections = new Set<MovementDirection>();
  private lastPlayerDirection: PlayerDirection = 'front';
  private unlockAnimations = new Map<string, UnlockAnimation>();
  private attackEffects: AttackEffect[] = [];
  private victoryEmitted = false;

  constructor() {
    super(GAME_SCENE_KEY);
  }

  preload(): void {
    for (const asset of Object.values(TILE_ASSETS)) {
      this.load.image(asset.key, asset.path);
    }

    for (const asset of Object.values(PLAYER_SPRITE_ASSETS)) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    this.state = createGameState();
    this.mapGraphics = this.add.graphics().setDepth(DEPTHS.map);
    this.wallGraphics = this.add.graphics().setDepth(DEPTHS.wallOverlay);
    this.combatGraphics = this.add.graphics().setDepth(DEPTHS.combat);
    this.playerImage = this.add
      .image(0, 0, PLAYER_SPRITE_ASSETS[this.lastPlayerDirection].key)
      .setDepth(DEPTHS.player)
      .setOrigin(0.5, 1);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.clearHold, this);
    this.input.on('pointerout', this.clearHold, this);
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.input.keyboard?.on('keyup', this.handleKeyUp, this);
    this.scale.on('resize', this.renderScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeSceneListeners, this);

    this.renderScene();
    this.emitState();
  }

  update(time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    tickCombat(this.state, { elapsedMs: delta, nowMs: time });
    this.recordCombatEffects(time);
    this.renderScene();
    this.emitState();
  }

  private removeSceneListeners(): void {
    this.clearHold();
    this.clearTileImages();
    this.clearWallOverlayImages();
    this.unlockAnimations.clear();
    this.scale.off('resize', this.renderScene, this);
    this.heldMovementDirections.clear();
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.input.keyboard?.off('keyup', this.handleKeyUp, this);
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
    const direction = getPlayerDirectionForVector(vector);

    if (direction) {
      this.lastPlayerDirection = direction;
    }

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

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const cell = this.findCellAt(pointer.x, pointer.y);

    if (!cell || cell.revealed || axialDistance(this.state.player.coord, cell.coord) !== 1) {
      return;
    }

    this.clearHold();
    this.holdTargetKey = cell.key;
    this.unlockAnimations.set(cell.key, { startedAt: this.time.now });
    this.renderScene();

    this.holdTimer = this.time.delayedCall(HOLD_DURATION_MS, () => {
      if (this.holdTargetKey !== cell.key) {
        return;
      }

      const nextState = revealCell(this.state, cell.key);

      this.state = nextState;
      this.holdTimer = null;
      this.holdTargetKey = null;
      this.unlockAnimations.delete(cell.key);
      this.renderScene();
      this.emitState();
    });
  }

  private clearHold(): void {
    const holdTargetKey = this.holdTargetKey;

    this.holdTimer?.remove(false);
    this.holdTimer = null;
    this.holdTargetKey = null;

    if (holdTargetKey) {
      this.unlockAnimations.delete(holdTargetKey);
      this.renderScene();
    }
  }

  private emitState(): void {
    const summary = getGameSummary(this.state);
    this.game.events.emit('state-changed', summary);

    if (summary.status === 'victory' && !this.victoryEmitted) {
      this.victoryEmitted = true;
      this.game.events.emit('victory', summary);
    }
  }

  private renderScene(): void {
    if (!this.mapGraphics || !this.wallGraphics || !this.playerImage || !this.combatGraphics) {
      return;
    }

    this.updateLayout();
    this.mapGraphics.clear();
    this.wallGraphics.clear();
    this.combatGraphics.clear();
    const activeTileKeys = new Set<string>();
    const activeWallOverlayKeys = new Set<string>();

    for (const cell of this.state.maze.cells.values()) {
      const center = this.cellCenters.get(cell.key);

      if (!center) {
        continue;
      }

      const visual = this.getCellRenderVisual(cell);

      if (visual.kind === 'texture') {
        activeTileKeys.add(cell.key);
        this.drawTileImage(cell.key, visual.key, center);
        this.drawCellOverlay(cell, center, activeWallOverlayKeys);
        continue;
      }

      this.drawHex(this.mapGraphics, center, this.hexSize, this.getCellFill(cell));
    }

    this.pruneTileImages(activeTileKeys);
    this.pruneWallOverlayImages(activeWallOverlayKeys);
    this.drawCombatEntities();
    this.drawAttackEffects();
    this.drawPlayer();
  }

  private updateLayout(): void {
    const layout = calculateMapLayout({
      cells: this.state.maze.cells.values(),
      focusWorldPosition: this.state.player.worldPosition,
      viewport: {
        width: this.scale.width,
        height: this.scale.height,
      },
    });

    this.hexSize = layout.hexSize;
    this.cellCenters = layout.cellCenters;
  }

  private getCellFill(cell: MazeCell): number {
    if (!cell.revealed) {
      return COLORS.covered;
    }

    if (cell.type === 'wall') {
      return COLORS.wall;
    }

    if (cell.type === 'exit') {
      return COLORS.exit;
    }

    if (cell.type === 'monsterNest') {
      return COLORS.monsterNest;
    }

    return COLORS.empty;
  }

  private getCellRenderVisual(cell: MazeCell) {
    const unlockAnimation = this.unlockAnimations.get(cell.key);

    if (unlockAnimation) {
      const visual = getUnlockAnimationVisual(this.time.now - unlockAnimation.startedAt);

      if (visual) {
        return visual;
      }

      this.unlockAnimations.delete(cell.key);
    }

    return getCellTileVisual(cell);
  }

  private drawTileImage(key: string, textureKey: string, center: ScreenPoint): void {
    const displaySize = getHexTileDisplaySize(this.hexSize);
    let image = this.tileImages.get(key);

    if (!image) {
      image = this.add.image(center.x, center.y, textureKey).setDepth(DEPTHS.coveredTiles);
      this.tileImages.set(key, image);
    }

    image
      .setTexture(textureKey)
      .setPosition(center.x, center.y)
      .setDisplaySize(displaySize.width, displaySize.height)
      .setVisible(true);
  }

  private drawCellOverlay(cell: MazeCell, center: ScreenPoint, activeWallOverlayKeys: Set<string>): void {
    if (!cell.revealed) {
      return;
    }

    if (cell.type === 'wall') {
      this.drawWallOverlay(cell.key, center, getRevealedWallConnections(cell, this.state.maze.cells), activeWallOverlayKeys);
      return;
    }

    if (cell.type === 'exit') {
      this.drawExitOverlay(center);
      return;
    }

    if (cell.type === 'monsterNest') {
      this.drawMonsterNestOverlay(center);
    }
  }

  private drawWallOverlay(
    cellKey: string,
    center: ScreenPoint,
    connections: readonly boolean[],
    activeWallOverlayKeys: Set<string>,
  ): void {
    const segments = getWallOverlaySegments(connections);
    const orderedSegments = [
      ...segments.filter((segment) => segment.kind === 'connector'),
      ...segments.filter((segment) => segment.kind === 'post'),
    ];

    for (const segment of orderedSegments) {
      this.drawWallOverlaySegment(cellKey, center, segment, activeWallOverlayKeys);
    }
  }

  private drawWallOverlaySegment(
    cellKey: string,
    center: ScreenPoint,
    segment: WallOverlaySegment,
    activeWallOverlayKeys: Set<string>,
  ): void {
    const key = `${cellKey}:wall:${segment.id}`;
    const placement = this.getWallOverlaySegmentPlacement(center, segment);
    let image = this.wallOverlayImages.get(key);

    if (!image) {
      image = this.add.image(placement.x, placement.y, placement.textureKey).setDepth(DEPTHS.wallOverlay);
      this.wallOverlayImages.set(key, image);
    }

    activeWallOverlayKeys.add(key);
    image
      .setTexture(placement.textureKey)
      .setPosition(placement.x, placement.y)
      .setRotation(placement.rotation)
      .setDisplaySize(placement.width, placement.height)
      .setVisible(true);
  }

  private getWallOverlaySegmentPlacement(center: ScreenPoint, segment: WallOverlaySegment) {
    if (segment.kind === 'post') {
      const size = getWallOverlayDisplaySize(this.hexSize, segment.kind);

      return {
        textureKey: TILE_ASSETS.wallPostStone.key,
        x: center.x,
        y: center.y,
        rotation: 0,
        width: size.width,
        height: size.height,
      };
    }

    const directionIndex = segment.directionIndex ?? 0;
    const direction = this.getWallDirectionVector(directionIndex);
    const size = getWallOverlayDisplaySize(this.hexSize, segment.kind);

    return {
      textureKey: TILE_ASSETS.wallConnectorStone.key,
      x: center.x + direction.x * this.hexSize * 0.86,
      y: center.y + direction.y * this.hexSize * 0.86,
      rotation: Math.atan2(direction.y, direction.x),
      width: size.width,
      height: size.height,
    };
  }

  private drawExitOverlay(center: ScreenPoint): void {
    this.drawHex(this.wallGraphics, center, this.hexSize * 0.28, COLORS.exit);
  }

  private drawMonsterNestOverlay(center: ScreenPoint): void {
    this.wallGraphics.fillStyle(COLORS.monsterNest, 1);
    this.wallGraphics.lineStyle(2, COLORS.stroke, 0.9);
    this.wallGraphics.fillCircle(center.x, center.y, this.hexSize * 0.24);
    this.wallGraphics.strokeCircle(center.x, center.y, this.hexSize * 0.24);
  }

  private getWallDirectionVector(directionIndex: number): ScreenPoint {
    const direction = axialToPixel(HEX_DIRECTIONS[directionIndex], 1);
    const length = Math.hypot(direction.x, direction.y);

    return {
      x: direction.x / length,
      y: direction.y / length,
    };
  }

  private pruneTileImages(activeKeys: Set<string>): void {
    for (const [key, image] of this.tileImages) {
      if (!activeKeys.has(key)) {
        image.destroy();
        this.tileImages.delete(key);
      }
    }
  }

  private pruneWallOverlayImages(activeKeys: Set<string>): void {
    for (const [key, image] of this.wallOverlayImages) {
      if (!activeKeys.has(key)) {
        image.destroy();
        this.wallOverlayImages.delete(key);
      }
    }
  }

  private clearTileImages(): void {
    for (const image of this.tileImages.values()) {
      image.destroy();
    }

    this.tileImages.clear();
  }

  private clearWallOverlayImages(): void {
    for (const image of this.wallOverlayImages.values()) {
      image.destroy();
    }

    this.wallOverlayImages.clear();
  }

  private drawCombatEntities(): void {
    for (const nest of this.state.monsterNests.values()) {
      if (!nest.revealed || !nest.isAlive()) {
        continue;
      }

      const center = this.cellCenters.get(nest.key);

      if (!center) {
        continue;
      }

      this.drawHpBar(this.combatGraphics, center, this.hexSize * 1.2, -this.hexSize * 0.72, nest.hp / nest.maxHp);
    }

    for (const monster of this.state.monsters) {
      if (!monster.isAlive()) {
        continue;
      }

      const center = this.cellCenters.get(`${monster.coord.q},${monster.coord.r}`);

      if (!center) {
        continue;
      }

      this.combatGraphics.fillStyle(COLORS.monster, 1);
      this.combatGraphics.lineStyle(2, COLORS.stroke, 0.9);
      this.combatGraphics.fillCircle(center.x, center.y - this.hexSize * 0.22, this.hexSize * 0.2);
      this.combatGraphics.strokeCircle(center.x, center.y - this.hexSize * 0.22, this.hexSize * 0.2);
      this.drawHpBar(
        this.combatGraphics,
        { x: center.x, y: center.y - this.hexSize * 0.22 },
        this.hexSize * 0.7,
        -this.hexSize * 0.34,
        monster.hp / monster.maxHp,
      );
    }
  }

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

  private recordCombatEffects(nowMs: number): void {
    for (const event of this.state.combatEvents) {
      if (event.type !== 'playerAttack' && event.type !== 'monsterAttack') {
        continue;
      }

      this.attackEffects.push({
        from: event.from,
        to: event.to,
        expiresAt: nowMs + 140,
        color: event.type === 'playerAttack' ? COLORS.attackLine : COLORS.monsterAttackLine,
      });
    }

    this.attackEffects = this.attackEffects.filter((effect) => effect.expiresAt > nowMs);
  }

  private drawAttackEffects(): void {
    for (const effect of this.attackEffects) {
      const from = this.getCoordCenter(effect.from);
      const to = this.getCoordCenter(effect.to);

      if (!from || !to) {
        continue;
      }

      this.combatGraphics.lineStyle(4, effect.color, 0.8);
      this.combatGraphics.beginPath();
      this.combatGraphics.moveTo(from.x, from.y);
      this.combatGraphics.lineTo(to.x, to.y);
      this.combatGraphics.strokePath();
    }
  }

  private getCoordCenter(coord: AxialCoord): ScreenPoint | null {
    return this.cellCenters.get(`${coord.q},${coord.r}`) ?? null;
  }

  private drawHpBar(
    graphics: Phaser.GameObjects.Graphics,
    center: ScreenPoint,
    width: number,
    yOffset: number,
    ratio: number,
  ): void {
    const height = 7;
    const x = center.x - width / 2;
    const y = center.y + yOffset;
    const fillWidth = width * Phaser.Math.Clamp(ratio, 0, 1);

    graphics.fillStyle(COLORS.hpBack, 0.85);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(COLORS.hpFill, 1);
    graphics.fillRect(x, y, fillWidth, height);
  }

  private drawHex(
    graphics: Phaser.GameObjects.Graphics,
    center: ScreenPoint,
    size: number,
    fillColor: number,
  ): void {
    const points = this.createHexPoints(center, size);

    graphics.fillStyle(fillColor, 1);
    graphics.lineStyle(2, COLORS.stroke, 0.8);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);

    for (const point of points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }

    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private findCellAt(x: number, y: number): MazeCell | null {
    for (const cell of this.state.maze.cells.values()) {
      const center = this.cellCenters.get(cell.key);

      if (!center) {
        continue;
      }

      const polygon = new Phaser.Geom.Polygon(this.createHexPoints(center, this.hexSize));

      if (Phaser.Geom.Polygon.Contains(polygon, x, y)) {
        return cell;
      }
    }

    return null;
  }

  private createHexPoints(center: ScreenPoint, size: number): ScreenPoint[] {
    return Array.from({ length: 6 }, (_, index) => {
      const angle = Phaser.Math.DegToRad(60 * index);

      return {
        x: center.x + size * Math.cos(angle),
        y: center.y + size * Math.sin(angle),
      };
    });
  }
}
