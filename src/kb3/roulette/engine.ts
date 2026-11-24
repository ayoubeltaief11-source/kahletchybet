export type RouletteVariant = "european" | "american" | "french";
export type PocketColor = "green" | "red" | "black";
export type BetType =
  | "straight" | "split" | "street" | "corner" | "line" | "basket"
  | "column" | "dozen" | "low" | "high" | "even" | "odd" | "red" | "black";

export interface Bet { type: BetType; numbers: string[]; amount: number; }
export interface BetOutcome { bet: Bet; status: "win" | "lose" | "partage"; returned: number; }
export interface Settlement { pocket: string; color: PocketColor; totalStake: number; totalReturn: number; net: number; outcomes: BetOutcome[]; }
export interface SpinOutcome { variant: RouletteVariant; seed: number; index: number; pocket: string; color: PocketColor; }
interface Pos { row: number; col: number; }

export const EURO_WHEEL: string[] = ["0","32","15","19","4","21","2","25","17","34","6","27","13","36","11","30","8","23","10","5","24","16","33","1","20","14","31","9","22","18","29","7","28","12","35","3","26"];
export const AMER_WHEEL: string[] = ["0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1","00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2"];

const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export const PAYOUT: Record<BetType, number> = {
  straight: 35, split: 17, street: 11, corner: 8, line: 5, basket: 6,
  column: 2, dozen: 2, low: 1, high: 1, even: 1, odd: 1, red: 1, black: 1
};

const COUNT: Record<BetType, number> = {
  straight: 1, split: 2, street: 3, corner: 4, line: 6, basket: 5,
  column: 12, dozen: 12, low: 18, high: 18, even: 18, odd: 18, red: 18, black: 18
};

export function pocketsFor(v: RouletteVariant): string[] {
  return v === "american" ? AMER_WHEEL : EURO_WHEEL;
}

export function colorOf(pocket: string): PocketColor {
  if (pocket === "0" || pocket === "00") return "green";
  return RED.indexOf(Number(pocket)) >= 0 ? "red" : "black";
}

export function isEvenMoney(t: BetType): boolean {
  return t === "low" || t === "high" || t === "even" || t === "odd" || t === "red" || t === "black";
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296);
}

export function spinOnce(v: RouletteVariant, seed: number): SpinOutcome {
  const rng = makeRng(seed);
  const pockets = pocketsFor(v);
  const index = Math.floor(rng() * pockets.length);
  const pocket = pockets[index];
  return { variant: v, seed: seed, index: index, pocket: pocket, color: colorOf(pocket) };
}

export function pocketAngle(v: RouletteVariant, index: number): number {
  return (index / pocketsFor(v).length) * Math.PI * 2;
}

export function posOf(n: string): Pos | null {
  const x = Number(n);
  if (!Number.isInteger(x) || x < 1 || x > 36) return null;
  return { row: 2 - ((x - 1) % 3), col: Math.floor((x - 1) / 3) };
}

export function betKey(nums: string[]): string {
  return nums.slice().sort().join("-");
}

export function columnNumbers(col: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 12; i++) out.push(String(col + i * 3));
  return out;
}

export function dozenNumbers(d: number): string[] {
  const out: string[] = [];
  const start = (d - 1) * 12 + 1;
  for (let i = 0; i < 12; i++) out.push(String(start + i));
  return out;
}

export function streetNumbers(row: number): string[] {
  const s = row * 3 + 1;
  return [String(s), String(s + 1), String(s + 2)];
}

export function lineNumbers(row: number): string[] {
  const s = row * 3 + 1;
  const out: string[] = [];
  for (let i = 0; i < 6; i++) out.push(String(s + i));
  return out;
}

export function outsideNumbers(kind: "low" | "high" | "even" | "odd" | "red" | "black"): string[] {
  const out: string[] = [];
  for (let x = 1; x <= 36; x++) {
    let ok = false;
    if (kind === "low") ok = x <= 18;
    else if (kind === "high") ok = x >= 19;
    else if (kind === "even") ok = x % 2 === 0;
    else if (kind === "odd") ok = x % 2 === 1;
    else ok = colorOf(String(x)) === kind;
    if (ok) out.push(String(x));
  }
  return out;
}

function zeroSplits(v: RouletteVariant): string[] {
  if (v === "american") return ["0-1", "0-2", "0-00", "00-2", "00-3"];
  return ["0-1", "0-2", "0-3"];
}

function zeroStreets(v: RouletteVariant): string[] {
  if (v === "american") return ["0-1-2", "00-2-3"];
  return ["0-1-2", "0-2-3"];
}

function uniqSorted(xs: number[]): number[] {
  return Array.from(new Set(xs)).sort(function (a, b) { return a - b; });
}

function validGroup(v: RouletteVariant, type: BetType, nums: string[]): boolean {
  const key = betKey(nums);
  const hasZero = nums.indexOf("0") >= 0 || nums.indexOf("00") >= 0;
  if (type === "straight") return true;
  if (type === "basket") return v === "american" && key === "0-00-1-2-3";
  if (type === "split") {
    if (hasZero) return zeroSplits(v).indexOf(key) >= 0;
    const a = posOf(nums[0]); const b = posOf(nums[1]);
    if (!a || !b) return false;
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
  }
  if (type === "column") {
    for (let c = 1; c <= 3; c++) if (key === betKey(columnNumbers(c))) return true;
    return false;
  }
  if (type === "dozen") {
    for (let d = 1; d <= 3; d++) if (key === betKey(dozenNumbers(d))) return true;
    return false;
  }
  if (type === "low" || type === "high" || type === "even" || type === "odd" || type === "red" || type === "black") {
    return key === betKey(outsideNumbers(type));
  }
  if (hasZero) {
    if (type === "street") return zeroStreets(v).indexOf(key) >= 0;
    if (type === "corner") return v !== "american" && key === "0-1-2-3";
    return false;
  }
  const ps: Pos[] = [];
  for (const n of nums) { const p = posOf(n); if (!p) return false; ps.push(p); }
  const rows = uniqSorted(ps.map(function (p) { return p.row; }));
  const cols = uniqSorted(ps.map(function (p) { return p.col; }));
  if (type === "street") return cols.length === 1 && rows.length === 3;
  if (type === "corner") return cols.length === 2 && rows.length === 2 && cols[1] - cols[0] === 1 && rows[1] - rows[0] === 1;
  if (type === "line") return cols.length === 2 && rows.length === 3 && cols[1] - cols[0] === 1;
  return false;
}

export function makeBet(v: RouletteVariant, type: BetType, numbers: string[], amount: number): Bet {
  if (!isFinite(amount) || amount <= 0) throw new Error("Invalid amount");
  const nums = numbers.slice();
  if (nums.length !== COUNT[type]) throw new Error("Wrong count for " + type);
  const pockets = pocketsFor(v);
  const seen: Record<string, boolean> = {};
  for (const n of nums) {
    if (pockets.indexOf(n) < 0) throw new Error("Unknown pocket " + n);
    if (seen[n]) throw new Error("Duplicate pocket " + n);
    seen[n] = true;
  }
  if (!validGroup(v, type, nums)) throw new Error("Invalid " + type + " group: " + betKey(nums));
  return { type: type, numbers: nums, amount: amount };
}

export function settle(v: RouletteVariant, bets: Bet[], pocket: string): Settlement {
  let stake = 0; let ret = 0;
  const outcomes: BetOutcome[] = [];
  for (const b of bets) {
    stake += b.amount;
    let returned = 0;
    let status: "win" | "lose" | "partage" = "lose";
    if (b.numbers.indexOf(pocket) >= 0) { returned = b.amount * (PAYOUT[b.type] + 1); status = "win"; }
    else if (v === "french" && pocket === "0" && isEvenMoney(b.type)) { returned = b.amount / 2; status = "partage"; }
    ret += returned;
    outcomes.push({ bet: b, status: status, returned: returned });
  }
  return { pocket: pocket, color: colorOf(pocket), totalStake: stake, totalReturn: ret, net: ret - stake, outcomes: outcomes };
}

export function theoreticalRtp(v: RouletteVariant, type: BetType): number {
  const total = pocketsFor(v).length;
  if (v === "french" && isEvenMoney(type)) return (COUNT[type] * 2 + 0.5) / total;
  return (COUNT[type] * (PAYOUT[type] + 1)) / total;
}
