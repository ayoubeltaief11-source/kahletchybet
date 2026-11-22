import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const KENO_NUMBERS = 80;
export const KENO_DRAWS = 20;

export function kenoDraw(): number[] {
  const pool: number[] = Array.from({ length: KENO_NUMBERS }, function (_, i) { return i + 1; });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, KENO_DRAWS).sort(function (a, b) { return a - b; });
}

export function kenoMultiplier(picks: number, hits: number): number {
  const table: Record<number, number[]> = {
    1: [0, 3.5],
    2: [0, 1.5, 9],
    3: [0, 0, 2.5, 25],
    4: [0, 0, 1.5, 8, 80],
    5: [0, 0, 1, 3, 15, 200],
    6: [0, 0, 0.5, 2, 10, 50, 500],
    7: [0, 0, 0.5, 1.5, 5, 20, 100, 1000],
    8: [0, 0, 0.5, 1, 3, 12, 50, 200, 2000],
    9: [0, 0, 0.5, 1, 2, 8, 30, 100, 500, 5000],
    10: [0, 0, 0.5, 1, 2, 5, 20, 60, 200, 1000, 10000]
  };
  const row = table[picks] || [];
  return row[hits] || 0;
}

export const TOWER_ROWS = 8;
export const TOWER_COLS = 8;
export const TOWER_MINES = 8;

export function generateTower(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < TOWER_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < TOWER_COLS; c++) row.push(0);
    const mines: number[] = [];
    while (mines.length < TOWER_MINES) {
      const pos = Math.floor(rnd() * TOWER_COLS);
      if (mines.indexOf(pos) < 0) mines.push(pos);
    }
    mines.forEach(function (m) { row[m] = 1; });
    grid.push(row);
  }
  return grid;
}

export function towerMultiplier(row: number): number {
  if (row === 0) return 1;
  const safe = TOWER_COLS - TOWER_MINES;
  const prob = Math.pow(safe / TOWER_COLS, row);
  return r2(0.95 / prob);
}

export interface InstantConfig {
  slug: string; name: string; type: "keno" | "tower";
  accent: string; accent2: string; felt: string; frame: string;
  maxWin: string; vol: string; tag: string; badge: string;
}

export const INSTANT2_GAMES: InstantConfig[] = [
  { slug: "keno-classic", name: "Classic Keno", type: "keno", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 42%,#01040c)", frame: "#93c5fd", maxWin: "x10000", vol: "High", tag: "Pick 1-10", badge: "LIVE" },
  { slug: "keno-neon", name: "Neon Keno", type: "keno", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x10000", vol: "High", tag: "Glow Picks", badge: "NEW" },
  { slug: "keno-gold", name: "Golden Keno", type: "keno", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x10000", vol: "High", tag: "High Roller", badge: "HOT" },
  { slug: "tower-classic", name: "Tower Climb", type: "tower", accent: "#12d18e", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 42%,#03100b)", frame: "#6ee7b7", maxWin: "x100", vol: "Medium", tag: "8x8 Grid", badge: "LIVE" },
  { slug: "tower-neon", name: "Neon Tower", type: "tower", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x100", vol: "Medium", tag: "Glow Climb", badge: "NEW" },
  { slug: "tower-gold", name: "Golden Tower", type: "tower", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x100", vol: "Medium", tag: "High Stakes", badge: "HOT" }
];

export function instant2BySlug(slug: string): InstantConfig {
  const hit = INSTANT2_GAMES.find(function (g) { return g.slug === slug; });
  return hit || INSTANT2_GAMES[0];
}