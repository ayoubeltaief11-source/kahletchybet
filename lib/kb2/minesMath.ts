import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const GRID_SIZE = 25;

export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

export function minesMultiplier(mines: number, revealed: number, rtp: number): number {
  if (revealed === 0) return 1;
  const safe = GRID_SIZE - mines;
  if (revealed > safe) return 0;
  const fair = comb(GRID_SIZE, revealed) / comb(safe, revealed);
  return r2(fair * rtp);
}

export function generateMines(mines: number): number[] {
  const positions: number[] = [];
  while (positions.length < mines) {
    const pos = Math.floor(rnd() * GRID_SIZE);
    if (positions.indexOf(pos) < 0) positions.push(pos);
  }
  return positions.sort(function (a, b) { return a - b; });
}

export interface MinesConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
  defaultMines: number;
}

export const MINES_GAMES: MinesConfig[] = [
  { slug: "classic", name: "Classic Mines", accent: "#12d18e", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 42%,#03100b)", frame: "#6ee7b7", maxWin: "x100", vol: "High", tag: "5x5 Grid", badge: "LIVE", defaultMines: 3 },
  { slug: "gems", name: "Gem Mines", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x100", vol: "High", tag: "Crystal Grid", badge: "NEW", defaultMines: 5 },
  { slug: "treasure", name: "Treasure Hunt", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x100", vol: "Medium", tag: "Gold Grid", badge: "HOT", defaultMines: 4 },
  { slug: "speed", name: "Speed Mines", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 42%,#120302)", frame: "#ff9f43", maxWin: "x100", vol: "High", tag: "Fast Grid", badge: "NEW", defaultMines: 6 }
];

export function minesBySlug(slug: string): MinesConfig {
  const hit = MINES_GAMES.find(function (g) { return g.slug === slug; });
  return hit || MINES_GAMES[0];
}