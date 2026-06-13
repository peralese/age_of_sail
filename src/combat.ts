import { bearingDirection, hexDistance } from './hex';
import type { AmmoType, Ship, Side } from './types';

// ARCS
//
// A ship's 6 hex-neighbors map onto firing arcs relative to its facing (bow):
//   bow    = facing
//   port   = facing+1, facing+2  (left/counter-clockwise side)
//   stern  = facing+3
//   starboard = facing+4, facing+5 (right/clockwise side)

export function canFirePort(facing: number, bearing: number): boolean {
  const port1 = (facing + 1) % 6;
  const port2 = (facing + 2) % 6;
  return bearing === port1 || bearing === port2;
}

export function canFireStarboard(facing: number, bearing: number): boolean {
  const star1 = (facing + 4) % 6;
  const star2 = (facing + 5) % 6;
  return bearing === star1 || bearing === star2;
}

export interface FireResult {
  ok: boolean;
  message: string;
  sunk?: boolean;
  surrendered?: boolean;
}

export function fireBroadside(attacker: Ship, defender: Ship, preferredSide: Side | null): FireResult {
  if (attacker.surrendered || defender.surrendered) {
    return { ok: false, message: 'No effect: one ship already surrendered.' };
  }
  if (attacker.hull <= 0 || defender.hull <= 0) {
    return { ok: false, message: 'No effect: one ship already sunk.' };
  }
  if (!attacker.loadedAmmo) {
    return { ok: false, message: `${attacker.name}'s guns are unloaded. Load shot before firing.` };
  }

  const bearing = bearingDirection(attacker.pos, defender.pos);
  if (bearing === null) {
    return { ok: false, message: `${attacker.name} cannot fire on its own position.` };
  }
  const rng = hexDistance(attacker.pos, defender.pos);

  const canPort = canFirePort(attacker.facing, bearing);
  const canStar = canFireStarboard(attacker.facing, bearing);

  if (!canPort && !canStar) {
    return { ok: false, message: `${attacker.name} cannot bear on target.` };
  }

  // Choose firing side
  let firingSide: Side | null = null;
  if (preferredSide === 'port' && canPort) firingSide = 'port';
  else if (preferredSide === 'starboard' && canStar) firingSide = 'starboard';

  if (firingSide === null) {
    if (canPort && canStar) {
      firingSide = 'port';
    } else if (canPort) {
      firingSide = 'port';
    } else {
      firingSide = 'starboard';
    }
  }

  const baseFirepower = firingSide === 'port' ? attacker.gunsPort : attacker.gunsStarboard;

  // Range bands (in hexes): point-blank (1), close (2-3), long (4-6), beyond = out of range.
  let rngMult: number;
  if (rng <= 1) {
    rngMult = 1.2;
  } else if (rng <= 3) {
    rngMult = 1.0;
  } else if (rng <= 6) {
    rngMult = 0.5;
  } else {
    return { ok: false, message: `Out of range (~${rng}).` };
  }

  // Ammo effects (based on attacker's currently loaded ammo)
  const ammo: AmmoType = attacker.loadedAmmo;
  let hullMult = 1.0;
  let rigMult = 1.0;
  let crewMult = 1.0;

  if (ammo === 'chain') {
    if (rng > 3) {
      return { ok: false, message: `Out of range for chain shot (~${rng}).` };
    }
    hullMult = 0.5;
    rigMult = 2.0;
    crewMult = 0.8;
  } else if (ammo === 'double') {
    if (rng > 1) {
      return { ok: false, message: `Out of range for double-shot (~${rng}).` };
    }
    crewMult = 2.0;
  }

  const rawDamage = baseFirepower * rngMult;
  const variance = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
  const dmg = rawDamage * variance;

  // Damage split: 60% hull, 30% rigging, 10% crew
  const hullDmg = dmg * 0.6 * hullMult;
  const rigDmg = dmg * 0.3 * rigMult;
  const crewDmg = dmg * 0.1 * crewMult;

  defender.hull = Math.max(0, defender.hull - hullDmg);
  defender.rigging = Math.max(0, defender.rigging - rigDmg);
  defender.crew = Math.round(Math.max(0, defender.crew - crewDmg));

  let sunk = false;
  if (defender.hull <= 0) {
    defender.alive = false;
    sunk = true;
  }

  const surrenderedNow = moraleCheck(defender);

  let message =
    `${attacker.name} fires ${firingSide} broadside at ${defender.name}!\n` +
    `Range ${rng}. Damage dealt: Hull -${hullDmg.toFixed(1)}, Rigging -${rigDmg.toFixed(1)}, Crew -${crewDmg.toFixed(1)}.`;

  // After firing, guns are unloaded and must be reloaded before the next shot.
  attacker.loadedAmmo = null;

  if (sunk) {
    message += `\n${defender.name} is sinking!`;
  } else if (surrenderedNow) {
    message += `\n${defender.name} strikes their colors!`;
  }

  return { ok: true, message, sunk, surrendered: surrenderedNow };
}

// Crude morale: if hull or crew drop below 30%, roll 1d6; on a 1, surrender.
export function moraleCheck(ship: Ship): boolean {
  const hullRatio = ship.hull / ship.hullMax;
  const crewRatio = ship.crew / ship.crewMax;
  if (hullRatio < 0.3 || crewRatio < 0.3) {
    const roll = 1 + Math.floor(Math.random() * 6);
    if (roll === 1) {
      ship.surrendered = true;
      return true;
    }
  }
  return false;
}
