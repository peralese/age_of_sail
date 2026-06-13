import { axialToPixel, DIRECTIONS, hexCorners, hexDistance, HEX_SIZE, neighbor, type Hex } from './hex';
import type { GameState } from './gameState';
import type { Ship } from './types';

export interface RenderOptions {
  selected: Ship | null;
  moveTarget: Hex | null;
  arcHexes: { port: Hex[]; starboard: Hex[] } | null;
}

function facingAngle(facing: number): number {
  const p = axialToPixel(DIRECTIONS[facing]);
  return Math.atan2(p.y, p.x);
}

export function render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, game: GameState, opts: RenderOptions): void {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b2740';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  // Draw hex grid
  for (let q = -game.mapRadius; q <= game.mapRadius; q++) {
    for (let r = -game.mapRadius; r <= game.mapRadius; r++) {
      const hex: Hex = { q, r };
      if (hexDistance(hex, { q: 0, r: 0 }) > game.mapRadius) continue;
      const p = axialToPixel(hex);
      const center = { x: cx + p.x, y: cy + p.y };
      const corners = hexCorners(center);

      let fill = '#13456f';
      if (opts.moveTarget && hex.q === opts.moveTarget.q && hex.r === opts.moveTarget.r) {
        fill = '#2e7d32';
      } else if (
        opts.arcHexes &&
        (opts.arcHexes.port.some((a) => a.q === hex.q && a.r === hex.r) ||
          opts.arcHexes.starboard.some((a) => a.q === hex.q && a.r === hex.r))
      ) {
        fill = '#7d2e2e';
      }

      ctx.beginPath();
      corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = '#0b2740';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw ships
  for (const ship of game.ships) {
    if (!ship.alive) continue;
    const p = axialToPixel(ship.pos);
    const center = { x: cx + p.x, y: cy + p.y };
    const angle = facingAngle(ship.facing);

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(HEX_SIZE * 0.6, 0);
    ctx.lineTo(-HEX_SIZE * 0.4, HEX_SIZE * 0.35);
    ctx.lineTo(-HEX_SIZE * 0.4, -HEX_SIZE * 0.35);
    ctx.closePath();
    ctx.fillStyle = ship.isPlayer ? '#e0c060' : '#d05050';
    ctx.fill();
    ctx.strokeStyle = ship === opts.selected ? '#ffffff' : '#222222';
    ctx.lineWidth = ship === opts.selected ? 3 : 1.5;
    ctx.stroke();

    ctx.restore();

    // Hull/rigging/crew mini-bars below the ship
    const barWidth = HEX_SIZE * 0.9;
    const barHeight = 3;
    const bars: [number, string][] = [
      [ship.hull / ship.hullMax, '#c0392b'],
      [ship.rigging / ship.riggingMax, '#2980b9'],
      [ship.crew / ship.crewMax, '#27ae60'],
    ];
    bars.forEach(([ratio, color], i) => {
      const y = center.y + HEX_SIZE * 0.55 + i * (barHeight + 2);
      ctx.fillStyle = '#222';
      ctx.fillRect(center.x - barWidth / 2, y, barWidth, barHeight);
      ctx.fillStyle = color;
      ctx.fillRect(center.x - barWidth / 2, y, barWidth * Math.max(0, Math.min(1, ratio)), barHeight);
    });

    // Name label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ship.name, center.x, center.y - HEX_SIZE * 0.7);
  }

  // Wind indicator (top-left corner)
  drawWindIndicator(ctx, game.windDir);

  ctx.textAlign = 'left';
}

function drawWindIndicator(ctx: CanvasRenderingContext2D, windDir: number): void {
  const cx = 50;
  const cy = 50;
  const r = 28;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  // Wind blows FROM windDir toward the ship; draw an arrow pointing in the
  // direction the wind travels (opposite of windDir).
  const fromAngle = facingAngle(windDir);
  const toAngle = fromAngle + Math.PI;

  ctx.translate(cx, cy);
  ctx.rotate(toAngle);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, 0);
  ctx.lineTo(r * 0.8, 0);
  ctx.lineTo(r * 0.4, -r * 0.3);
  ctx.moveTo(r * 0.8, 0);
  ctx.lineTo(r * 0.4, r * 0.3);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WIND', cx, cy + r + 18);
}

// Compute the hexes used to highlight firing arcs from `ship`'s position.
export function arcHexesFor(ship: Ship): { port: Hex[]; starboard: Hex[] } {
  const port = [neighbor(ship.pos, (ship.facing + 1) % 6), neighbor(ship.pos, (ship.facing + 2) % 6)];
  const starboard = [neighbor(ship.pos, (ship.facing + 4) % 6), neighbor(ship.pos, (ship.facing + 5) % 6)];
  return { port, starboard };
}
