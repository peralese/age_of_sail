import type { Hex } from './hex';

export type SailSetting = 'battle' | 'full';
export type AmmoType = 'round' | 'chain' | 'double';
export type Side = 'port' | 'starboard';

export interface Ship {
  name: string;
  nation: string;
  isPlayer: boolean;

  // Combat stats (current vs max)
  hullMax: number;
  hull: number;
  riggingMax: number;
  rigging: number;
  crewMax: number;
  crew: number;

  // Guns by side (abstract firepower rating)
  gunsPort: number;
  gunsStarboard: number;

  // Maneuverability
  handling: number; // max facing changes per activation
  speedClass: number; // 1-3, baseline movement allowance at best point of sail

  // Position & facing
  pos: Hex;
  facing: number; // 0-5

  // Status
  alive: boolean;
  surrendered: boolean;

  // Tactical state
  sailSetting: SailSetting;
  ammoType: AmmoType; // preferred type when loading
  loadedAmmo: AmmoType | null;

  // Action points per turn
  apMax: number;
  ap: number;

  // Per-activation counters, reset at the start of each turn
  turnsUsed: number;
  movesUsed: number;
}

export interface GameStateData {
  ships: Ship[];
  turnNumber: number;
  windDir: number; // 0-5
  mapRadius: number;
}
