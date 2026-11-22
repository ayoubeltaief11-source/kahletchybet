import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const REELS = 5;
export const WILD = 8;
export const SCATTER = 9;
export const P_FREE = 0.01;
export const FREE_AWARD = 10;
export const FREE_MULTS = [1, 2, 3, 5];

export const LINES3: number[][] = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
  [2,1,1,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,0,1,0],[2,1,2,1,2],
  [1,1,0,1,1],[1,1,2,1,1],[0,2,0,2,0],[2,0,2,0,2],[0,2,2,2,0]
];
export const LINES4: number[][] = LINES3.concat([
  [3,3,3,3,3],[0,1,2,3,2],[3,2,1,0,1],[1,2,3,2,1],[2,3,2,1,0],
  [0,0,0,1,1],[3,3,3,2,2],[1,1,2,3,3],[2,2,1,0,0],[0,3,0,3,0],
  [3,0,3,0,3],[1,3,1,3,1],[2,0,2,0,2],[0,2,3,2,0],[3,1,0,1,3],
  [1,0,3,0,1],[2,3,0,3,2],[0,1,1,2,3],[3,2,2,1,0],[1,2,2,3,0]
]);

export const PAY: number[][] = [
  [0,0,0,5,15,40],
  [0,0,0,10,40,120],
  [0,0,0,25,120,500]
];
export const TIER_OF = [0,0,0,0,1,1,1,2];

export interface Outcome { t: number; n: number; l: number; w: number; }
export const OUTCOMES: Outcome[] = [
  { t: 0, n: 3, l: 1, w: 300 },
  { t: 1, n: 3, l: 1, w: 220 },
  { t: 0, n: 4, l: 1, w: 180 },
  { t: 2, n: 3, l: 1, w: 150 },
  { t: 1, n: 4, l: 1, w: 130 },
  { t: 0, n: 5, l: 1, w: 100 },
  { t: 2, n: 4, l: 1, w: 80 },
  { t: 1, n: 5, l: 1, w: 60 },
  { t: 2, n: 5, l: 1, w: 40 },
  { t: 2, n: 5, l: 3, w: 12 },
  { t: 2, n: 5, l: 8, w: 3 },
  { t: 2, n: 5, l: 20, w: 0.6 }
];

export function outcomeMult(o: Outcome, lineCount: number): number {
  return r2((o.l * PAY[o.t][o.n]) / lineCount);
}

function freeFactor(): number {
  const avg = FREE_MULTS.reduce(function (a, b) { return a + b; }, 0) / FREE_MULTS.length;
  return 1 + P_FREE * FREE_AWARD * avg;
}

function loseWeight(rtp: number, lineCount: number): number {
  const target = rtp / freeFactor();
  let s = 0; let w = 0;
  OUTCOMES.forEach(function (o) { s += o.w * outcomeMult(o, lineCount); w += o.w; });
  return Math.max(0.0001, s / Math.max(0.02, target) - w);
}

function pickOutcome(rtp: number, lineCount: number): Outcome | null {
  const lw = loseWeight(rtp, lineCount);
  let total = lw;
  OUTCOMES.forEach(function (o) { total += o.w; });
  let roll = rnd() * total - lw;
  if (roll < 0) return null;
  for (const o of OUTCOMES) { roll -= o.w; if (roll <= 0) return o; }
  return null;
}

export interface LineWin { line: number; symbol: number; count: number; mult: number; cells: number[]; }

export function idx(col: number, row: number, rows: number): number { return col * rows + row; }

export function evaluate(grid: number[], rows: number, lines: number[][], stakeMult: number): LineWin[] {
  const wins: LineWin[] = [];
  const lc = lines.length;
  lines.forEach(function (path, li) {
    let first = -1;
    for (let c = 0; c < REELS; c++) {
      const v = grid[idx(c, path[c], rows)];
      if (v === SCATTER) break;
      if (v !== WILD) { first = v; break; }
    }
    if (first < 0) first = WILD;
    let count = 0;
    const cells: number[] = [];
    for (let c = 0; c < REELS; c++) {
      const v = grid[idx(c, path[c], rows)];
      if (v === first || v === WILD) { count += 1; cells.push(idx(c, path[c], rows)); } else break;
    }
    if (count >= 3 && first !== WILD) {
      const tier = TIER_OF[first] ?? 0;
      const pay = PAY[tier][count];
      if (pay > 0) wins.push({ line: li, symbol: first, count: count, mult: r2((pay * stakeMult) / lc), cells: cells });
    }
  });
  return wins;
}

function randomFill(rows: number): number[] {
  const g: number[] = [];
  for (let i = 0; i < REELS * rows; i++) {
    const roll = rnd();
    g.push(roll < 0.045 ? WILD : Math.floor(rnd() * 8));
  }
  return g;
}

export interface SpinResult {
  grid: number[];
  rows: number;
  wins: LineWin[];
  totalMult: number;
  scatters: number[];
  expandCol: number;
  freeMult: number;
  free: boolean;
  tier: number;
}

export function spinOnce(rtp: number, rows: number, free: boolean, streak: number): SpinResult {
  const lines = rows === 4 ? LINES4 : LINES3;
  const lc = lines.length;
  const hit = pickOutcome(rtp, lc);
  let grid = randomFill(rows);
  let tier = -1;
  let chosen: number[] = [];
  if (hit) {
    const symbolPool: number[] = [];
    for (let s = 0; s < 8; s++) if ((TIER_OF[s] ?? 0) === hit.t) symbolPool.push(s);
    const symbol = symbolPool[Math.floor(rnd() * symbolPool.length)] ?? 0;
    const pool = lines.map(function (_, i) { return i; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    chosen = pool.slice(0, Math.min(hit.l, lc));
    const protectedCells: number[] = [];
    chosen.forEach(function (li) {
      const path = lines[li];
      for (let c = 0; c < hit.n; c++) {
        const k = idx(c, path[c], rows);
        grid[k] = rnd() < 0.12 ? WILD : symbol;
        protectedCells.push(k);
      }
      if (hit.n < REELS) {
        const k = idx(hit.n, path[hit.n], rows);
        if (protectedCells.indexOf(k) < 0) { grid[k] = (symbol + 1) % 8; protectedCells.push(k); }
      }
    });
    for (let guard = 0; guard < 46; guard++) {
      const wins = evaluate(grid, rows, lines, 1);
      const sum = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
      const want = outcomeMult(hit, lc);
      if (Math.abs(sum - want) < 0.005) break;
      let broke = false;
      for (const w of wins) {
        if (chosen.indexOf(w.line) >= 0) continue;
        for (const cell of w.cells) {
          if (protectedCells.indexOf(cell) >= 0) continue;
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
    for (let guard = 0; guard < 40; guard++) {
      const wins = evaluate(grid, rows, lines, 1);
      if (wins.length === 0) break;
      const w = wins[0];
      const cell = w.cells[Math.floor(rnd() * w.cells.length)];
      grid[cell] = (grid[cell] + 2) % 8;
    }
  }
  const scatters: number[] = [];
  if (!free && rnd() < P_FREE) {
    const pool: number[] = Array.from({ length: REELS * rows }, function (_, i) { return i; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool.slice(0, 3).forEach(function (i) { scatters.push(i); grid[i] = SCATTER; });
  }
  let expandCol = -1;
  const freeMult = free ? FREE_MULTS[Math.min(FREE_MULTS.length - 1, streak)] : 1;
  if (free && hit && hit.t === 2) {
    expandCol = Math.floor(rnd() * REELS);
    const sym = grid[idx(expandCol, 0, rows)];
    if (sym !== SCATTER && sym !== WILD) {
      for (let r = 0; r < rows; r++) grid[idx(expandCol, r, rows)] = sym;
    }
  }
  const wins = evaluate(grid, rows, lines, freeMult);
  const totalMult = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
  return { grid: grid, rows: rows, wins: wins, totalMult: totalMult, scatters: scatters, expandCol: expandCol, freeMult: freeMult, free: free, tier: tier };
}

export interface LineConfig {
  slug: string; name: string; rows: number; accent: string; accent2: string;
  felt: string; frame: string; mascot: string; set: string; maxWin: string; vol: string; tag: string; badge: string;
}

export const LINE_GAMES: LineConfig[] = [
  { slug: "jadecourt", name: "Jade Court", rows: 3, accent: "#12d18e", accent2: "#ffd97a", felt: "linear-gradient(170deg,#04140f,#0b3a2a 46%,#03100b)", frame: "#ffd97a", mascot: "guardian", set: "jade", maxWin: "x5000", vol: "High", tag: "Expanding Wilds", badge: "NEW" },
  { slug: "emberforge", name: "Ember Forge", rows: 3, accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 46%,#120302)", frame: "#ff9f43", mascot: "smith", set: "forge", maxWin: "x5000", vol: "High", tag: "Forge Respins", badge: "HOT" },
  { slug: "tidecaller", name: "Tidecaller", rows: 4, accent: "#22d3ee", accent2: "#9dc4ff", felt: "linear-gradient(170deg,#03151c,#0a3d4d 46%,#020c11)", frame: "#7fe3f5", mascot: "oracle", set: "tide", maxWin: "x5000", vol: "Medium", tag: "40 Lines", badge: "NEW" },
  { slug: "duskreign", name: "Dusk Reign", rows: 3, accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 46%,#070310)", frame: "#d8b4fe", mascot: "regent", set: "dusk", maxWin: "x5000", vol: "High", tag: "Royal Stacks", badge: "LIVE" },
  { slug: "citrusvault", name: "Citrus Vault", rows: 3, accent: "#facc15", accent2: "#4ade80", felt: "linear-gradient(170deg,#1c1002,#4d2f04 46%,#100a01)", frame: "#fde68a", mascot: "keeper", set: "fruit", maxWin: "x5000", vol: "Low", tag: "Classic Fruits", badge: "NEW" },
  { slug: "ironbloom", name: "Iron Bloom", rows: 4, accent: "#f43f5e", accent2: "#fda4af", felt: "linear-gradient(170deg,#180307,#460b16 46%,#0d0204)", frame: "#fda4af", mascot: "bloom", set: "bloom", maxWin: "x5000", vol: "High", tag: "Bloom Wilds", badge: "HOT" },
  { slug: "stormledger", name: "Storm Ledger", rows: 4, accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 46%,#01040c)", frame: "#93c5fd", mascot: "scribe", set: "storm", maxWin: "x5000", vol: "Medium", tag: "Ledger Multipliers", badge: "LIVE" },
  { slug: "sunspire", name: "Sunspire", rows: 3, accent: "#fb923c", accent2: "#fef08a", felt: "linear-gradient(170deg,#140801,#3d1a03 46%,#0a0501)", frame: "#fde68a", mascot: "herald", set: "sun", maxWin: "x5000", vol: "Medium", tag: "Solar Stacks", badge: "NEW" },
  { slug: "verdantkey", name: "Verdant Key", rows: 3, accent: "#4ade80", accent2: "#bef264", felt: "linear-gradient(170deg,#04120a,#0d3a1e 46%,#030d07)", frame: "#bef264", mascot: "warden", set: "verdant", maxWin: "x5000", vol: "Low", tag: "Garden Lines", badge: "NEW" },
  { slug: "nightvault", name: "Night Vault", rows: 4, accent: "#818cf8", accent2: "#c7d2fe", felt: "linear-gradient(170deg,#050514,#141438 46%,#03030c)", frame: "#c7d2fe", mascot: "sentinel", set: "vault", maxWin: "x5000", vol: "High", tag: "Vault Expansion", badge: "HOT" },
  { slug: "coralcreed", name: "Coral Creed", rows: 3, accent: "#fb7185", accent2: "#fecdd3", felt: "linear-gradient(170deg,#170610,#43102a 46%,#0c0308)", frame: "#fecdd3", mascot: "diver", set: "coral", maxWin: "x5000", vol: "Medium", tag: "Reef Lines", badge: "NEW" },
  { slug: "obsidianoath", name: "Obsidian Oath", rows: 4, accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#0a0a0a,#241c08 46%,#050505)", frame: "#e8b33c", mascot: "oath", set: "obsidian", maxWin: "x5000", vol: "High", tag: "Oath Multipliers", badge: "LIVE" }
];

export function lineBySlug(slug: string): LineConfig {
  const hit = LINE_GAMES.find(function (g) { return g.slug === slug; });
  return hit || LINE_GAMES[0];
}