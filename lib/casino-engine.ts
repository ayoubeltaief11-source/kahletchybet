import { randomBytes } from "node:crypto";

export type EngineKind = "slots" | "roulette" | "crash";

const rnd = () => randomBytes(4).readUInt32BE(0) / 4294967296;
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

export interface PlayInput { engine: EngineKind; stake: number; symbols: string[]; choice: string; target: number; }
export interface PlayResult { win: boolean; mult: number; payout: number; view: any; baseProb: number; baseMult: number; }

const PAY: Record<number, number> = { 0: 40, 1: 18, 2: 10, 3: 6, 4: 4, 5: 3 };

export function slotsPlan(symbols: string[], win: boolean): { view: any; mult: number; baseProb: number; baseMult: number } {
  const baseProb = 0.26;
  if (win) {
    const idx = Math.min(symbols.length - 1, Math.floor(Math.pow(rnd(), 2.1) * symbols.length));
    const s = symbols[idx];
    const mult = PAY[idx] ?? 3;
    return { view: { reels: [s, s, s], line: true, symbol: s }, mult, baseProb, baseMult: mult };
  }
  let a = pick(symbols), b = pick(symbols), c = pick(symbols);
  if (a === b && b === c) c = symbols[(symbols.indexOf(c) + 1) % symbols.length];
  return { view: { reels: [a, b, c], line: false, symbol: null }, mult: 0, baseProb, baseMult: 6 };
}

const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const WHEEL_US = ["0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1","00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2"];

export function roulettePlan(choice: string, win: boolean): { view: any; mult: number; baseProb: number; baseMult: number } {
  const num = (s: string) => (s === "00" ? 37 : Number(s));
  const isRed = (n: number) => n >= 1 && n <= 36 && RED.includes(n);
  const tests: Record<string, (n: number) => boolean> = {
    red: n => isRed(n), black: n => n >= 1 && n <= 36 && !isRed(n),
    odd: n => n >= 1 && n <= 36 && n % 2 === 1, even: n => n >= 1 && n <= 36 && n % 2 === 0,
    low: n => n >= 1 && n <= 18, high: n => n >= 19 && n <= 36,
    d1: n => n >= 1 && n <= 12, d2: n => n >= 13 && n <= 24, d3: n => n >= 25 && n <= 36,
    zero: n => n === 0 || n === 37,
  };
  const multMap: Record<string, number> = { red:2, black:2, odd:2, even:2, low:2, high:2, d1:3, d2:3, d3:3, zero:18 };
  const test = tests[choice] ?? tests.red;
  const mult = multMap[choice] ?? 2;
  const pool = WHEEL_US.map(num);
  const good = pool.filter(test), bad = pool.filter(n => !test(n));
  const baseProb = good.length / pool.length;
  const n = win ? pick(good.length ? good : [1]) : pick(bad.length ? bad : [2]);
  const label = n === 37 ? "00" : String(n);
  const color = n === 0 || n === 37 ? "green" : isRed(n) ? "red" : "black";
  return { view: { pocket: label, color, index: WHEEL_US.indexOf(label) }, mult: win ? mult : 0, baseProb, baseMult: mult };
}

export function crashPlan(target: number, win: boolean): { view: any; mult: number; baseProb: number; baseMult: number } {
  const t = Math.max(1.1, Math.min(20, target || 2));
  const baseProb = Math.min(0.92, 0.97 / t);
  let point: number;
  if (win) point = Math.round((t + rnd() * Math.max(0.6, t * 0.8)) * 100) / 100;
  else point = Math.round((1 + rnd() * Math.max(0.02, t - 1.02)) * 100) / 100;
  if (point < 1) point = 1;
  const curve: number[] = [];
  for (let i = 0; i <= 24; i++) curve.push(Math.round((1 + (point - 1) * (i / 24)) * 100) / 100);
  return { view: { crash: point, target: t, curve }, mult: win ? t : 0, baseProb, baseMult: t };
}

export function plan(inp: PlayInput, win: boolean): PlayResult {
  const r = inp.engine === "slots" ? slotsPlan(inp.symbols, win)
    : inp.engine === "roulette" ? roulettePlan(inp.choice, win)
    : crashPlan(inp.target, win);
  const payout = win ? Math.round(inp.stake * r.mult * 100) / 100 : 0;
  return { win, mult: win ? r.mult : 0, payout, view: r.view, baseProb: r.baseProb, baseMult: r.baseMult };
}