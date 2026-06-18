import Phaser from 'phaser';
import { type AxialCoord, axialToPixel, getHexKey } from './hex';
import { type MazeCell } from './maze';
import {
  createGameState,
  getGameSummary,
  movePlayer,
  revealCell,
  type GameState,
} from './state';

export const GAME_SCENE_KEY = 'GameScene';

const HOLD_DURATION_MS = 600;
const MAP_PADDING = 44;

const COLORS = {
  covered: 0x6f776b,
  empty: 0xdfe8d2,
  wall: 0x2b3029,
  exit: 0xd69732,
  stroke: 0xffffff,
  player: 0x2f6fed,
  hold: 0x46b36d,
};

const KEY_MOVES: Record<string, AxialCoord> = {
  arrowright: { q: 1, r: 0 },
  d: { q: 1, r: 0 },
  arrowleft: { q: -1, r: 0 },
  a: { q: -1, r: 0 },
  arrowup: { q: 0, r: -1 },
  w: { q: 0, r: -1 },
  arrowdown: { q: 0, r: 1 },
  s: { q: 0, r: 1 },
};

interface ScreenPoint {
  x: number;
  y: number;
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerGraphics!: Phaser.GameObjects.Graphics;
  private holdGraphics!: Phaser.GameObjects.Graphics;
  private cellCenters = new Map<string, ScreenPoint>();
  private hexSize = 24;
  private holdTargetKey: string | null = null;
  private holdStartedAt = 0;
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private victoryEmitted = false;

  constructor() {
    super(GAME_SCENE_KEY);
  }

  create(): void {
    this.state = createGameState();
    this.mapGraphics = this.add.graphics();
    this.playerGraphics = this.add.graphics();
    this.holdGraphics = this.add.graphics();

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.clearHold, this);
    this.input.on('pointerout', this.clearHold, this);
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.scale.on('resize', this.renderScene, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeSceneListeners, this);

    this.renderScene();
    this.emitState();
  }

  update(): void {
    this.drawHoldProgress();
  }

  private removeSceneListeners(): void {
    this.clearHold();
    this.scale.off('resize', this.renderScene, this);
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const move = KEY_MOVES[event.key.toLowerCase()];

    if (!move) {
      return;
    }

    event.preventDefault();

    const target = {
      q: this.state.player.coord.q + move.q,
      r: this.state.player.coord.r + move.r,
    };
    const nextState = movePlayer(this.state, target);

    if (nextState === this.state) {
      return;
    }

    this.state = nextState;
    this.renderScene();
    this.emitState();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const cell = this.findCellAt(pointer.x, pointer.y);

    if (!cell || cell.revealed) {
      return;
    }

    this.clearHold();
    this.holdTargetKey = cell.key;
    this.holdStartedAt = this.time.now;
    this.holdTimer = this.time.delayedCall(HOLD_DURATION_MS, () => {
      if (this.holdTargetKey !== cell.key) {
        return;
      }

      this.state = revealCell(this.state, cell.key);
      this.clearHold();
      this.renderScene();
      this.emitState();
    });
  }

  private clearHold(): void {
    this.holdTimer?.remove(false);
    this.holdTimer = null;
    this.holdTargetKey = null;
    this.holdGraphics?.clear();
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
    if (!this.mapGraphics || !this.playerGraphics) {
      return;
    }

    this.updateLayout();
    this.mapGraphics.clear();

    for (const cell of this.state.maze.cells.values()) {
      const center = this.cellCenters.get(cell.key);

      if (!center) {
        continue;
      }

      this.drawHex(this.mapGraphics, center, this.hexSize, this.getCellFill(cell));
    }

    this.drawPlayer();
  }

  private updateLayout(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const radius = this.state.maze.radius;
    const availableWidth = Math.max(320, width) - MAP_PADDING * 2;
    const availableHeight = Math.max(240, height) - MAP_PADDING * 2;
    const hexWidthUnits = radius * 3 + 2;
    const hexHeightUnits = Math.sqrt(3) * (radius * 2 + 1);

    this.hexSize = Math.max(
      12,
      Math.min(availableWidth / hexWidthUnits, availableHeight / hexHeightUnits),
    );

    const centerX = width / 2;
    const centerY = height / 2;
    this.cellCenters.clear();

    for (const cell of this.state.maze.cells.values()) {
      const pixel = axialToPixel(cell.coord, this.hexSize);
      this.cellCenters.set(cell.key, {
        x: centerX + pixel.x,
        y: centerY + pixel.y,
      });
    }
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

    return COLORS.empty;
  }

  private drawPlayer(): void {
    const playerKey = getHexKey(this.state.player.coord);
    const center = this.cellCenters.get(playerKey);

    this.playerGraphics.clear();

    if (!center) {
      return;
    }

    this.playerGraphics.fillStyle(COLORS.player, 1);
    this.playerGraphics.lineStyle(3, COLORS.stroke, 1);
    this.playerGraphics.fillCircle(center.x, center.y, this.hexSize * 0.35);
    this.playerGraphics.strokeCircle(center.x, center.y, this.hexSize * 0.35);
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

  private drawHoldProgress(): void {
    this.holdGraphics.clear();

    if (!this.holdTargetKey) {
      return;
    }

    const center = this.cellCenters.get(this.holdTargetKey);

    if (!center) {
      return;
    }

    const progress = Phaser.Math.Clamp((this.time.now - this.holdStartedAt) / HOLD_DURATION_MS, 0, 1);

    this.holdGraphics.fillStyle(COLORS.hold, 0.2 + progress * 0.45);
    this.holdGraphics.fillCircle(center.x, center.y, this.hexSize * (0.2 + progress * 0.4));
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
