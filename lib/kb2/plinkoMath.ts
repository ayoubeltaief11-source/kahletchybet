import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const ROWS = 16;
export const BUCKETS = ROWS + 1;

export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

export function binomialProb(n: number, k: number): number {
  return comb(n, k) / Math.pow(2, n);
}

export interface PlinkoConfig {
  slug: string; name: string; accent: string; accent2: string;
  felt: string; frame: string; maxWin: string; vol: string; tag: string; badge: string;
  risk: "low" | "medium" | "high";
}

export const PLINKO_GAMES: PlinkoConfig[] = [
  { slug: "low", name: "Plinko Low Risk", accent: "#12d18e", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 42%,#03100b)", frame: "#6ee7b7", maxWin: "x16", vol: "Low", tag: "Safe Drops", badge: "LIVE", risk: "low" },
  { slug: "medium", name: "Plinko Medium", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x110", vol: "Medium", tag: "Balanced", badge: "HOT", risk: "medium" },
  { slug: "high", name: "Plinko High Risk", accent: "#ff4757", accent2: "#ff8b96", felt: "linear-gradient(170deg,#1a0505,#4a1206 42%,#120302)", frame: "#ff9f43", maxWin: "x1000", vol: "High", tag: "Extreme Drops", badge: "NEW", risk: "high" },
  { slug: "neon", name: "Neon Plinko", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x110", vol: "Medium", tag: "Glow Drops", badge: "NEW", risk: "medium" }
];

export function plinkoBySlug(slug: string): PlinkoConfig {
  const hit = PLINKO_GAMES.find(function (g) { return g.slug === slug; });
  return hit || PLINKO_GAMES[0];
}

export function generateMultipliers(risk: "low" | "medium" | "high", rtp: number): number[] {
  const base: Record<string, number[]> = {
    low: [5.6, 2.1, 1.1, 1, 0.5, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [130, 26, 9, 4, 1.9, 1, 0.5, 0.3, 0.2, 0.3, 0.5, 1, 1.9, 4, 9, 26, 130],
    high: [1000, 130, 26, 9, 3, 1.5, 0.3, 0.2, 0.2, 0.2, 0.3, 1.5, 3, 9, 26, 130, 1000]
  };
  
  const multipliers = base[risk].slice();
  let ev = 0;
  for (let k = 0; k < BUCKETS; k++) {
    ev += binomialProb(ROWS, k) * multipliers[k];
  }
  
  const scale = rtp / ev;
  return multipliers.map(function (m) { return r2(m * scale); });
}

export function dropBall(): number[] {
  const path: number[] = [];
  let bucket = 0;
  for (let i = 0; i < ROWS; i++) {
    const dir = rnd() < 0.5 ? 0 : 1;
    path.push(dir);
    bucket += dir;
  }
  return [bucket].concat(path);
}

export interface PlinkoResult {
  bucket: number;
  path: number[];
  multiplier: number;
  paid: number;
}