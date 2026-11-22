import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export const CARDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const CARD_NAMES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function hiloCard(): number {
  return CARDS[Math.floor(rnd() * CARDS.length)];
}

export function hiloProbability(current: number, higher: boolean): number {
  if (higher) return (14 - current) / 12;
  return (current - 2) / 12;
}

export function hiloMultiplier(current: number, higher: boolean, rtp: number): number {
  const p = hiloProbability(current, higher);
  if (p <= 0) return 0;
  return r2(rtp / p);
}

export function coinFlip(bet: "heads" | "tails", rtp: number): { result: "heads" | "tails"; win: boolean; mult: number } {
  const result = rnd() < 0.5 ? "heads" : "tails";
  const win = result === bet;
  const mult = win ? r2(rtp / 0.5) : 0;
  return { result, win, mult };
}

export const WHEEL_SEGMENTS = [
  { mult: 1, color: "#3b82f6", count: 24 },
  { mult: 2, color: "#12d18e", count: 15 },
  { mult: 5, color: "#e8b33c", count: 7 },
  { mult: 10, color: "#a855f7", count: 4 },
  { mult: 20, color: "#ff6b3d", count: 2 },
  { mult: 40, color: "#ff4757", count: 1 },
  { mult: 0, color: "#6b7280", count: 1 }
];

export function wheelSpin(): { segment: number; mult: number; color: string } {
  const total = WHEEL_SEGMENTS.reduce(function (a, s) { return a + s.count; }, 0);
  let roll = rnd() * total;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    roll -= WHEEL_SEGMENTS[i].count;
    if (roll <= 0) {
      return { segment: i, mult: WHEEL_SEGMENTS[i].mult, color: WHEEL_SEGMENTS[i].color };
    }
  }
  return { segment: 0, mult: 1, color: WHEEL_SEGMENTS[0].color };
}

export interface InstantConfig {
  slug: string; name: string; type: "hilo" | "coin" | "wheel";
  accent: string; accent2: string; felt: string; frame: string;
  maxWin: string; vol: string; tag: string; badge: string;
}

export const INSTANT_GAMES: InstantConfig[] = [
  { slug: "hilo-classic", name: "Hi-Lo Classic", type: "hilo", accent: "#12d18e", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 42%,#03100b)", frame: "#6ee7b7", maxWin: "x100", vol: "Medium", tag: "Card Ladder", badge: "LIVE" },
  { slug: "hilo-neon", name: "Neon Hi-Lo", type: "hilo", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x100", vol: "Medium", tag: "Glow Cards", badge: "NEW" },
  { slug: "coin-classic", name: "Coin Flip", type: "coin", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x2", vol: "Low", tag: "50/50", badge: "HOT" },
  { slug: "coin-neon", name: "Neon Coin", type: "coin", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 42%,#01040c)", frame: "#93c5fd", maxWin: "x2", vol: "Low", tag: "Glow Flip", badge: "NEW" },
  { slug: "wheel-classic", name: "Wheel of Fortune", type: "wheel", accent: "#ff6b3d", accent2: "#ffd24a", felt: "linear-gradient(170deg,#1a0505,#4a1206 42%,#120302)", frame: "#ff9f43", maxWin: "x40", vol: "High", tag: "54 Segments", badge: "LIVE" },
  { slug: "wheel-gold", name: "Golden Wheel", type: "wheel", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x40", vol: "High", tag: "High Roller", badge: "HOT" },
  { slug: "wheel-neon", name: "Neon Wheel", type: "wheel", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x40", vol: "High", tag: "Glow Spin", badge: "NEW" }
];

export function instantBySlug(slug: string): InstantConfig {
  const hit = INSTANT_GAMES.find(function (g) { return g.slug === slug; });
  return hit || INSTANT_GAMES[0];
}