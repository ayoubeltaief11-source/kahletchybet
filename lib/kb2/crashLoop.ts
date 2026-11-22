export const SLOT_MS = 20000;
export const BET_MS = 6000;
export const FLY_MS = 11000;
export const SHORT_FLY_MS = 700;
export const EPOCH = 1767225600000;
export const SERVER_SEED = "kahlatchybet-crash-seed-v1";

export type CrashPhase = "betting" | "flying" | "crashed";

export interface LiveRound {
  index: number;
  phase: CrashPhase;
  slotStart: number;
  betEnd: number;
  crashTime: number;
  slotEnd: number;
  crashAt: number;
  mult: number;
  progress: number;
  betLeft: number;
  crashLeft: number;
  flyMs: number;
}

function fnv(str: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function roundHash(index: number): string {
  const a = fnv(SERVER_SEED + ":" + index, 0x9e3779b9);
  const b = fnv(SERVER_SEED + "#" + index, 0x85ebca6b);
  const hex = function (n: number): string { return n.toString(16).padStart(8, "0"); };
  return hex(a) + hex(b) + hex(fnv(hex(a) + hex(b), 0xc2b2ae35)) + hex(fnv(String(index), 0x27d4eb2f));
}

export function seedHash(): string {
  const hex = function (n: number): string { return n.toString(16).padStart(8, "0"); };
  return hex(fnv(SERVER_SEED, 1)) + hex(fnv(SERVER_SEED, 2)) + hex(fnv(SERVER_SEED, 3)) + hex(fnv(SERVER_SEED, 4));
}

export function uniformOf(index: number): number {
  const a = fnv(SERVER_SEED + ":" + index, 0x9e3779b9);
  const b = fnv(SERVER_SEED + "#" + index, 0x85ebca6b);
  const v = (a * 4294967296 + b) / 18446744073709551616;
  return Math.min(0.9999999, Math.max(0, v));
}

export function crashPointOf(index: number, rtp: number): number {
  const r = uniformOf(index);
  const raw = Math.max(1, Math.floor((100 * rtp) / (1 - r)) / 100);
  return Math.min(5000, raw);
}

export function flyDuration(crashAt: number): number {
  return crashAt <= 1.02 ? SHORT_FLY_MS : FLY_MS;
}

export function stateAt(now: number, rtp: number): LiveRound {
  const rel = Math.max(0, now - EPOCH);
  const index = Math.floor(rel / SLOT_MS);
  const slotStart = EPOCH + index * SLOT_MS;
  const betEnd = slotStart + BET_MS;
  const crashAt = crashPointOf(index, rtp);
  const flyMs = flyDuration(crashAt);
  const crashTime = betEnd + flyMs;
  const slotEnd = slotStart + SLOT_MS;
  let phase: CrashPhase = "betting";
  let mult = 1;
  let progress = 0;
  if (now >= crashTime) { phase = "crashed"; mult = crashAt; progress = 1; }
  else if (now >= betEnd) {
    phase = "flying";
    progress = Math.min(1, (now - betEnd) / flyMs);
    mult = crashAt <= 1.02 ? 1 : Math.exp(Math.log(crashAt) * progress);
    mult = Math.round(mult * 100) / 100;
  }
  return {
    index: index, phase: phase, slotStart: slotStart, betEnd: betEnd,
    crashTime: crashTime, slotEnd: slotEnd, crashAt: crashAt, mult: mult,
    progress: progress,
    betLeft: Math.max(0, betEnd - now),
    crashLeft: Math.max(0, slotEnd - Math.max(now, crashTime)),
    flyMs: flyMs
  };
}

export interface BotBet { name: string; stake: number; cash: number; won: number; bot: true; }
const BOT_NAMES = ["Nova_88", "Kai_R", "Mira", "Orion", "Luna_X", "Raf_21", "Zed", "Ayla", "Titan", "Vex", "Sora", "Nyx", "Pyra", "Echo", "Juno", "Rook"];

export function botsOf(index: number): BotBet[] {
  const out: BotBet[] = [];
  const n = 9 + (fnv("count" + index, 7) % 8);
  for (let i = 0; i < n; i++) {
    const h = fnv("bot" + index + ":" + i, 13);
    const stake = [2, 5, 10, 20, 25, 50, 100][h % 7];
    const target = 1.2 + ((h >>> 5) % 600) / 100;
    out.push({
      name: BOT_NAMES[(h >>> 3) % BOT_NAMES.length] + ((h % 90) + 10),
      stake: stake,
      cash: Math.round(target * 100) / 100,
      won: 0,
      bot: true
    });
  }
  return out;
}

export function historyOf(index: number, rtp: number, count: number): { index: number; crash: number }[] {
  const out: { index: number; crash: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const k = index - i;
    if (k < 0) break;
    out.push({ index: k, crash: crashPointOf(k, rtp) });
  }
  return out;
}
