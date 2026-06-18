import Phaser from 'phaser';
import './styles.css';
import { GameScene } from './game/GameScene';
import type { GameSummary } from './game/state';

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
    <main class="welcome-screen">
      <section class="welcome-panel">
        <p class="eyebrow">Hex Maze</p>
        <h1>蜂窝迷宫逃脱</h1>
        <button id="start-game" class="primary-button" type="button">开始游戏</button>
      </section>
    </main>
  `;

  document.querySelector<HTMLButtonElement>('#start-game')?.addEventListener('click', renderGame);
}

function renderGame(): void {
  destroyGame();

  appElement.innerHTML = `
    <main class="game-screen">
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
    </main>
  `;

  const container = document.querySelector<HTMLDivElement>('#game-container');

  if (!container) {
    throw new Error('Missing #game-container element');
  }

  const width = Math.max(320, container.clientWidth);
  const height = Math.max(240, container.clientHeight);

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width,
    height,
    backgroundColor: '#edf3e7',
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.NONE,
    },
  });

  stateListener = updateStatusBar;
  game.events.on('state-changed', stateListener);

  resizeObserver = new ResizeObserver(() => {
    if (!game) {
      return;
    }

    game.scale.resize(Math.max(320, container.clientWidth), Math.max(240, container.clientHeight));
  });
  resizeObserver.observe(container);
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
