import { randomBytes } from "node:crypto";
import type { KBGame } from "./catalog";
import { WHEEL, isRed } from "./wheel";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const r2 = (n: number): number => Math.round(n * 100) / 100;
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return out;
}

/* ---------- CRASH : P(point >= m) = rtp / m ---------- */
export function crashPoint(rtp: number): number {
  const u = rnd();
  const raw = rtp / (1 - u);
  if (raw < 1) return 1.00;
  return Math.min(1000, Math.floor(raw * 100) / 100);
}

/* ---------- SLOTS : weighted paytable, loss weight solves RTP exactly ---------- */
interface Pay { m: number; w: number; span: number; tier: number; }
const TABLES: Record<string, Pay[]> = {
  classic3: [
    { m: 0.5, w: 1500, span: 3, tier: 0 }, { m: 1.2, w: 700, span: 3, tier: 0 },
    { m: 2,   w: 320,  span: 3, tier: 1 }, { m: 3,   w: 130, span: 3, tier: 1 },
    { m: 8,   w: 34,   span: 3, tier: 2 }, { m: 20,  w: 9,   span: 3, tier: 2 },
    { m: 60,  w: 2,    span: 3, tier: 3 }
  ],
  mega5: [
    { m: 0.4, w: 1700, span: 3, tier: 0 }, { m: 1,   w: 820, span: 3, tier: 0 },
    { m: 1.8, w: 380,  span: 4, tier: 1 }, { m: 3,   w: 150, span: 4, tier: 1 },
    { m: 6,   w: 52,   span: 5, tier: 2 }, { m: 15,  w: 15,  span: 5, tier: 2 },
    { m: 45,  w: 4,    span: 6, tier: 3 }, { m: 250, w: 1,   span: 6, tier: 4 }
  ],
  cluster6: [
    { m: 0.5, w: 1600, span: 8,  tier: 0 }, { m: 1.2, w: 760, span: 9,  tier: 0 },
    { m: 2,   w: 340,  span: 10, tier: 1 }, { m: 3.5, w: 140, span: 11, tier: 1 },
    { m: 7,   w: 46,   span: 12, tier: 2 }, { m: 18,  w: 13,  span: 13, tier: 2 },
    { m: 55,  w: 3,    span: 14, tier: 3 }, { m: 300, w: 1,   span: 16, tier: 4 }
  ],
  jackpot5: [
    { m: 0.5, w: 1650, span: 3, tier: 0 }, { m: 1.2, w: 780, span: 3, tier: 0 },
    { m: 2,   w: 350,  span: 4, tier: 1 }, { m: 3.5, w: 145, span: 4, tier: 1 },
    { m: 8,   w: 48,   span: 5, tier: 2 }, { m: 20,  w: 14,  span: 5, tier: 2 },
    { m: 60,  w: 4,    span: 5, tier: 3 }, { m: 200, w: 1.4, span: 5, tier: 4 },
    { m: 800, w: 0.28, span: 5, tier: 5 }
  ],
  tumble5: [
    { m: 0.4, w: 1750, span: 3, tier: 0 }, { m: 1,   w: 840, span: 3, tier: 0 },
    { m: 1.5, w: 400,  span: 3, tier: 1 }, { m: 2.5, w: 165, span: 4, tier: 1 },
    { m: 5,   w: 58,   span: 4, tier: 2 }, { m: 12,  w: 17,  span: 5, tier: 2 },
    { m: 40,  w: 4.5,  span: 5, tier: 3 }, { m: 180, w: 1,   span: 5, tier: 4 }
  ],
  holdwin: [
    { m: 0.5, w: 1620, span: 3, tier: 0 }, { m: 1.2, w: 770, span: 3, tier: 0 },
    { m: 2,   w: 345,  span: 4, tier: 1 }, { m: 3,   w: 148, span: 4, tier: 1 },
    { m: 7,   w: 50,   span: 5, tier: 2 }, { m: 18,  w: 15,  span: 5, tier: 2 },
    { m: 50,  w: 4,    span: 5, tier: 3 }, { m: 150, w: 1.3, span: 5, tier: 4 },
    { m: 600, w: 0.25, span: 5, tier: 5 }
  ]
};
export interface SpinOut { grid: string[][]; rows: number[]; hits: number[]; mult: number; ways: number; tier: number; }
export function spin(g: KBGame, rtp: number): SpinOut {
  const table = TABLES[g.variant] || TABLES.classic3;
  const mega = g.variant === "mega5";
  const cluster = g.variant === "cluster6";
  const rows: number[] = Array.from({ length: g.reels }, () => mega ? 2 + Math.floor(rnd() * (g.rows - 1)) : g.rows);
  const grid: string[][] = rows.map(n => Array.from({ length: n }, () => pick(g.syms)));
  const offsets: number[] = []; let acc = 0;
  rows.forEach(n => { offsets.push(acc); acc += n; });

  let S = 0, Wsum = 0;
  table.forEach(p => { S += p.w * p.m; Wsum += p.w; });
  const loseW = Math.max(0.0001, S / rtp - Wsum);
  const totalW = Wsum + loseW;
  let roll = rnd() * totalW;
  let chosen: Pay | null = null;
  for (const p of table) { roll -= p.w; if (roll <= 0) { chosen = p; break; } }

  const hits: number[] = [];
  let mult = 0, tier = -1;
  if (chosen) {
    mult = chosen.m; tier = chosen.tier;
    const sym = chosen.tier >= 3 ? g.syms[g.syms.length - 1] : pick(g.syms);
    if (cluster) {
      const count = Math.min(acc, chosen.span + Math.floor(rnd() * 2));
      const cells: number[] = Array.from({ length: acc }, (_, i) => i);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
      cells.slice(0, count).forEach(ix => {
        let c = 0; while (c < rows.length && ix >= offsets[c] + rows[c]) c++;
        if (c < rows.length) { grid[c][ix - offsets[c]] = sym; hits.push(ix); }
      });
    } else {
      const span = Math.min(g.reels, chosen.span);
      const row = Math.floor(rnd() * Math.min.apply(null, rows));
      for (let c = 0; c < span; c++) { const rr = Math.min(row, rows[c] - 1); grid[c][rr] = sym; hits.push(offsets[c] + rr); }
      if (mega && chosen.tier >= 2) {
        for (let c = 0; c < span; c++) { const rr = Math.floor(rnd() * rows[c]); if (hits.indexOf(offsets[c] + rr) < 0) { grid[c][rr] = sym; hits.push(offsets[c] + rr); } }
      }
    }
  }
  const ways = mega ? rows.reduce((a, b) => a * b, 1) : cluster ? 0 : g.reels === 3 ? 5 : 20;
  return { grid, rows, hits, mult, ways, tier };
}

/* ---------- ROULETTE : true 37-pocket payouts ---------- */
export function roulette(bets: Record<string, number>, n: number): number {
  let paid = 0;
  const red = isRed(n), black = n !== 0 && !red;
  Object.keys(bets).forEach(k => {
    const amt = Number(bets[k]) || 0; if (amt <= 0) return;
    if (k.charAt(0) === "n") { if (Number(k.slice(1)) === n) paid += amt * 36; return; }
    if (k === "red" && red) paid += amt * 2;
    else if (k === "black" && black) paid += amt * 2;
    else if (k === "even" && n !== 0 && n % 2 === 0) paid += amt * 2;
    else if (k === "odd" && n % 2 === 1) paid += amt * 2;
    else if (k === "low" && n >= 1 && n <= 18) paid += amt * 2;
    else if (k === "high" && n >= 19 && n <= 36) paid += amt * 2;
    else if (k === "d1" && n >= 1 && n <= 12) paid += amt * 3;
    else if (k === "d2" && n >= 13 && n <= 24) paid += amt * 3;
    else if (k === "d3" && n >= 25 && n <= 36) paid += amt * 3;
  });
  return r2(paid);
}
export function wheelPick(): number { return WHEEL[Math.floor(rnd() * WHEEL.length)]; }

/* ---------- MINES : fair combinatorial multiplier x rtp ---------- */
export const MINE_CELLS = 25;
export function minesMultiplier(mines: number, opened: number, rtp: number): number {
  if (opened <= 0) return 1;
  const safe = MINE_CELLS - mines;
  if (opened > safe) return 0;
  const fair = comb(MINE_CELLS, opened) / comb(safe, opened);
  return r2(fair * rtp);
}
export function minesLayout(mines: number): number[] {
  const cells: number[] = Array.from({ length: MINE_CELLS }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
  return cells.slice(0, mines).sort((a, b) => a - b);
}

/* ---------- DICE : multiplier = rtp / probability ---------- */
export function diceRoll(): number { return Math.floor(rnd() * 10001) / 100; }
export function diceChance(target: number, over: boolean): number {
  return over ? (100 - target) / 100 : target / 100;
}
export function diceMultiplier(target: number, over: boolean, rtp: number): number {
  const p = diceChance(target, over);
  if (p <= 0.0001) return 0;
  return r2(rtp / p);
}

/* ---------- PLINKO : binomial buckets, EV scaled to rtp ---------- */
export const PLINKO_ROWS = 16;
const SHAPE_LOW = [10,3,1.6,1.1,0.6,0.5,0.4,0.3,0.2,0.3,0.4,0.5,0.6,1.1,1.6,3,10];
const SHAPE_MED = [26,5,2.2,1.3,0.7,0.4,0.3,0.2,0.2,0.2,0.3,0.4,0.7,1.3,2.2,5,26];
const SHAPE_HIGH = [110,14,4,1.8,0.6,0.3,0.2,0.1,0.1,0.1,0.2,0.3,0.6,1.8,4,14,110];
export function plinkoTable(risk: string, rtp: number): number[] {
  const shape = risk === "high" ? SHAPE_HIGH : risk === "medium" ? SHAPE_MED : SHAPE_LOW;
  let ev = 0;
  for (let k = 0; k <= PLINKO_ROWS; k++) ev += (comb(PLINKO_ROWS, k) / Math.pow(2, PLINKO_ROWS)) * shape[k];
  const scale = rtp / ev;
  return shape.map(v => r2(v * scale));
}
export function plinkoDrop(): { bucket: number; path: number[] } {
  const path: number[] = []; let b = 0;
  for (let i = 0; i < PLINKO_ROWS; i++) { const d = rnd() < 0.5 ? 0 : 1; path.push(d); b += d; }
  return { bucket: b, path };
}

/* ---------- HI-LO : probability from live card ---------- */
export const HILO_RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];
export function hiloCard(): number { return HILO_RANKS[Math.floor(rnd() * 13)]; }
export function hiloChance(cur: number, higher: boolean): number {
  const idx = HILO_RANKS.indexOf(cur);
  const n = higher ? (12 - idx) : idx;
  return Math.max(0, n) / 12;
}
export function hiloMultiplier(cur: number, higher: boolean, rtp: number): number {
  const p = hiloChance(cur, higher);
  if (p <= 0) return 0;
  return r2(rtp / p);
}

/* ---------- TABLE ---------- */
export function baccarat(): { a: number; b: number } {
  const card = (): number => { const v = 1 + Math.floor(rnd() * 13); return v >= 10 ? 0 : v; };
  let a = (card() + card()) % 10, b = (card() + card()) % 10;
  if (a < 8 && b < 8) { if (a <= 5) a = (a + card()) % 10; if (b <= 5) b = (b + card()) % 10; }
  return { a, b };
}
export function sicboRoll(): number[] { return [1 + Math.floor(rnd() * 6), 1 + Math.floor(rnd() * 6), 1 + Math.floor(rnd() * 6)]; }
export function blackjackDeal(): { p: number[]; d: number[] } {
  const c = (): number => { const v = 1 + Math.floor(rnd() * 13); return v >= 10 ? 10 : v === 1 ? 11 : v; };
  return { p: [c(), c()], d: [c(), c()] };
}
export function bjValue(cs: number[]): number {
  let t = cs.reduce((a, b) => a + b, 0), aces = cs.filter(x => x === 11).length;
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}
export function bjDraw(): number { const v = 1 + Math.floor(rnd() * 13); return v >= 10 ? 10 : v === 1 ? 11 : v; }
