import { GameState } from './gameState';
import { createScenario } from './scenario';
import { GameUI } from './ui';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const statusEl = document.getElementById('status') as HTMLElement;
const actionsEl = document.getElementById('actions') as HTMLElement;
const logEl = document.getElementById('log') as HTMLElement;

function resizeCanvas(): void {
  const board = document.getElementById('board') as HTMLElement;
  canvas.width = board.clientWidth;
  canvas.height = board.clientHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const data = createScenario();
// Both ships begin the engagement with round shot loaded.
data.ships.forEach((s) => {
  s.loadedAmmo = 'round';
});

const game = new GameState(data);
const ui = new GameUI(game, canvas, statusEl, actionsEl, logEl);
ui.start();
