import Phaser from 'phaser';
import './styles.css';
import { GameScene } from './game/GameScene';
import type { GameSummary } from './game/state';
import {
  calculateGameScale,
  calculateGameViewport,
  GAME_FRAME_HEIGHT,
  GAME_FRAME_WIDTH,
} from './layout/gameViewport';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount element');
}

const appElement: HTMLDivElement = app;

let game: Phaser.Game | null = null;
let resizeObserver: ResizeObserver | null = null;
let stateListener: ((summary: GameSummary) => void) | null = null;

function destroyGame(): void {
  resizeObserver?.disconnect();
  resizeObserver = null;

  if (game && stateListener) {
    game.events.off('state-changed', stateListener);
  }

  game?.destroy(true);
  game = null;
  stateListener = null;
}

function renderWelcome(): void {
  destroyGame();

  appElement.innerHTML = `
    <main class="app-shell">
      <div class="game-viewport">
        <section class="game-frame welcome-screen">
          <div class="welcome-panel">
            <p class="eyebrow">Hex Maze</p>
            <h1>蜂窝迷宫逃脱</h1>
            <button id="start-game" class="primary-button" type="button">开始游戏</button>
          </div>
        </section>
      </div>
    </main>
  `;

  attachGameFrameResizer();
  document.querySelector<HTMLButtonElement>('#start-game')?.addEventListener('click', renderGame);
}

function renderGame(): void {
  destroyGame();

  appElement.innerHTML = `
    <main class="app-shell">
      <div class="game-viewport">
        <section class="game-frame game-screen">
          <header class="status-bar" aria-label="游戏状态">
            <div class="status-item">
              <span class="status-label">总格子</span>
              <strong id="total-cells">127</strong>
            </div>
            <div class="status-item">
              <span class="status-label">已解锁</span>
              <strong id="revealed-cells">7 / 127</strong>
            </div>
            <div class="status-item">
              <span class="status-label">血量</span>
              <strong id="player-hp">100</strong>
            </div>
            <div class="status-item">
              <span class="status-label">攻击</span>
              <strong id="player-attack">10</strong>
            </div>
            <div class="status-item">
              <span class="status-label">状态</span>
              <strong id="game-status">探索中</strong>
            </div>
          </header>
          <section class="map-area" aria-label="蜂窝迷宫地图">
            <div id="game-container"></div>
          </section>
        </section>
      </div>
    </main>
  `;

  const container = document.querySelector<HTMLDivElement>('#game-container');
  const mapArea = document.querySelector<HTMLElement>('.map-area');
  const frameElements = getFrameElements();

  if (!container || !mapArea || !frameElements) {
    throw new Error('Missing game container or map area element');
  }

  resizeGameFrame(frameElements.viewport, frameElements.frame);
  const initialSize = getMapAreaSize(mapArea);

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: initialSize.width,
    height: initialSize.height,
    backgroundColor: '#edf3e7',
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.NONE,
    },
  });

  stateListener = updateStatusBar;
  game.events.on('state-changed', stateListener);

  attachGameFrameResizer(() => {
    if (!game) {
      return;
    }

    const nextSize = getMapAreaSize(mapArea);
    game.scale.resize(nextSize.width, nextSize.height);
  });
}

function getFrameElements(): { viewport: HTMLElement; frame: HTMLElement } | null {
  const viewport = document.querySelector<HTMLElement>('.game-viewport');
  const frame = document.querySelector<HTMLElement>('.game-frame');

  if (!viewport || !frame) {
    return null;
  }

  return { viewport, frame };
}

function attachGameFrameResizer(onResize?: () => void): void {
  const frameElements = getFrameElements();

  if (!frameElements) {
    return;
  }

  const resize = (): void => {
    resizeGameFrame(frameElements.viewport, frameElements.frame);
    onResize?.();
  };

  resize();
  resizeObserver = new ResizeObserver(() => {
    resize();
  });
  resizeObserver.observe(appElement);
}

function resizeGameFrame(
  viewport: HTMLElement,
  frame: HTMLElement,
): { width: number; height: number } {
  const size = calculateGameViewport({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  viewport.style.width = `${size.width}px`;
  viewport.style.height = `${size.height}px`;
  frame.style.setProperty('--game-scale', String(calculateGameScale(size)));

  return size;
}

function getMapAreaSize(mapArea: HTMLElement): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(mapArea.clientWidth || GAME_FRAME_WIDTH)),
    height: Math.max(1, Math.round(mapArea.clientHeight || GAME_FRAME_HEIGHT * 0.88)),
  };
}

function updateStatusBar(summary: GameSummary): void {
  const totalCells = document.querySelector<HTMLElement>('#total-cells');
  const revealedCells = document.querySelector<HTMLElement>('#revealed-cells');
  const hp = document.querySelector<HTMLElement>('#player-hp');
  const attack = document.querySelector<HTMLElement>('#player-attack');
  const status = document.querySelector<HTMLElement>('#game-status');
  const gameScreen = document.querySelector<HTMLElement>('.game-screen');

  if (totalCells) {
    totalCells.textContent = String(summary.totalCells);
  }

  if (revealedCells) {
    revealedCells.textContent = `${summary.revealedCells} / ${summary.totalCells}`;
  }

  if (hp) {
    hp.textContent = String(summary.hp);
  }

  if (attack) {
    attack.textContent = String(summary.attack);
  }

  if (status) {
    status.textContent = summary.status === 'victory' ? '已胜利' : '探索中';
  }

  gameScreen?.classList.toggle('is-victory', summary.status === 'victory');
}

renderWelcome();
