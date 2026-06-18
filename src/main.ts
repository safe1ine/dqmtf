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
