import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const COLS = 5;
export const ROWS = 3;
export const CELLS = COLS * ROWS;
export const RESPINS = 3;
export const UNIT = 0.5;
export const MEAN_UNITS = 5;

export interface Jackpot { key: string; label: string; value: number; hue: string; }
export const JACKPOTS: Jackpot[] = [
  { key: "MINI", label: "MINI", value: 25, hue: "#12d18e" },
  { key: "MINOR", label: "MINOR", value: 100, hue: "#3b82f6" },
  { key: "MAJOR", label: "MAJOR", value: 500, hue: "#a855f7" },
  { key: "GRAND", label: "GRAND", value: 2000, hue: "#ff4757" }
];

export interface Outcome { c: number; jp: number; w: number; }
export const OUTCOMES: Outcome[] = [
  { c: 1, jp: -1, w: 900 },
  { c: 2, jp: -1, w: 600 },
  { c: 3, jp: -1, w: 380 },
  { c: 4, jp: -1, w: 220 },
  { c: 5, jp: -1, w: 130 },
  { c: 6, jp: 0, w: 70 },
  { c: 7, jp: -1, w: 34 },
  { c: 8, jp: 1, w: 16 },
  { c: 9, jp: -1, w: 7 },
  { c: 10, jp: 2, w: 3 },
  { c: 12, jp: -1, w: 0.7 },
  { c: 15, jp: 3, w: 0.08 }
];

export function outcomeMult(o: Outcome): number {
  const base = o.c * MEAN_UNITS * UNIT;
  const jp = o.jp >= 0 ? JACKPOTS[o.jp].value : 0;
  return r2(base + jp);
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

function spreadUnits(count: number, units: number): number[] {
  const out: number[] = Array.from({ length: count }, function () { return 1; });
  let left = units - count;
  let guard = 0;
  while (left > 0 && guard < 6000) {
    guard += 1;
    const i = Math.floor(rnd() * count);
    const add = Math.min(left, 1 + Math.floor(rnd() * 4));
    out[i] += add;
    left -= add;
  }
  return out;
}

export interface Coin { cell: number; value: number; jp: number; }
export interface HoldStep { added: Coin[]; board: Coin[]; respins: number; }
export interface HoldResult {
  steps: HoldStep[];
  board: Coin[];
  coinTotal: number;
  jackpot: number;
  jackpotValue: number;
  totalMult: number;
  full: boolean;
  tier: number;
}

export function spinOnce(rtp: number): HoldResult {
  const hit = pickOutcome(rtp);
  const steps: HoldStep[] = [];
  if (!hit) {
    steps.push({ added: [], board: [], respins: 2 });
    steps.push({ added: [], board: [], respins: 1 });
    steps.push({ added: [], board: [], respins: 0 });
    return { steps: steps, board: [], coinTotal: 0, jackpot: -1, jackpotValue: 0, totalMult: 0, full: false, tier: -1 };
  }
  const coinUnits = hit.c * MEAN_UNITS;
  const values = spreadUnits(hit.c, coinUnits).map(function (u) { return r2(u * UNIT); });
  const pool: number[] = Array.from({ length: CELLS }, function (_, i) { return i; });
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const coins: Coin[] = values.map(function (v, i) { return { cell: pool[i], value: v, jp: -1 }; });
  if (hit.jp >= 0 && coins.length > 0) {
    const k = Math.floor(rnd() * coins.length);
    coins[k].jp = hit.jp;
  }
  const groups = Math.min(coins.length, 2 + Math.floor(rnd() * 4));
  const per = Math.ceil(coins.length / groups);
  const board: Coin[] = [];
  let respins = RESPINS;
  for (let g = 0; g < groups; g++) {
    const added = coins.slice(g * per, (g + 1) * per);
    if (added.length === 0) continue;
    added.forEach(function (cc) { board.push(cc); });
    respins = RESPINS;
    steps.push({ added: added.slice(), board: board.slice(), respins: respins - 1 });
  }
  const tail = 1 + Math.floor(rnd() * 2);
  for (let t = 0; t < tail; t++) {
    respins -= 1;
    steps.push({ added: [], board: board.slice(), respins: Math.max(0, respins - 1) });
    if (respins <= 0) break;
  }
  const coinTotal = r2(coins.reduce(function (a, cc) { return a + cc.value; }, 0));
  const jackpotValue = hit.jp >= 0 ? JACKPOTS[hit.jp].value : 0;
  const full = coins.length >= CELLS;
  return {
    steps: steps, board: coins, coinTotal: coinTotal, jackpot: hit.jp,
    jackpotValue: jackpotValue, totalMult: r2(coinTotal + jackpotValue), full: full,
    tier: hit.jp
  };
}

export interface HoldConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
}

export const HOLD_GAMES: HoldConfig[] = [
  { slug: "magmareserve", name: "Magma Reserve", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#2a0604,#7a1f06 42%,#1a0402)", frame: "#ff9f43", maxWin: "x2075", vol: "High", tag: "Lava Coins", badge: "HOT" },
  { slug: "tidal-vault", name: "Tidal Vault", accent: "#22d3ee", accent2: "#9dc4ff", felt: "linear-gradient(170deg,#03151c,#0a4d5e 42%,#020c11)", frame: "#7fe3f5", maxWin: "x2075", vol: "High", tag: "Deep Coins", badge: "NEW" },
  { slug: "goldenledger", name: "Golden Ledger", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x2075", vol: "High", tag: "Bullion Hold", badge: "LIVE" },
  { slug: "verdantcache", name: "Verdant Cache", accent: "#4ade80", accent2: "#bef264", felt: "linear-gradient(170deg,#04120a,#0d4d24 42%,#030d07)", frame: "#bef264", maxWin: "x2075", vol: "Medium", tag: "Grove Coins", badge: "NEW" },
  { slug: "duskreserve", name: "Dusk Reserve", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#33145e 42%,#070310)", frame: "#d8b4fe", maxWin: "x2075", vol: "High", tag: "Twilight Hold", badge: "HOT" },
  { slug: "coralstrongbox", name: "Coral Strongbox", accent: "#fb7185", accent2: "#fecdd3", felt: "linear-gradient(170deg,#170610,#5e1436 42%,#0c0308)", frame: "#fda4af", maxWin: "x2075", vol: "Medium", tag: "Reef Coins", badge: "NEW" },
  { slug: "stormbullion", name: "Storm Bullion", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b2a6d 42%,#01040c)", frame: "#93c5fd", maxWin: "x2075", vol: "High", tag: "Tempest Hold", badge: "LIVE" },
  { slug: "obsidianhoard", name: "Obsidian Hoard", accent: "#f97316", accent2: "#fed7aa", felt: "linear-gradient(170deg,#0a0a0a,#3d1a03 42%,#050505)", frame: "#fdba74", maxWin: "x2075", vol: "High", tag: "Ember Hoard", badge: "HOT" }
];

export function holdBySlug(slug: string): HoldConfig {
  const hit = HOLD_GAMES.find(function (g) { return g.slug === slug; });
  return hit || HOLD_GAMES[0];
}
