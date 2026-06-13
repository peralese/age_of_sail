import { fireBroadside } from './combat';
import { runAiActivation } from './ai';
import { movementAllowance, moveShip, turnShip } from './actions';
import { GameState } from './gameState';
import { DIRECTION_NAMES, neighbor } from './hex';
import { arcHexesFor, render } from './render';
import type { AmmoType, Ship, Side, SailSetting } from './types';

export class GameUI {
  private game: GameState;
  private player: Ship;
  private ai: Ship;
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private statusEl: HTMLElement;
  private actionsEl: HTMLElement;
  private logEl: HTMLElement;
  private gameOver = false;

  constructor(game: GameState, canvas: HTMLCanvasElement, statusEl: HTMLElement, actionsEl: HTMLElement, logEl: HTMLElement) {
    this.game = game;
    this.player = game.ships[0];
    this.ai = game.ships[1];
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.statusEl = statusEl;
    this.actionsEl = actionsEl;
    this.logEl = logEl;
  }

  start(): void {
    this.game.startTurn();
    this.log(`=== Turn ${this.game.turnNumber} ===`, true);
    this.log(`${this.player.name} (${this.player.nation}) vs ${this.ai.name} (${this.ai.nation}). Good hunting.`);
    this.renderAll();
  }

  private log(message: string, isTurnMarker = false): void {
    const div = document.createElement('div');
    div.className = isTurnMarker ? 'entry turn-marker' : 'entry';
    div.textContent = message;
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  private renderAll(): void {
    this.renderBoard();
    this.renderStatus();
    this.renderActions();
  }

  private renderBoard(): void {
    const canMove = this.player.ap > 0 && this.player.movesUsed < movementAllowance(this.player, this.game.windDir);
    render(this.ctx, this.canvas, this.game, {
      selected: this.player,
      moveTarget: canMove ? neighbor(this.player.pos, this.player.facing) : null,
      arcHexes: this.player.ap > 0 ? arcHexesFor(this.player) : null,
    });
  }

  private renderStatus(): void {
    this.statusEl.innerHTML = '';
    this.statusEl.appendChild(this.shipCard(this.player, this.player.ap > 0 && !this.gameOver));
    this.statusEl.appendChild(this.shipCard(this.ai, false));

    const turnInfo = document.createElement('div');
    turnInfo.className = 'ship-card';
    turnInfo.innerHTML = `<div class="stat-row"><span>Turn</span><span>${this.game.turnNumber}</span></div>
      <div class="stat-row"><span>Wind from</span><span>${DIRECTION_NAMES[this.game.windDir]}</span></div>`;
    this.statusEl.appendChild(turnInfo);
  }

  private shipCard(ship: Ship, active: boolean): HTMLElement {
    const card = document.createElement('div');
    card.className = 'ship-card' + (active ? ' active' : '');
    const allowance = movementAllowance(ship, this.game.windDir);
    const status = ship.surrendered ? 'SURRENDERED' : !ship.alive ? 'SUNK' : 'OK';
    card.innerHTML = `
      <h2>${ship.name} (${ship.nation})</h2>
      <div class="stat-row"><span>Status</span><span>${status}</span></div>
      <div class="stat-row"><span>Hull</span><span>${ship.hull.toFixed(1)} / ${ship.hullMax}</span></div>
      <div class="stat-row"><span>Rigging</span><span>${ship.rigging.toFixed(1)} / ${ship.riggingMax}</span></div>
      <div class="stat-row"><span>Crew</span><span>${Math.round(ship.crew)} / ${ship.crewMax}</span></div>
      <div class="stat-row"><span>Heading</span><span>${DIRECTION_NAMES[ship.facing]}</span></div>
      <div class="stat-row"><span>Sail</span><span>${ship.sailSetting}</span></div>
      <div class="stat-row"><span>Ammo loaded</span><span>${ship.loadedAmmo ?? 'unloaded'}</span></div>
      <div class="stat-row"><span>Move allowance</span><span>${allowance} (used ${ship.movesUsed})</span></div>
      <div class="stat-row"><span>Turns used</span><span>${ship.turnsUsed} / ${ship.handling}</span></div>
      <div class="stat-row"><span>AP</span><span>${ship.ap} / ${ship.apMax}</span></div>
    `;
    return card;
  }

  private renderActions(): void {
    this.actionsEl.innerHTML = '';
    if (this.gameOver) return;

    const p = this.player;
    const canAct = p.ap > 0;

    // Turn buttons
    const turnRow = document.createElement('div');
    turnRow.className = 'action-row';
    turnRow.appendChild(this.makeButton('Turn Port (1 AP)', canAct && p.turnsUsed < p.handling, () => this.doTurn(-1)));
    turnRow.appendChild(this.makeButton('Turn Starboard (1 AP)', canAct && p.turnsUsed < p.handling, () => this.doTurn(1)));
    this.actionsEl.appendChild(turnRow);

    // Move
    const allowance = movementAllowance(p, this.game.windDir);
    this.actionsEl.appendChild(
      this.makeButton(`Move Forward (1 AP) [${p.movesUsed}/${allowance}]`, canAct && p.movesUsed < allowance, () => this.doMove())
    );

    // Fire
    const fireRow = document.createElement('div');
    fireRow.className = 'action-row';
    fireRow.appendChild(this.makeButton('Fire Port (1 AP)', canAct, () => this.doFire('port')));
    fireRow.appendChild(this.makeButton('Fire Starboard (1 AP)', canAct, () => this.doFire('starboard')));
    this.actionsEl.appendChild(fireRow);

    // Sail
    this.actionsEl.appendChild(
      this.makeButton(`Change Sail to ${p.sailSetting === 'battle' ? 'Full' : 'Battle'} (1 AP)`, canAct, () => this.doChangeSail())
    );

    // Load ammo
    const loadRow = document.createElement('div');
    loadRow.className = 'action-row';
    const select = document.createElement('select');
    (['round', 'chain', 'double'] as AmmoType[]).forEach((type) => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      if (type === p.ammoType) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = !canAct;
    loadRow.appendChild(select);
    loadRow.appendChild(this.makeButton('Load Shot (1 AP)', canAct, () => this.doLoad(select.value as AmmoType)));
    this.actionsEl.appendChild(loadRow);

    // End activation
    this.actionsEl.appendChild(this.makeButton('End Activation', canAct, () => this.doEndActivation()));
  }

  private makeButton(label: string, enabled: boolean, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.disabled = !enabled;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private doTurn(dir: 1 | -1): void {
    const result = turnShip(this.player, dir);
    this.log(result.message);
    if (result.ok) {
      this.player.ap -= 1;
    }
    this.afterPlayerAction();
  }

  private doMove(): void {
    const result = moveShip(this.player, this.game);
    this.log(result.message);
    if (result.ok) {
      this.player.ap -= 1;
    }
    this.afterPlayerAction();
  }

  private doFire(side: Side): void {
    const result = fireBroadside(this.player, this.ai, side);
    this.log(result.message);
    if (result.ok) {
      this.player.ap -= 1;
    }
    this.afterPlayerAction();
  }

  private doChangeSail(): void {
    const next: SailSetting = this.player.sailSetting === 'battle' ? 'full' : 'battle';
    this.player.sailSetting = next;
    this.log(`${this.player.name} sets ${next} sail.`);
    this.player.ap -= 1;
    this.afterPlayerAction();
  }

  private doLoad(type: AmmoType): void {
    this.player.ammoType = type;
    this.player.loadedAmmo = type;
    this.log(`${this.player.name} loads ${type} shot.`);
    this.player.ap -= 1;
    this.afterPlayerAction();
  }

  private doEndActivation(): void {
    this.log(`${this.player.name} ends its activation.`);
    this.player.ap = 0;
    this.afterPlayerAction();
  }

  private afterPlayerAction(): void {
    this.renderAll();

    const victor = this.game.checkVictory();
    if (victor) {
      this.endGame(victor);
      return;
    }

    if (this.player.ap === 0) {
      this.log(`--- ${this.ai.name} activates ---`, true);
      runAiActivation(this.ai, this.player, this.game, (msg) => this.log(msg));
      this.renderAll();

      const victor2 = this.game.checkVictory();
      if (victor2) {
        this.endGame(victor2);
        return;
      }

      this.game.turnNumber += 1;
      this.game.startTurn();
      this.log(`=== Turn ${this.game.turnNumber} ===`, true);
      this.renderAll();
    }
  }

  private endGame(message: string): void {
    this.gameOver = true;
    this.log(message, true);
    this.renderAll();
    const banner = document.createElement('div');
    banner.className = 'victory-banner';
    banner.textContent = message;
    this.statusEl.appendChild(banner);
  }
}
