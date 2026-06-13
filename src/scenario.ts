import { createFrigate, createShipOfTheLine } from './ships';
import type { GameStateData } from './types';

export function createScenario(): GameStateData {
  const playerShip = createShipOfTheLine({
    pos: { q: -4, r: 0 },
    facing: 0, // facing E
  });

  const aiShip = createFrigate({
    pos: { q: 4, r: -1 },
    facing: 3, // facing W
  });

  return {
    ships: [playerShip, aiShip],
    turnNumber: 1,
    windDir: 2, // wind blowing from the NW
    mapRadius: 6,
  };
}
