import type { Hex } from './hex';
import type { Ship } from './types';

export interface ShipConfig {
  name: string;
  nation: string;
  isPlayer: boolean;
  hullMax: number;
  riggingMax: number;
  crewMax: number;
  gunsPort: number;
  gunsStarboard: number;
  handling: number;
  speedClass: number;
  pos: Hex;
  facing: number;
}

export function createShip(cfg: ShipConfig): Ship {
  return {
    name: cfg.name,
    nation: cfg.nation,
    isPlayer: cfg.isPlayer,

    hullMax: cfg.hullMax,
    hull: cfg.hullMax,
    riggingMax: cfg.riggingMax,
    rigging: cfg.riggingMax,
    crewMax: cfg.crewMax,
    crew: cfg.crewMax,

    gunsPort: cfg.gunsPort,
    gunsStarboard: cfg.gunsStarboard,

    handling: cfg.handling,
    speedClass: cfg.speedClass,

    pos: { q: cfg.pos.q, r: cfg.pos.r },
    facing: cfg.facing,

    alive: true,
    surrendered: false,

    sailSetting: 'battle',
    ammoType: 'round',
    loadedAmmo: null,

    apMax: 4,
    ap: 0,

    turnsUsed: 0,
    movesUsed: 0,
  };
}

// 74-gun ship of the line: slow, tough, heavy guns.
export function createShipOfTheLine(overrides: Partial<ShipConfig> & Pick<ShipConfig, 'pos' | 'facing'>): Ship {
  return createShip({
    name: 'HMS Resolute',
    nation: 'Royal Navy',
    isPlayer: true,
    hullMax: 100,
    riggingMax: 80,
    crewMax: 90,
    gunsPort: 30,
    gunsStarboard: 30,
    handling: 1,
    speedClass: 2,
    ...overrides,
  });
}

// 38-gun frigate: faster, lighter, more nimble.
export function createFrigate(overrides: Partial<ShipConfig> & Pick<ShipConfig, 'pos' | 'facing'>): Ship {
  return createShip({
    name: 'Glorieuse',
    nation: 'French Navy',
    isPlayer: false,
    hullMax: 80,
    riggingMax: 70,
    crewMax: 75,
    gunsPort: 22,
    gunsStarboard: 22,
    handling: 2,
    speedClass: 3,
    ...overrides,
  });
}
