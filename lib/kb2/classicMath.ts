import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const COLS = 3;
export const ROWS = 3;
export const CELLS = 9;
export const LINES: number[][] = [[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]];
export const PAY = [4, 10, 25, 60];
export const TIER_OF = [0, 0, 1, 1, 2, 3];
export const NAMES = ["Cherry", "Lemon", "Bell", "Bar", "Seven", "Diamond"];

export interface Outcome { t: number; l: number; w: number; full: boolean; }
export const OUTCOMES: Outcome[] = [
  { t: 0, l: 1, w: 520, full: false },
  { t: 1, l: 1, w: 300, full: false },
  { t: 2, l: 1, w: 150, full: false },
  { t: 3, l: 1, w: 60, full: false },
  { t: 0, l: 3, w: 70, full: false },
  { t: 1, l: 3, w: 34, full: false },
  { t: 2, l: 3, w: 12, full: false },
  { t: 3, l: 3, w: 3, full: false },
  { t: 2, l: 5, w: 1, full: false },
  { t: 3, l: 5, w: 0.2, full: false },
  { t: 3, l: 5, w: 0.02, full: true }
];

export function outcomeMult(o: Outcome): number {
  if (o.full) return 500;
  return r2((o.l * PAY[o.t]) / LINES.length);
}

function loseWeight(rtp: number): number {
  let s = 0; let w = 0;
  OUTCOMES.forEach(function (o) { s += o.w * outcomeMult(o); w += o.w; });
  return Math.max(0.0001, s / Math.max(0.02, rtp) - w);
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

export interface LineWin { line: number; symbol: number; mult: number; cells: number[]; }

export function cellIndex(col: number, row: number): number { return col * ROWS + row; }

export function evaluate(grid: number[]): LineWin[] {
  const wins: LineWin[] = [];
  LINES.forEach(function (path, li) {
    const a = grid[cellIndex(0, path[0])];
    const b = grid[cellIndex(1, path[1])];
    const cc = grid[cellIndex(2, path[2])];
    if (a === b && b === cc) {
      const tier = TIER_OF[a] ?? 0;
      wins.push({ line: li, symbol: a, mult: r2(PAY[tier] / LINES.length), cells: [cellIndex(0, path[0]), cellIndex(1, path[1]), cellIndex(2, path[2])] });
    }
  });
  return wins;
}

export interface ClassicResult {
  grid: number[];
  wins: LineWin[];
  totalMult: number;
  full: boolean;
  fullSymbol: number;
  tier: number;
}

export function spinOnce(rtp: number): ClassicResult {
  const hit = pickOutcome(rtp);
  const grid: number[] = Array.from({ length: CELLS }, function () { return Math.floor(rnd() * 6); });
  let tier = -1;
  let full = false;
  let fullSymbol = -1;
  if (hit) {
    const pool: number[] = [];
    for (let s = 0; s < 6; s++) if ((TIER_OF[s] ?? 0) === hit.t) pool.push(s);
    const symbol = pool[Math.floor(rnd() * pool.length)] ?? 0;
    if (hit.full) {
      for (let i = 0; i < CELLS; i++) grid[i] = symbol;
      full = true; fullSymbol = symbol; tier = 4;
      return { grid: grid, wins: evaluate(grid), totalMult: 500, full: true, fullSymbol: symbol, tier: 4 };
    }
    const order = LINES.map(function (_, i) { return i; });
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
    const chosen = order.slice(0, hit.l);
    const locked: number[] = [];
    chosen.forEach(function (li) {
      const path = LINES[li];
      for (let c = 0; c < COLS; c++) { const k = cellIndex(c, path[c]); grid[k] = symbol; locked.push(k); }
    });
    const want = outcomeMult(hit);
    for (let guard = 0; guard < 60; guard++) {
      const wins = evaluate(grid);
      const sum = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
      if (Math.abs(sum - want) < 0.005) break;
      let broke = false;
      for (const w of wins) {
        if (chosen.indexOf(w.line) >= 0) continue;
        for (const cell of w.cells) {
          if (locked.indexOf(cell) >= 0) continue;
          grid[cell] = (grid[cell] + 1) % 6;
          broke = true; break;
        }
        if (broke) break;
      }
      if (!broke) {
        for (let i = 0; i < CELLS; i++) {
          if (locked.indexOf(i) < 0) grid[i] = (symbol + 1 + (i % 5)) % 6;
        }
        const again = evaluate(grid);
        const s2 = r2(again.reduce(function (a, w) { return a + w.mult; }, 0));
        if (Math.abs(s2 - want) < 0.005) break;
        break;
      }
    }
    tier = hit.t;
  } else {
    for (let guard = 0; guard < 50; guard++) {
      const wins = evaluate(grid);
      if (wins.length === 0) break;
      const w = wins[0];
      grid[w.cells[Math.floor(rnd() * 3)]] = (grid[w.cells[0]] + 1) % 6;
    }
  }
  const wins = evaluate(grid);
  const totalMult = r2(wins.reduce(function (a, w) { return a + w.mult; }, 0));
  return { grid: grid, wins: wins, totalMult: totalMult, full: full, fullSymbol: fullSymbol, tier: tier };
}

export interface ClassicConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
}

export const CLASSIC_GAMES: ClassicConfig[] = [
  { slug: "tripleember", name: "Triple Ember", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#2a0604,#7a1f06 42%,#1a0402)", frame: "#ff9f43", maxWin: "x500", vol: "Medium", tag: "Fruit Three", badge: "NEW" },
  { slug: "bellreserve", name: "Bell Reserve", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x500", vol: "Low", tag: "Classic Bells", badge: "LIVE" },
  { slug: "sevensvault", name: "Sevens Vault", accent: "#f43f5e", accent2: "#fecdd3", felt: "linear-gradient(170deg,#180307,#5e0b1c 42%,#0d0204)", frame: "#fda4af", maxWin: "x500", vol: "High", tag: "Red Sevens", badge: "HOT" },
  { slug: "citrusreels", name: "Citrus Reels", accent: "#facc15", accent2: "#4ade80", felt: "linear-gradient(170deg,#1c1002,#4d3f04 42%,#100a01)", frame: "#fde68a", maxWin: "x500", vol: "Low", tag: "Lemon Lines", badge: "NEW" },
  { slug: "barclassic", name: "Bar Classic", accent: "#93c5fd", accent2: "#e0f2fe", felt: "linear-gradient(170deg,#020617,#0b2a6d 42%,#01040c)", frame: "#bfdbfe", maxWin: "x500", vol: "Medium", tag: "Bar Stack", badge: "NEW" },
  { slug: "diamondtrio", name: "Diamond Trio", accent: "#22d3ee", accent2: "#9dc4ff", felt: "linear-gradient(170deg,#03151c,#0a4d5e 42%,#020c11)", frame: "#7fe3f5", maxWin: "x500", vol: "High", tag: "Gem Trio", badge: "HOT" },
  { slug: "orchardthree", name: "Orchard Three", accent: "#4ade80", accent2: "#bef264", felt: "linear-gradient(170deg,#04120a,#0d4d24 42%,#030d07)", frame: "#bef264", maxWin: "x500", vol: "Low", tag: "Garden Reels", badge: "NEW" },
  { slug: "midnightbars", name: "Midnight Bars", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#33145e 42%,#070310)", frame: "#d8b4fe", maxWin: "x500", vol: "Medium", tag: "Night Sevens", badge: "LIVE" }
];

export function classicBySlug(slug: string): ClassicConfig {
  const hit = CLASSIC_GAMES.find(function (g) { return g.slug === slug; });
  return hit || CLASSIC_GAMES[0];
}