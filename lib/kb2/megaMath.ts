import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const REELS = 6;
export const MIN_ROWS = 2;
export const MAX_ROWS = 7;
export const WILD = 8;
export const SCATTER = 9;
export const P_FREE = 0.012;
export const FREE_AWARD = 10;
export const FREE_MULTS = [1, 2, 3, 5, 10];

export const PAY: number[][] = [
  [0, 0, 0, 0.05, 0.15, 0.4, 1],
  [0, 0, 0, 0.1, 0.4, 1.2, 3],
  [0, 0, 0, 0.25, 1.2, 4, 12]
];
export const TIER_OF = [0, 0, 0, 0, 1, 1, 1, 2];

export interface Outcome { t: number; k: number; n: number; w: number; }
export const OUTCOMES: Outcome[] = [
  { t: 0, k: 3, n: 1, w: 300 },
  { t: 1, k: 3, n: 1, w: 240 },
  { t: 0, k: 4, n: 1, w: 200 },
  { t: 2, k: 3, n: 1, w: 180 },
  { t: 0, k: 3, n: 2, w: 170 },
  { t: 1, k: 4, n: 1, w: 150 },
  { t: 1, k: 3, n: 2, w: 140 },
  { t: 2, k: 4, n: 1, w: 130 },
  { t: 0, k: 5, n: 1, w: 110 },
  { t: 2, k: 3, n: 2, w: 100 },
  { t: 1, k: 5, n: 1, w: 90 },
  { t: 0, k: 6, n: 1, w: 80 },
  { t: 2, k: 5, n: 1, w: 70 },
  { t: 1, k: 6, n: 1, w: 55 },
  { t: 2, k: 6, n: 1, w: 40 },
  { t: 2, k: 4, n: 2, w: 26 },
  { t: 2, k: 5, n: 2, w: 9 },
  { t: 2, k: 6, n: 2, w: 2.2 },
  { t: 2, k: 5, n: 3, w: 0.5 }
];

export function outcomeMult(o: Outcome): number {
  return r2(PAY[o.t][o.k] * Math.pow(o.n, o.k));
}

function freeFactor(): number {
  const avg = FREE_MULTS.reduce(function (a, b) { return a + b; }, 0) / FREE_MULTS.length;
  return 1 + P_FREE * FREE_AWARD * avg;
}

function loseWeight(rtp: number): number {
  const target = rtp / freeFactor();
  let s = 0; let w = 0;
  OUTCOMES.forEach(function (o) { s += o.w * outcomeMult(o); w += o.w; });
  return Math.max(0.0001, s / Math.max(0.02, target) - w);
}

function pickOutcome(rtp: number): Outcome | null {
  const lw = loseWeight(rtp);
  let total = lw;
  OUTCOMES.forEach(function (o) { total += o.w; });
  let roll = rnd() * total - lw;
  if (roll < 0) return null;
  for (const o of OUTCOMES) { roll -= o.w; if (roll <= 0) return o; }
  return null;
}

export function reelOffset(heights: number[], col: number): number {
  let o = 0;
  for (let i = 0; i < col; i++) o += heights[i];
  return o;
}

export function cellAt(heights: number[], col: number, row: number): number {
  return reelOffset(heights, col) + row;
}

export function totalWays(heights: number[]): number {
  return heights.reduce(function (a, b) { return a * b; }, 1);
}

export interface WayWin { symbol: number; length: number; ways: number; mult: number; cells: number[]; }

export function evaluate(grid: number[], heights: number[], stakeMult: number): WayWin[] {
  const wins: WayWin[] = [];
  for (let s = 0; s < 8; s++) {
    const counts: number[] = [];
    const cells: number[] = [];
    for (let c = 0; c < REELS; c++) {
      let n = 0;
      const local: number[] = [];
      for (let r = 0; r < heights[c]; r++) {
        const i = cellAt(heights, c, r);
        const v = grid[i];
        if (v === s || (v === WILD && c > 0)) { n += 1; local.push(i); }
      }
      if (n === 0) break;
      counts.push(n);
      local.forEach(function (i) { cells.push(i); });
    }
    if (counts.length >= 3) {
      const ways = counts.reduce(function (a, b) { return a * b; }, 1);
      const tier = TIER_OF[s] ?? 0;
      const pay = PAY[tier][counts.length];
      if (pay > 0) wins.push({ symbol: s, length: counts.length, ways: ways, mult: r2(pay * ways * stakeMult), cells: cells });
    }
  }
  return wins;
}

function randomHeights(): number[] {
  const h: number[] = [];
  for (let i = 0; i < REELS; i++) h.push(MIN_ROWS + Math.floor(rnd() * (MAX_ROWS - MIN_ROWS + 1)));
  return h;
}

function randomGrid(heights: number[]): number[] {
  const g: number[] = [];
  const total = heights.reduce(function (a, b) { return a + b; }, 0);
  for (let i = 0; i < total; i++) g.push(Math.floor(rnd() * 8));
  let offset = 0;
  for (let c = 0; c < REELS; c++) {
    if (c > 0 && rnd() < 0.16) {
      const r = Math.floor(rnd() * heights[c]);
      g[offset + r] = WILD;
    }
    offset += heights[c];
  }
  return g;
}

export interface SpinResult {
  grid: number[];
  heights: number[];
  ways: number;
  wins: WayWin[];
  totalMult: number;
  scatters: number[];
  freeMult: number;
  free: boolean;
  tier: number;
}

export function spinOnce(rtp: number, free: boolean, streak: number): SpinResult {
  const hit = pickOutcome(rtp);
  let heights = randomHeights();
  let grid = randomGrid(heights);
  let tier = -1;
  const locked: number[] = [];
  if (hit) {
    for (let c = 0; c < hit.k; c++) if (heights[c] < hit.n) heights[c] = hit.n;
    grid = randomGrid(heights);
    const pool: number[] = [];
    for (let s = 0; s < 8; s++) if ((TIER_OF[s] ?? 0) === hit.t) pool.push(s);
    const symbol = pool[Math.floor(rnd() * pool.length)] ?? 0;
    for (let c = 0; c < hit.k; c++) {
      const rows: number[] = Array.from({ length: heights[c] }, function (_, i) { return i; });
      for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = rows[i]; rows[i] = rows[j]; rows[j] = t; }
      for (let r = 0; r < heights[c]; r++) {
        const i = cellAt(heights, c, r);
        grid[i] = (symbol + 1 + (r % 6)) % 8;
      }
      rows.slice(0, hit.n).forEach(function (r) {
        const i = cellAt(heights, c, r);
        grid[i] = symbol;
        locked.push(i);
      });
    }
    if (hit.k < REELS) {
      for (let r = 0; r < heights[hit.k]; r++) {
        const i = cellAt(heights, hit.k, r);
        grid[i] = (symbol + 2 + (r % 5)) % 8;
        locked.push(i);
      }
    }
    const want = outcomeMult(hit);
    for (let guard = 0; guard < 70; guard++) {
      const wins = evaluate(grid, heights, 1);
      const sum = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
      if (Math.abs(sum - want) < 0.006) break;
      let broke = false;
      for (const w of wins) {
        if (w.symbol === symbol && w.length === hit.k) continue;
        for (const cell of w.cells) {
          if (locked.indexOf(cell) >= 0) continue;
          grid[cell] = (grid[cell] + 3) % 8;
          broke = true;
          break;
        }
        if (broke) break;
      }
      if (!broke) break;
    }
    tier = hit.t;
  } else {
    for (let guard = 0; guard < 60; guard++) {
      const wins = evaluate(grid, heights, 1);
      if (wins.length === 0) break;
      const w = wins[0];
      const cell = w.cells[Math.floor(rnd() * w.cells.length)];
      grid[cell] = (grid[cell] + 2) % 8;
    }
  }
  const scatters: number[] = [];
  if (!free && rnd() < P_FREE) {
    const total = heights.reduce(function (a, b) { return a + b; }, 0);
    const pool: number[] = Array.from({ length: total }, function (_, i) { return i; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool.slice(0, 4).forEach(function (i) { scatters.push(i); grid[i] = SCATTER; });
  }
  const freeMult = free ? FREE_MULTS[Math.min(FREE_MULTS.length - 1, streak)] : 1;
  const wins = evaluate(grid, heights, freeMult);
  const totalMult = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
  return { grid: grid, heights: heights, ways: totalWays(heights), wins: wins, totalMult: totalMult, scatters: scatters, freeMult: freeMult, free: free, tier: tier };
}

export interface MegaConfig {
  slug: string; name: string; accent: string; accent2: string; felt: string; frame: string; set: string; maxWin: string; vol: string; tag: string; badge: string;
}

export const MEGA_GAMES: MegaConfig[] = [
  { slug: "shiftspire", name: "Shiftspire", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#0a0a0a,#241c08 46%,#050505)", frame: "#e8b33c", set: "obsidian", maxWin: "x8748", vol: "High", tag: "Shifting Reels", badge: "NEW" },
  { slug: "tideflux", name: "Tideflux", accent: "#22d3ee", accent2: "#9dc4ff", felt: "linear-gradient(170deg,#03151c,#0a3d4d 46%,#020c11)", frame: "#7fe3f5", set: "tide", maxWin: "x8748", vol: "High", tag: "Flux Ways", badge: "HOT" },
  { slug: "emberdrift", name: "Emberdrift", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 46%,#120302)", frame: "#ff9f43", set: "forge", maxWin: "x8748", vol: "High", tag: "Drift Ways", badge: "NEW" },
  { slug: "verdantflux", name: "Verdantflux", accent: "#4ade80", accent2: "#bef264", felt: "linear-gradient(170deg,#04120a,#0d3a1e 46%,#030d07)", frame: "#bef264", set: "verdant", maxWin: "x8748", vol: "Medium", tag: "Growth Ways", badge: "LIVE" },
  { slug: "duskshift", name: "Duskshift", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 46%,#070310)", frame: "#d8b4fe", set: "dusk", maxWin: "x8748", vol: "High", tag: "Twilight Ways", badge: "NEW" },
  { slug: "coralflux", name: "Coralflux", accent: "#fb7185", accent2: "#fecdd3", felt: "linear-gradient(170deg,#170610,#43102a 46%,#0c0308)", frame: "#fda4af", set: "coral", maxWin: "x8748", vol: "Medium", tag: "Reef Ways", badge: "HOT" },
  { slug: "stormshift", name: "Stormshift", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 46%,#01040c)", frame: "#93c5fd", set: "storm", maxWin: "x8748", vol: "High", tag: "Tempest Ways", badge: "LIVE" },
  { slug: "sunflux", name: "Sunflux", accent: "#fb923c", accent2: "#fef08a", felt: "linear-gradient(170deg,#140801,#3d1a03 46%,#0a0501)", frame: "#fde68a", set: "sun", maxWin: "x8748", vol: "Medium", tag: "Solar Ways", badge: "NEW" }
];

export function megaBySlug(slug: string): MegaConfig {
  const hit = MEGA_GAMES.find(function (g) { return g.slug === slug; });
  return hit || MEGA_GAMES[0];
}