// Axial coordinates, pointy-top hexes.
// 6 directions (0-5) used for both ship facing and wind direction:
//   0 = E, 1 = NE, 2 = NW, 3 = W, 4 = SW, 5 = SE

export interface Hex {
  q: number;
  r: number;
}

export const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },   // 0: E
  { q: 1, r: -1 },  // 1: NE
  { q: 0, r: -1 },  // 2: NW
  { q: -1, r: 0 },  // 3: W
  { q: -1, r: 1 },  // 4: SW
  { q: 0, r: 1 },   // 5: SE
];

export const DIRECTION_NAMES = ['E', 'NE', 'NW', 'W', 'SW', 'SE'];

export function hexEquals(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexAdd(a: Hex, b: Hex): Hex {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function neighbor(hex: Hex, direction: number): Hex {
  const d = DIRECTIONS[((direction % 6) + 6) % 6];
  return hexAdd(hex, d);
}

export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// Smallest signed step difference between two directions (-3..3)
export function directionDiff(a: number, b: number): number {
  let diff = (b - a) % 6;
  if (diff > 3) diff -= 6;
  if (diff < -3) diff += 6;
  return diff;
}

// Unsigned hex-step difference (0..3)
export function directionSteps(a: number, b: number): number {
  return Math.abs(directionDiff(a, b));
}

// Direction (0-5) of the hex-step from `a` toward `b`. Returns null if a === b.
export function bearingDirection(a: Hex, b: Hex): number | null {
  if (hexEquals(a, b)) return null;
  // Convert axial to a continuous angle, then snap to nearest of the 6 directions.
  const x = b.q - a.q + (b.r - a.r) * 0.5;
  const y = (b.r - a.r) * (Math.sqrt(3) / 2);
  let angle = Math.atan2(y, x);
  if (angle < 0) angle += 2 * Math.PI;
  const dirAngles = DIRECTIONS.map((d) => {
    const dx = d.q + d.r * 0.5;
    const dy = d.r * (Math.sqrt(3) / 2);
    let a2 = Math.atan2(dy, dx);
    if (a2 < 0) a2 += 2 * Math.PI;
    return a2;
  });
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < 6; i++) {
    let diff = Math.abs(angle - dirAngles[i]);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

const HEX_SIZE = 32; // pixel radius

export function axialToPixel(hex: Hex): { x: number; y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = HEX_SIZE * (1.5 * hex.r);
  return { x, y };
}

export function pixelToAxial(x: number, y: number): Hex {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / HEX_SIZE;
  const r = ((2 / 3) * y) / HEX_SIZE;
  return hexRound({ q, r });
}

function hexRound(h: Hex): Hex {
  let q = Math.round(h.q);
  let r = Math.round(h.r);
  const s = -h.q - h.r;
  let sRounded = Math.round(s);
  const qDiff = Math.abs(q - h.q);
  const rDiff = Math.abs(r - h.r);
  const sDiff = Math.abs(sRounded - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - sRounded;
  } else if (rDiff > sDiff) {
    r = -q - sRounded;
  }
  return { q, r };
}

export function hexCorners(center: { x: number; y: number }): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: center.x + HEX_SIZE * Math.cos(angle),
      y: center.y + HEX_SIZE * Math.sin(angle),
    });
  }
  return corners;
}

export { HEX_SIZE };
