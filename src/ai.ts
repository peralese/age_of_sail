import { bearingDirection, hexDistance, neighbor, type Hex } from './hex';
import { canFirePort, canFireStarboard, fireBroadside } from './combat';
import { movementAllowance, moveShip, turnShip } from './actions';
import type { GameState } from './gameState';
import type { AmmoType, Ship, Side } from './types';

function isInRangeForAmmo(ammo: AmmoType, rng: number): boolean {
  if (rng > 6) return false;
  if (ammo === 'chain' && rng > 3) return false;
  if (ammo === 'double' && rng > 1) return false;
  return true;
}

// Which side (if any) the AI can fire from right now with its currently loaded ammo.
function readyFiringSide(ai: Ship, target: Ship): Side | null {
  if (!ai.loadedAmmo) return null;
  const bearing = bearingDirection(ai.pos, target.pos);
  if (bearing === null) return null;
  const rng = hexDistance(ai.pos, target.pos);
  if (!isInRangeForAmmo(ai.loadedAmmo, rng)) return null;
  if (canFirePort(ai.facing, bearing)) return 'port';
  if (canFireStarboard(ai.facing, bearing)) return 'starboard';
  return null;
}

// Heuristic score for a hypothetical (pos, facing): higher is better.
// Rewards having the target in an arc, and being at "close" range (2-3 hexes).
function scoreState(pos: Hex, facing: number, target: Ship): number {
  const bearing = bearingDirection(pos, target.pos);
  if (bearing === null) return -1000;
  const inArc = canFirePort(facing, bearing) || canFireStarboard(facing, bearing);
  const rng = hexDistance(pos, target.pos);
  const rangeScore = -Math.abs(rng - 2.5);
  return (inArc ? 100 : 0) + rangeScore;
}

type Candidate = { action: 'turn_left' | 'turn_right' | 'move' | 'end'; score: number };

function pickManeuver(ai: Ship, target: Ship, game: GameState): Candidate {
  const candidates: Candidate[] = [];

  // Current state as baseline ("end" option)
  candidates.push({ action: 'end', score: scoreState(ai.pos, ai.facing, target) });

  if (ai.turnsUsed < ai.handling) {
    const leftFacing = ((ai.facing - 1) % 6 + 6) % 6;
    const rightFacing = (ai.facing + 1) % 6;
    candidates.push({ action: 'turn_left', score: scoreState(ai.pos, leftFacing, target) });
    candidates.push({ action: 'turn_right', score: scoreState(ai.pos, rightFacing, target) });
  }

  const allowance = movementAllowance(ai, game.windDir);
  if (ai.movesUsed < allowance) {
    const dest = neighbor(ai.pos, ai.facing);
    if (hexDistance(dest, { q: 0, r: 0 }) <= game.mapRadius) {
      candidates.push({ action: 'move', score: scoreState(dest, ai.facing, target) });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

// Runs the AI's full activation (spends all of its AP), logging each action.
export function runAiActivation(ai: Ship, target: Ship, game: GameState, log: (msg: string) => void): void {
  let iterations = 0;
  while (ai.ap > 0 && iterations < 10) {
    iterations++;

    const side = readyFiringSide(ai, target);
    if (side) {
      const result = fireBroadside(ai, target, side);
      log(result.message);
      ai.ap -= 1;
      continue;
    }

    if (!ai.loadedAmmo) {
      ai.loadedAmmo = ai.ammoType;
      log(`${ai.name} loads ${ai.loadedAmmo} shot.`);
      ai.ap -= 1;
      continue;
    }

    const choice = pickManeuver(ai, target, game);
    if (choice.action === 'end') {
      ai.ap = 0;
      log(`${ai.name} holds course and ends its activation.`);
      break;
    }

    let result;
    if (choice.action === 'turn_left') {
      result = turnShip(ai, -1);
    } else if (choice.action === 'turn_right') {
      result = turnShip(ai, 1);
    } else {
      result = moveShip(ai, game);
    }

    log(result.message);
    if (!result.ok) {
      ai.ap = 0;
      break;
    }
    ai.ap -= 1;
  }
}
