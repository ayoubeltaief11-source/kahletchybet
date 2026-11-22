import { randomBytes } from "node:crypto";

export const COLS = 6;
export const ROWS = 5;
export const CELLS = COLS * ROWS;
export const MIN_CLUSTER = 8;
export const SCATTER = 8;
export const BOMB = 9;
export const FREE_AWARD = 10;
export const P_FREE = 0.008;
export const P_BOMB = 0.22;

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export interface PayRow { m: number; w: number; size: number; }
export const PAYTABLE: PayRow[] = [
  { m: 0.5, w: 700, size: 8 },
  { m: 1, w: 480, size: 9 },
  { m: 2, w: 300, size: 10 },
  { m: 3.5, w: 180, size: 11 },
  { m: 6, w: 95, size: 12 },
  { m: 12, w: 44, size: 13 },
  { m: 25, w: 18, size: 14 },
  { m: 60, w: 6, size: 16 },
  { m: 180, w: 1.8, size: 18 },
  { m: 600, w: 0.45, size: 21 },
  { m: 2000, w: 0.08, size: 25 },
  { m: 5000, w: 0.02, size: 28 }
];

const BOMB_VALUES: [number, number][] = [[2, 34], [3, 24], [4, 16], [5, 11], [6, 7], [8, 4.4], [10, 2.4], [15, 1.1], [25, 0.4], [50, 0.12], [100, 0.03]];

function bombMean(): number {
  let s = 0; let w = 0;
  BOMB_VALUES.forEach(function (b) { s += b[0] * b[1]; w += b[1]; });
  return s / w;
}

function baseTarget(rtp: number): number {
  const fs = P_FREE * FREE_AWARD;
  return (rtp - fs * P_BOMB * bombMean()) / (1 + fs);
}

function loseWeight(target: number): number {
  let s = 0; let w = 0;
  PAYTABLE.forEach(function (p) { s += p.w * p.m; w += p.w; });
  return Math.max(0.0001, s / Math.max(0.02, target) - w);
}

function pickPay(target: number): PayRow | null {
  const lw = loseWeight(target);
  let total = lw;
  PAYTABLE.forEach(function (p) { total += p.w; });
  let roll = rnd() * total - lw;
  if (roll < 0) return null;
  for (const p of PAYTABLE) { roll -= p.w; if (roll <= 0) return p; }
  return null;
}

function pickBomb(): number {
  let total = 0;
  BOMB_VALUES.forEach(function (b) { total += b[1]; });
  let roll = rnd() * total;
  for (const b of BOMB_VALUES) { roll -= b[1]; if (roll <= 0) return b[0]; }
  return 2;
}

export function freshGrid(): number[] {
  const g: number[] = [];
  for (let i = 0; i < CELLS; i++) g.push(Math.floor(rnd() * 8));
  return g;
}

function neighbours(i: number): number[] {
  const col = Math.floor(i / ROWS);
  const row = i % ROWS;
  const out: number[] = [];
  if (col > 0) out.push(i - ROWS);
  if (col < COLS - 1) out.push(i + ROWS);
  if (row > 0) out.push(i - 1);
  if (row < ROWS - 1) out.push(i + 1);
  return out;
}

function growCluster(size: number): number[] {
  const start = Math.floor(rnd() * CELLS);
  const seen: number[] = [start];
  const frontier: number[] = [start];
  while (seen.length < size && frontier.length > 0) {
    const k = Math.floor(rnd() * frontier.length);
    const cur = frontier.splice(k, 1)[0];
    const nb = neighbours(cur);
    for (const n of nb) {
      if (seen.length >= size) break;
      if (seen.indexOf(n) < 0) { seen.push(n); frontier.push(n); }
    }
  }
  return seen;
}

export interface TumbleStep { before: number[]; cells: number[]; symbol: number; mult: number; after: number[]; }
export interface BombHit { cell: number; value: number; }
export interface SpinResult {
  grid: number[];
  steps: TumbleStep[];
  totalMult: number;
  scatters: number[];
  bombs: BombHit[];
  bombAdd: number;
  free: boolean;
  tier: number;
}

export function spinOnce(rtp: number, free: boolean): SpinResult {
  const target = baseTarget(rtp);
  let grid = freshGrid();
  const hit = pickPay(target);
  const steps: TumbleStep[] = [];
  let totalMult = 0;
  let tier = -1;
  if (hit) {
    tier = PAYTABLE.indexOf(hit);
    totalMult = hit.m;
    const roll = rnd();
    const n = roll < 0.6 ? 1 : roll < 0.85 ? 2 : roll < 0.96 ? 3 : 4;
    let left = totalMult;
    for (let s = 0; s < n; s++) {
      const part = s === n - 1 ? r2(left) : r2(totalMult * (s === 0 ? 0.5 : 0.25));
      left = r2(left - part);
      const size = Math.max(MIN_CLUSTER, Math.min(CELLS, Math.round(hit.size * (s === 0 ? 1 : 0.72))));
      const cells = growCluster(size);
      const symbol = Math.floor(rnd() * 8);
      const before = grid.slice();
      cells.forEach(function (i) { before[i] = symbol; });
      const after = before.slice();
      cells.forEach(function (i) { after[i] = Math.floor(rnd() * 8); });
      steps.push({ before: before, cells: cells, symbol: symbol, mult: part, after: after });
      grid = after;
    }
  }
  const scatters: number[] = [];
  if (!free && rnd() < P_FREE) {
    const pool: number[] = Array.from({ length: CELLS }, function (_, i) { return i; });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool.slice(0, 4).forEach(function (i) { scatters.push(i); grid[i] = SCATTER; });
  }
  const bombs: BombHit[] = [];
  let bombAdd = 0;
  if (free && rnd() < P_BOMB) {
    const count = rnd() < 0.25 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const cell = Math.floor(rnd() * CELLS);
      const value = pickBomb();
      bombs.push({ cell: cell, value: value });
      bombAdd += value;
    }
    totalMult = r2(totalMult + bombAdd);
    if (tier < 0) tier = 0;
  }
  return { grid: grid, steps: steps, totalMult: r2(totalMult), scatters: scatters, bombs: bombs, bombAdd: bombAdd, free: free, tier: tier };
}

export interface SlotConfig {
  slug: string; name: string; family: string; accent: string; accent2: string;
  felt: string; frame: string; mascot: string; maxWin: string; vol: string; tag: string;
}

export const CLUSTER_GAMES: SlotConfig[] = [
  { slug: "sugarfall", name: "Sugarfall Cascade", family: "candy", accent: "#ff6fb5", accent2: "#ffd97a", felt: "linear-gradient(170deg,#3d0f2a,#7a1f4d 45%,#2a0a1c)", frame: "#ffd97a", mascot: "gummy", maxWin: "x5000", vol: "High", tag: "Cluster Tumble" },
  { slug: "gemcascade", name: "Gem Cascade", family: "gems", accent: "#22d3ee", accent2: "#9dc4ff", felt: "linear-gradient(170deg,#03151c,#0a3d4d 45%,#020c11)", frame: "#7fe3f5", mascot: "prism", maxWin: "x5000", vol: "High", tag: "Prism Tumble" },
  { slug: "orchardpop", name: "Orchard Pop", family: "fruit", accent: "#4ade80", accent2: "#fde68a", felt: "linear-gradient(170deg,#04120a,#0d3a1e 45%,#030d07)", frame: "#bef264", mascot: "sprout", maxWin: "x5000", vol: "Low", tag: "Fruit Cluster" },
  { slug: "lavafall", name: "Lavafall", family: "ember", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 45%,#120302)", frame: "#ff9f43", mascot: "cinder", maxWin: "x5000", vol: "High", tag: "Molten Tumble" },
  { slug: "frostbite", name: "Frostbite Falls", family: "ice", accent: "#93c5fd", accent2: "#e0f2fe", felt: "linear-gradient(170deg,#020617,#0b1e4d 45%,#01040c)", frame: "#bfdbfe", mascot: "shard", maxWin: "x5000", vol: "Medium", tag: "Ice Cluster" },
  { slug: "bloomdrop", name: "Bloomdrop", family: "petal", accent: "#fb7185", accent2: "#fecdd3", felt: "linear-gradient(170deg,#170610,#43102a 45%,#0c0308)", frame: "#fda4af", mascot: "petal", maxWin: "x5000", vol: "Medium", tag: "Petal Tumble" },
  { slug: "voidjelly", name: "Void Jelly", family: "cosmic", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 45%,#070310)", frame: "#d8b4fe", mascot: "blob", maxWin: "x5000", vol: "High", tag: "Cosmic Cluster" },
  { slug: "honeydrip", name: "Honeydrip", family: "amber", accent: "#facc15", accent2: "#fef08a", felt: "linear-gradient(170deg,#1c1002,#4d2f04 45%,#100a01)", frame: "#fde68a", mascot: "comb", maxWin: "x5000", vol: "Low", tag: "Amber Tumble" },
  { slug: "tidalpop", name: "Tidal Pop", family: "aqua", accent: "#2dd4bf", accent2: "#99f6e4", felt: "linear-gradient(170deg,#03121a,#0a3340 45%,#020a0e)", frame: "#5eead4", mascot: "bubble", maxWin: "x5000", vol: "Medium", tag: "Reef Cluster" },
  { slug: "cinderfall", name: "Cinderfall", family: "ash", accent: "#f97316", accent2: "#fed7aa", felt: "linear-gradient(170deg,#140801,#3d1a03 45%,#0a0501)", frame: "#fdba74", mascot: "ash", maxWin: "x5000", vol: "High", tag: "Ash Tumble" },
  { slug: "prismrain", name: "Prismrain", family: "spectrum", accent: "#818cf8", accent2: "#c7d2fe", felt: "linear-gradient(170deg,#050514,#141438 45%,#03030c)", frame: "#a5b4fc", mascot: "ray", maxWin: "x5000", vol: "High", tag: "Spectrum Cluster" },
  { slug: "mintcrush", name: "Mintcrush", family: "mint", accent: "#34d399", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 45%,#03100b)", frame: "#6ee7b7", mascot: "leaf", maxWin: "x5000", vol: "Low", tag: "Mint Cluster" }
];

export function slotBySlug(slug: string): SlotConfig {
  const hit = CLUSTER_GAMES.find(function (g) { return g.slug === slug; });
  return hit || CLUSTER_GAMES[0];
}