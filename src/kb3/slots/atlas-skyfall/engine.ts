// Atlas Skyfall engine: mulberry32 RNG, pays-anywhere, tumble, multipliers, free spins
export type SymId = "s1"|"s2"|"s3"|"s4"|"s5"|"s6"|"s7"|"s8"|"s9"|"mult";
export const COLS = 6, ROWS = 5, MIN_PAY = 8, MAX_WIN_X = 25000;
export const MULT_VALUES = [2,3,5,10,25,50,100,250,500];

// Pay tables (per unit bet)
export const PAYS: Record<string, Record<number, number>> = {
  s1:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s2:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s3:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s4:{8:0.15,10:0.4,12:0.8,15:1.5,20:4,25:8,30:20},
  s5:{8:0.4,10:0.8,12:1.5,15:4,20:8,25:20,30:40},
  s6:{8:0.4,10:0.8,12:1.5,15:4,20:8,25:20,30:40},
  s7:{8:0.8,10:1.5,12:4,15:8,20:20,25:40,30:80},
  s8:{8:0.8,10:1.5,12:4,15:8,20:20,25:40,30:80},
  s9:{4:2,5:10,6:50}
};

// Weights per symbol on normal reels (sum ~1000)
export const NORMAL_WEIGHTS: Record<SymId, number> = {
  s1:135, s2:125, s3:115, s4:105,
  s5:80, s6:65, s7:45, s8:30,
  s9:15, mult:8
};

// Ante bet: scatter weight x2.5
export const ANTE_WEIGHTS: Record<SymId, number> = {
  s1:135, s2:125, s3:115, s4:105,
  s5:80, s6:65, s7:45, s8:30,
  s9:35, mult:8
};

// Multiplier ball weights
export const MULT_WEIGHTS: Record<number, number> = {
  2:450, 3:300, 5:180, 10:60, 25:15, 50:5
};

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

export interface Cell { sym: SymId; mult?: number; }
export interface SpinResult {
  grid: Cell[][];
  wins: { sym: SymId; count: number; pay: number; positions: [number,number][] }[];
  multSum: number;
  multPositions: [number,number][];
  scatterCount: number;
  cascadeWins: number[];
  totalWin: number;
  capped: boolean;
}

export function makeGrid(rng: () => number, weights: Record<SymId, number>): Cell[][] {
  const grid: Cell[][] = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      const s = pickWeighted(rng, weights) as SymId;
      if (s === "mult") {
        const mv = Number(pickWeighted(rng, MULT_WEIGHTS));
        col.push({ sym: "mult", mult: mv });
      } else {
        col.push({ sym: s });
      }
    }
    grid.push(col);
  }
  return grid;
}

export function countSymbols(grid: Cell[][]): Record<string, { count: number; positions: [number,number][] }> {
  const counts: Record<string, { count: number; positions: [number,number][] }> = {};
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const k = grid[c]![r]!.sym;
      if (!counts[k]) counts[k] = { count: 0, positions: [] };
      counts[k]!.count++;
      counts[k]!.positions.push([c, r]);
    }
  }
  return counts;
}

export function payFor(sym: SymId, count: number): number {
  const t = PAYS[sym];
  if (!t) return 0;
  let best = 0;
  for (const k of Object.keys(t).map(Number).sort((a,b)=>a-b)) {
    if (count >= k) best = t[k]!;
  }
  return best;
}

export function collectMultiplierBalls(grid: Cell[][]): { sum: number; positions: [number,number][] } {
  let sum = 0;
  const positions: [number,number][] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (grid[c]![r]!.sym === "mult" && (grid[c]![r]!.mult || 0)) {
        sum += (grid[c]![r]!.mult || 0);
        positions.push([c, r]);
      }
    }
  }
  return { sum, positions };
}

export function removeWins(grid: Cell[][], wins: SpinResult["wins"]): Cell[][] {
  const removeSet = new Set<string>();
  for (const w of wins) for (const [c,r] of w.positions) removeSet.add(c + "," + r);
  const newGrid: Cell[][] = [];
  for (let c = 0; c < COLS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (!removeSet.has(c + "," + r)) col.push(grid[c]![r]!);
    }
    newGrid.push(col);
  }
  return newGrid;
}

export function fillColumn(col: Cell[], need: number, rng: () => number, weights: Record<SymId, number>): Cell[] {
  const out = col.slice();
  while (out.length < ROWS) {
    const s = pickWeighted(rng, weights) as SymId;
    if (s === "mult") {
      const mv = Number(pickWeighted(rng, MULT_WEIGHTS));
      out.unshift({ sym: "mult", mult: mv });
    } else {
      out.unshift({ sym: s });
    }
  }
  return out;
}

export function computeSpin(seed: number, ante: boolean, freeSpins: boolean, accumulatedMult: number): SpinResult {
  const rng = mulberry32(seed);
  const weights = ante ? ANTE_WEIGHTS : NORMAL_WEIGHTS;
  let grid = makeGrid(rng, weights);
  const cascadeWins: number[] = [];
  let totalWin = 0;
  let step = 0;
  let multSum = 0;
  let multPositions: [number,number][] = [];
  let scatterCount = 0;
  let capped = false;

  while (step < 20) {
    const counts = countSymbols(grid);
    const wins: SpinResult["wins"] = [];
    for (const sym of ["s1","s2","s3","s4","s5","s6","s7","s8","s9"] as SymId[]) {
      const info = counts[sym]!;
      if (info && info.count >= (sym === "s9" ? 4 : MIN_PAY)) {
        const pay = payFor(sym, info.count);
        wins.push({ sym, count: info.count, pay, positions: info.positions });
      }
    }
    if (wins.length === 0) break;
    let stepWin = 0;
    for (const w of wins) stepWin += w.pay;
    if (counts["s9"]) scatterCount += counts["s9"].count;
    const mb = collectMultiplierBalls(grid);
    if (step === 0) { multSum = mb.sum; multPositions = mb.positions; }
    else { multSum += mb.sum; multPositions = multPositions.concat(mb.positions); }
    cascadeWins.push(stepWin);
    totalWin += stepWin;
    if (totalWin > MAX_WIN_X) { totalWin = MAX_WIN_X; capped = true; break; }
    grid = removeWins(grid, wins);
    for (let c = 0; c < COLS; c++) {
      grid[c] = fillColumn(grid[c]!, ROWS - grid[c].length, rng, weights);
    }
    step++;
  }

  if (totalWin > 0 && multSum > 0) {
    const mult = freeSpins ? (accumulatedMult + multSum) : multSum;
    totalWin = totalWin * mult;
    if (totalWin > MAX_WIN_X) { totalWin = MAX_WIN_X; capped = true; }
  }

  return {
    grid, wins: [], multSum, multPositions, scatterCount,
    cascadeWins, totalWin, capped
  };
}

export function buyFeaturePrice(bet: number): number { return bet * 100; }
export function anteCost(bet: number): number { return Math.round(bet * 1.25 * 100) / 100; }

export interface CascadeStep { grid: Cell[][]; wins: { sym: SymId; count: number; pay: number; positions: [number, number][] }[]; }
export function computeSteps(seed: number, ante: boolean): { steps: CascadeStep[]; finalGrid: Cell[][]; multSum: number; multPositions: [number, number][]; scatterCount: number; baseWin: number; capped: boolean } {
  const rng = mulberry32(seed);
  const weights = ante ? ANTE_WEIGHTS : NORMAL_WEIGHTS;
  let grid = makeGrid(rng, weights);
  const steps: CascadeStep[] = [];
  let baseWin = 0, multSum = 0, scatterCount = 0, capped = false;
  let multPositions: [number, number][] = [];
  for (let step = 0; step < 20; step++) {
    const counts = countSymbols(grid);
    const wins: CascadeStep["wins"] = [];
    for (const sym of ["s1","s2","s3","s4","s5","s6","s7","s8","s9"] as SymId[]) {
      const info = counts[sym]!;
      if (info && info.count >= (sym === "s9" ? 4 : MIN_PAY)) wins.push({ sym, count: info.count, pay: payFor(sym, info.count), positions: info.positions });
    }
    const mb = collectMultiplierBalls(grid);
    multSum += mb.sum; multPositions = multPositions.concat(mb.positions);
    if (counts["s9"]) scatterCount += counts["s9"].count;
    if (wins.length === 0) break;
    steps.push({ grid: grid.map(function (c) { return c.slice(); }), wins });
    let sw = 0; for (const w of wins) sw += w.pay;
    baseWin += sw;
    if (baseWin > MAX_WIN_X) { baseWin = MAX_WIN_X; capped = true; break; }
    grid = removeWins(grid, wins);
    for (let c = 0; c < COLS; c++) grid[c] = fillColumn(grid[c]!, ROWS - grid[c].length, rng, weights);
  }
  return { steps, finalGrid: grid, multSum, multPositions, scatterCount, baseWin, capped };
}
