import { directionSteps, hexDistance, neighbor } from './hex';
import type { GameState } from './gameState';
import type { Ship } from './types';

// MOVEMENT / WIND

// Point of sail (0-3 hex-steps between facing and wind source direction):
//   0 = in irons (dead into the wind)        -> 0 movement
//   1 = close-hauled                          -> 1 movement
//   2 = reach (fastest point of sail)         -> speedClass + 1
//   3 = running before the wind               -> speedClass
export function pointOfSail(ship: Ship, windDir: number): number {
  return directionSteps(ship.facing, windDir);
}

export function movementAllowance(ship: Ship, windDir: number): number {
  const steps = pointOfSail(ship, windDir);
  let allowance: number;
  switch (steps) {
    case 0:
      allowance = 0;
      break;
    case 1:
      allowance = 1;
      break;
    case 2:
      allowance = ship.speedClass + 1;
      break;
    default:
      allowance = ship.speedClass;
      break;
  }

  if (ship.sailSetting === 'battle') {
    allowance = Math.max(0, allowance - 1);
  }

  const riggingMult = Math.max(0.2, ship.rigging / ship.riggingMax);
  return Math.floor(allowance * riggingMult);
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

// Turn the ship's facing by one hex-step (dir = +1 for starboard/right, -1 for port/left).
// Limited by `handling` turns per activation.
export function turnShip(ship: Ship, dir: 1 | -1): ActionResult {
  if (ship.turnsUsed >= ship.handling) {
    return { ok: false, message: `${ship.name} cannot turn further this activation (handling ${ship.handling}).` };
  }
  ship.facing = ((ship.facing + dir) % 6 + 6) % 6;
  ship.turnsUsed += 1;
  return { ok: true, message: `${ship.name} turns to heading ${ship.facing}.` };
}

// Move the ship forward one hex in its current facing direction.
export function moveShip(ship: Ship, game: GameState): ActionResult {
  const allowance = movementAllowance(ship, game.windDir);
  if (ship.movesUsed >= allowance) {
    if (allowance === 0) {
      return { ok: false, message: `${ship.name} is in irons and cannot make way.` };
    }
    return { ok: false, message: `${ship.name} has used its full movement allowance (${allowance}) this turn.` };
  }
  const dest = neighbor(ship.pos, ship.facing);
  if (hexDistance(dest, { q: 0, r: 0 }) > game.mapRadius) {
    return { ok: false, message: `${ship.name} cannot sail beyond the edge of the map.` };
  }
  ship.pos = dest;
  ship.movesUsed += 1;
  return { ok: true, message: `${ship.name} moves to (${dest.q}, ${dest.r}).` };
}
