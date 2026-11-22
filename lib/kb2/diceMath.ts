import { randomBytes } from "node:crypto";

const rnd = (): number => randomBytes(4).readUInt32BE(0) / 4294967296;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export function diceRoll(): number {
  return Math.round(rnd() * 10000) / 100;
}

export function diceProbability(target: number, over: boolean): number {
  if (over) return (100 - target) / 100;
  return target / 100;
}

export function diceMultiplier(target: number, over: boolean, rtp: number): number {
  const p = diceProbability(target, over);
  if (p <= 0.0001) return 0;
  return r2(rtp / p);
}

export function limboProbability(mult: number, rtp: number): number {
  if (mult < 1.01) return 1;
  return rtp / mult;
}

export function limboRoll(targetMult: number, rtp: number): { roll: number; win: boolean; actualMult: number } {
  const prob = limboProbability(targetMult, rtp);
  const roll = rnd();
  const win = roll < prob;
  if (win) {
    const u = rnd();
    const actualMult = r2(rtp / Math.max(0.0001, u));
    return { roll: Math.round(roll * 10000) / 100, win: true, actualMult: Math.min(1000, actualMult) };
  }
  return { roll: Math.round(roll * 10000) / 100, win: false, actualMult: 0 };
}

export interface DiceConfig {
  slug: string; name: string; type: "dice" | "limbo";
  accent: string; accent2: string; felt: string; frame: string;
  maxWin: string; vol: string; tag: string; badge: string;
}

export const DICE_GAMES: DiceConfig[] = [
  { slug: "dice-classic", name: "Precision Dice", type: "dice", accent: "#3b82f6", accent2: "#93c5fd", felt: "linear-gradient(170deg,#020617,#0b1e4d 42%,#01040c)", frame: "#93c5fd", maxWin: "x9800", vol: "Medium", tag: "Over/Under", badge: "LIVE" },
  { slug: "dice-neon", name: "Neon Dice", type: "dice", accent: "#a855f7", accent2: "#f0abfc", felt: "linear-gradient(170deg,#0a0418,#25104a 42%,#070310)", frame: "#d8b4fe", maxWin: "x9800", vol: "Medium", tag: "Glow Slider", badge: "NEW" },
  { slug: "limbo-classic", name: "Limbo Rush", type: "limbo", accent: "#12d18e", accent2: "#a7f3d0", felt: "linear-gradient(170deg,#04140f,#0b3a2a 42%,#03100b)", frame: "#6ee7b7", maxWin: "x1000", vol: "High", tag: "Target Multiplier", badge: "HOT" },
  { slug: "limbo-gold", name: "Golden Limbo", type: "limbo", accent: "#e8b33c", accent2: "#fff6d8", felt: "linear-gradient(170deg,#1c1403,#4d3a06 42%,#0d0a01)", frame: "#ffd97a", maxWin: "x1000", vol: "High", tag: "High Roller", badge: "NEW" }
];

export function diceBySlug(slug: string): DiceConfig {
  const hit = DICE_GAMES.find(function (g) { return g.slug === slug; });
  return hit || DICE_GAMES[0];
}