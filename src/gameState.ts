import type { GameStateData, Ship } from './types';

export class GameState {
  ships: Ship[];
  turnNumber: number;
  windDir: number;
  mapRadius: number;

  constructor(data: GameStateData) {
    this.ships = data.ships;
    this.turnNumber = data.turnNumber;
    this.windDir = data.windDir;
    this.mapRadius = data.mapRadius;
  }

  livingShips(): Ship[] {
    return this.ships.filter((s) => s.alive && !s.surrendered && !this.isSunk(s));
  }

  isSunk(ship: Ship): boolean {
    return ship.hull <= 0;
  }

  isDismasted(ship: Ship): boolean {
    return ship.rigging <= 0;
  }

  startTurn(): void {
    for (const s of this.livingShips()) {
      s.ap = s.apMax;
      s.turnsUsed = 0;
      s.movesUsed = 0;
    }
  }

  // Returns the next ship (in fleet order) that still has AP to spend, or null.
  nextActiveShip(): Ship | null {
    const living = this.livingShips();
    return living.find((s) => s.ap > 0) ?? null;
  }

  anyShipHasAp(): boolean {
    return this.livingShips().some((s) => s.ap > 0);
  }

  checkVictory(): string | null {
    const nationsAlive = new Set<string>();
    for (const s of this.ships) {
      if (s.alive && !s.surrendered && !this.isSunk(s)) {
        nationsAlive.add(s.nation);
      }
    }
    if (nationsAlive.size === 0) {
      return 'Mutual destruction. Nobody sails home.';
    } else if (nationsAlive.size === 1) {
      const winner = [...nationsAlive][0];
      return `${winner} wins!`;
    }
    return null;
  }
}
