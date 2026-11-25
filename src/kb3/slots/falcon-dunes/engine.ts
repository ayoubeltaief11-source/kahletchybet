// Falcon Dunes: 5 reels x 3 rows, 243 ways, wild on cols 2,4 (x2/x3/x5), scatter on cols 1,3,5
export type SymId = "s1"|"s2"|"s3"|"s4"|"s5"|"s6"|"s7"|"s8"|"wild"|"scatter";
export const REELS = 5, ROWS = 3, MAX_WIN = 5000;

export const PAYS: Record<string, number[]> = {
  s1: [0.09, 0.45, 1.8],
  s2: [0.09, 0.45, 1.8],
  s3: [0.13, 0.54, 2.2],
  s4: [0.13, 0.54, 2.2],
  s5: [0.22, 0.9, 4.5],
  s6: [0.22, 0.9, 4.5],
  s7: [0.45, 1.8, 9],
  s8: [0.9, 4.5, 22]
};

// Per-reel weights. Col 1,3,5 have scatter (no wild). Col 2,4 have wild (no scatter).
const LOW = ["s1","s2","s3","s4"] as SymId[];
const HIGH = ["s5","s6","s7","s8"] as SymId[];

function w(syms: SymId[], weights: number[]): Record<SymId, number> {
  const r: Record<string, number> = {};
  syms.forEach(function (s, i) { r[s] = weights[i]!; });
  return r as Record<SymId, number>;
}

// Columns 1, 3, 5 (scatter, no wild)
const SCATTER_COL = w([...LOW, ...HIGH, "scatter"], [170, 160, 140, 130, 80, 65, 40, 26, 30]);
// Columns 2, 4 (wild, no scatter) - scatter weight slightly higher on col 3 only
const WILD_COL = w([...LOW, ...HIGH, "wild"], [170, 160, 140, 130, 80, 65, 40, 26, 8]);
// Column 3 special: scatter a bit more frequent
const SCATTER_COL_MID = w([...LOW, ...HIGH, "scatter"], [150, 140, 125, 115, 70, 55, 34, 22, 42]);

export const REEL_WEIGHTS: Record<SymId, number>[] = [
  SCATTER_COL, WILD_COL, SCATTER_COL_MID, WILD_COL, SCATTER_COL
];

// Ante: doubles scatter chance on scatter columns
export const ANTE_WEIGHTS: Record<SymId, number>[] = REEL_WEIGHTS.map(function (col, i) {
  const copy = Object.assign({}, col);
  if (i === 0 || i === 2 || i === 4) copy.scatter = (copy.scatter || 0) * 2;
  return copy;
});

export const MULT_WEIGHTS: Record<number, number> = { 2: 60, 3: 30, 5: 10 };

// Free-spin mode multiplier weights (per mode)
export const FS_MODES = [
  { spins: 20, mults: [2, 3, 5], weights: [60, 30, 10] },
  { spins: 15, mults: [3, 5, 8], weights: [50, 35, 15] },
  { spins: 10, mults: [5, 8, 12], weights: [45, 40, 15] },
  { spins: 8,  mults: [8, 12, 20], weights: [40, 45, 15] }
];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rng: () => number, weights: Record<string, number>): string {
  let total = 0;
  for (const k in weights) total += weights[k]!;
  let r = rng() * total;
  for (const k in weights) {
    r -= weights[k]!;
    if (r <= 0) return k;
  }
  return Object.keys(weights)[Object.keys(weights).length - 1]!;
}

export interface Cell { sym: SymId; wildMult?: number; }
export interface Win { sym: SymId; count: number; ways: number; pay: number; positions: [number,number][]; wildsUsed: number; multProduct: number; }

export function makeGrid(rng: () => number, weights: Record<SymId, number>[]): Cell[][] {
  const grid: Cell[][] = [];
  for (let c = 0; c < REELS; c++) {
    const col: Cell[] = [];
    const cw = weights[c]!;
    for (let r = 0; r < ROWS; r++) {
      const s = pickWeighted(rng, cw) as SymId;
      if (s === "wild") {
        const mv = Number(pickWeighted(rng, MULT_WEIGHTS));
        col.push({ sym: "wild", wildMult: mv });
      } else {
        col.push({ sym: s });
      }
    }
    grid.push(col);
  }
  return grid;
}

// Evaluate 243-ways from left to right. For each non-wild, non-scatter symbol, count matches per reel starting at reel 0.
export function evaluate(grid: Cell[][], bet: number): { wins: Win[]; scatterCount: number; scatterPositions: [number,number][]; multSum: number } {
  const wins: Win[] = [];
  let scatterCount = 0;
  const scatterPositions: [number,number][] = [];
  const syms: SymId[] = ["s1","s2","s3","s4","s5","s6","s7","s8"];
  for (const s of syms) {
    const positions: [number,number][] = [];
    let ways = 1;
    let wildsUsed = 0;
    let streak = 0;
    let multProduct = 1;
    for (let c = 0; c < REELS; c++) {
      let count = 0;
      let reelWilds = 0;
      let reelMultProduct = 1;
      const reelPos: [number,number][] = [];
      for (let r = 0; r < ROWS; r++) {
        const cell = grid[c]![r]!;
        if (cell.sym === s) { count++; reelPos.push([c, r]); }
        else if (cell.sym === "wild") {
          count++; reelPos.push([c, r]); reelWilds++;
          reelMultProduct *= cell.wildMult || 1;
        }
      }
      if (count === 0) break;
      streak++;
      ways *= count;
      for (const p of reelPos) positions.push(p);
      if (reelWilds > 0) { wildsUsed += reelWilds; multProduct *= reelMultProduct; }
    }
    if (streak >= 3) {
      const table = PAYS[s]!;
      const base = table[Math.min(streak - 3, table.length - 1)]!;
      const pay = base * ways * multProduct;
      wins.push({ sym: s, count: streak, ways, pay, positions, wildsUsed, multProduct });
    }
  }
  for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) {
    if (grid[c]![r]!.sym === "scatter") { scatterCount++; scatterPositions.push([c, r]); }
  }
  let multSum = 0;
  for (const w of wins) if (w.wildsUsed > 0) multSum = Math.max(multSum, w.multProduct);
  let total = 0;
  for (const w of wins) total += w.pay;
  total = total * bet;
  if (total > MAX_WIN) total = MAX_WIN;
  return { wins, scatterCount, scatterPositions, multSum };
}

export function evaluateRound(seed: number, bet: number, ante: boolean): {
  grid: Cell[][];
  wins: Win[];
  totalWin: number;
  scatterCount: number;
  scatterPositions: [number,number][];
  multSum: number;
  capped: boolean;
  featureTriggered: boolean;
} {
  const rng = mulberry32(seed);
  const weights = ante ? ANTE_WEIGHTS : REEL_WEIGHTS;
  const grid = makeGrid(rng, weights);
  const r = evaluate(grid, bet);
  let totalWin = 0;
  for (const w of r.wins) totalWin += w.pay * bet;
  const capped = totalWin > MAX_WIN;
  if (capped) totalWin = MAX_WIN;
  return { grid, wins: r.wins, totalWin, scatterCount: r.scatterCount, scatterPositions: r.scatterPositions, multSum: r.multSum, capped, featureTriggered: r.scatterCount >= 3 };
}

// Free spin round with persistent multipliers per mode
export function evaluateFreeSpin(seed: number, bet: number, modeIndex: number, accMult: number): {
  grid: Cell[][]; wins: Win[]; spinWin: number; newAccMult: number; scatterCount: number;
} {
  const rng = mulberry32(seed);
  const mode = FS_MODES[modeIndex]!;
  const weights: Record<SymId, number>[] = REEL_WEIGHTS.map(function (col, i) {
    const copy = Object.assign({}, col);
    if (i === 1 || i === 3) copy.wild = (copy.wild || 8) * 1.8;
    return copy;
  });
  const grid = makeGrid(rng, weights);
  // Apply mode-specific wild mults instead of default
  for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) {
    const cell = grid[c]![r]!;
    if (cell.sym === "wild") {
      const roll = rng();
      let acc = 0; const total = mode.weights.reduce(function (a, b) { return a + b; }, 0);
      let chosen = mode.mults[0]!;
      for (let i = 0; i < mode.mults.length; i++) {
        acc += mode.weights[i]! / total;
        if (roll <= acc) { chosen = mode.mults[i]!; break; }
      }
      cell.wildMult = chosen;
    }
  }
  const r = evaluate(grid, bet);
  let spinWin = 0;
  for (const w of r.wins) spinWin += w.pay * bet;
  // wild mult product of this spin
  let spinMultProduct = 1;
  for (const w of r.wins) if (w.wildsUsed > 0) spinMultProduct *= w.multProduct;
  const newAccMult = accMult + (spinWin > 0 ? spinMultProduct : 0);
  return { grid, wins: r.wins, spinWin, newAccMult, scatterCount: r.scatterCount };
}

export function buyFeaturePrice(bet: number): number { return bet * 80; }
export function anteCost(bet: number): number { return Math.round(bet * 1.25 * 100) / 100; }
