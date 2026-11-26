// Moon Rabbit Mint: 3x3, 5 paylines, Hold & Win, Moon Merge, Mystery
export type SymId = "s1"|"s2"|"s3"|"s4"|"s5"|"s6"|"mystery";
export type CoinId = "c5"|"c10"|"c25"|"c50"|"c100"|"c250"|"mini"|"minor"|"major"|"grand";
export const REELS = 3, ROWS = 3, MAX_WIN = 5000;

export const PAYS: Record<string, number> = {
  s1: 0.5, s2: 1, s3: 2, s4: 5, s5: 10, s6: 25
};

export const MERGE_MAP: Record<string, CoinId> = {
  "c5": "c10", "c10": "c25", "c25": "c50", "c50": "c100", "c100": "c250", "c250": "minor"
};
export const COIN_VALS: Record<CoinId, number> = {
  c5: 0.5, c10: 1, c25: 2.5, c50: 5, c100: 10, c250: 25,
  mini: 20, minor: 100, major: 500, grand: 2000
};

// Base game weights (per cell, mystery handled separately)
export const BASE_WEIGHTS: Record<SymId | CoinId, number> = {
  s1: 250, s2: 200, s3: 150, s4: 100, s5: 60, s6: 30, mystery: 15,
  c5: 120, c10: 90, c25: 60, c50: 40, c100: 20, c250: 10,
  mini: 4, minor: 1.5, major: 0.4, grand: 0.1
};

export const MYSTERY_WEIGHTS: Record<SymId | CoinId, number> = {
  ...BASE_WEIGHTS, mystery: 0, // Mystery reveals to something else
  c5: 150, c10: 120, c25: 90, c50: 60, c100: 40, c250: 20,
  mini: 6, minor: 2, major: 0.6, grand: 0.15
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

export interface Cell { sym: SymId | CoinId; isMysteryReveal?: boolean; }
export interface Win { type: "line" | "coin"; sym?: SymId; coin?: CoinId; pay: number; positions: [number,number][]; }

export function makeGrid(rng: () => number, weights: Record<string, number>, mysteryMode: boolean): Cell[][] {
  const grid: Cell[][] = [];
  for (let c = 0; c < REELS; c++) {
    const col: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      let s = pickWeighted(rng, weights) as SymId | CoinId;
      let isReveal = false;
      if (mysteryMode && s === "mystery") {
        s = pickWeighted(rng, MYSTERY_WEIGHTS) as SymId | CoinId;
        isReveal = true;
      }
      col.push({ sym: s, isMysteryReveal: isReveal });
    }
    grid.push(col);
  }
  return grid;
}

export function evaluateBase(grid: Cell[][], bet: number, mysteryMode: boolean): { wins: Win[]; coinCount: number; totalWin: number } {
  const wins: Win[] = [];
  let coinCount = 0;
  const lines = [
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]], // rows
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]] // diagonals
  ];
  for (const line of lines) {
    const syms = line.map(([c,r]) => grid[c]![r]!.sym);
    if (syms[0] === syms[1] && syms[1] === syms[2] && !syms[0].startsWith("c") && syms[0] !== "mystery") {
      wins.push({ type: "line", sym: syms[0] as SymId, pay: PAYS[syms[0]]! * bet, positions: line as [number,number][] });
    }
  }
  for (let c = 0; c < REELS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c]![r]!;
      if (typeof cell.sym === "string" && cell.sym.startsWith("c")) {
        coinCount++;
        wins.push({ type: "coin", coin: cell.sym as CoinId, pay: COIN_VALS[cell.sym as CoinId]! * bet, positions: [[c, r]] });
      }
    }
  }
  let totalWin = 0;
  for (const w of wins) totalWin += w.pay;
  return { wins, coinCount, totalWin };
}

export function applyMoonMerge(grid: (Cell | null)[][], bet: number): { merged: boolean; newGrid: (Cell | null)[][]; mergeWins: Win[] } {
  let merged = false;
  const newGrid = grid.map(row => row.map(c => c ? { ...c } : null));
  const mergeWins: Win[] = [];
  const visited = new Set<string>();

  for (let c = 0; c < REELS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = newGrid[c]![r];
      if (!cell || typeof cell.sym !== "string" || !cell.sym.startsWith("c") || cell.sym === "mini" || cell.sym === "minor" || cell.sym === "major" || cell.sym === "grand") continue;
      const key = c + "," + r;
      if (visited.has(key)) continue;

      // Check right and down for same coin value
      const neighbors = [[c+1, r], [c, r+1]];
      for (const [nc, nr] of neighbors) {
        if (nc < REELS && nr < ROWS) {
          const nCell = newGrid[nc]![nr];
          if (nCell && nCell.sym === cell.sym) {
            merged = true;
            const nKey = nc + "," + nr;
            visited.add(key); visited.add(nKey);
            // Double value logic: find next coin tier or double numeric
            let newSym: CoinId = MERGE_MAP[cell.sym] || "c250";
            
            newGrid[nc]![nr] = { sym: newSym };
            newGrid[c]![r] = null;
            mergeWins.push({ type: "coin", coin: newSym, pay: COIN_VALS[newSym]! * bet, positions: [[nc, nr]] });
            break; // One merge per cell per pass
          }
        }
      }
    }
  }
  return { merged, newGrid, mergeWins };
}

export function evaluateHoldWin(seed: number, bet: number, initialCoins: {c: number, r: number, sym: CoinId}[]): {
  totalWin: number; steps: { grid: (Cell | null)[][]; wins: Win[] }[]; capped: boolean;
} {
  const rng = mulberry32(seed);
  let grid: (Cell | null)[][] = Array(REELS).fill(null).map(() => Array(ROWS).fill(null));
  for (const ic of initialCoins) grid[ic.c]![ic.r] = { sym: ic.sym };
  
  let respins = 3;
  const steps: { grid: (Cell | null)[][]; wins: Win[] }[] = [];
  let capped = false;

  while (respins > 0) {
    respins--;
    let newCoinsThisStep: {c: number, r: number, sym: CoinId}[] = [];
    const stepWins: Win[] = [];

    for (let c = 0; c < REELS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (!grid[c]![r]) {
          const s = pickWeighted(rng, MYSTERY_WEIGHTS) as SymId | CoinId;
          if (s.startsWith("c")) {
            grid[c]![r] = { sym: s as CoinId };
            newCoinsThisStep.push({ c, r, sym: s as CoinId });
          } else {
            grid[c]![r] = null; 
          }
        }
      }
    }

    if (newCoinsThisStep.length > 0) {
      respins = 3;
      let mergePass = true;
      while (mergePass) {
        const m = applyMoonMerge(grid, bet);
        if (m.merged) {
          grid = m.newGrid;
          stepWins.push(...m.mergeWins);
          respins = 3;
        } else {
          mergePass = false;
        }
      }
    }
    steps.push({ grid: grid.map(r => r.map(c => c ? {...c} : null)), wins: stepWins });
    
    let coinCount = 0;
    for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) if (grid[c]![r] && String(grid[c]![r]!.sym).startsWith("c")) coinCount++;
    if (coinCount === 9) { capped = true; break; }
  }

  let totalWin = 0;
  let finalCoinCount = 0;
  for (let c = 0; c < REELS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const cell = grid[c]![r];
      if (cell && typeof cell.sym === "string" && cell.sym.startsWith("c")) {
        totalWin += COIN_VALS[cell.sym as CoinId]! * bet;
        finalCoinCount++;
      }
    }
  }
  
  if (finalCoinCount === 9) {
    totalWin += 5000 * bet;
    capped = true;
  }

  if (totalWin > 5000 * bet) { totalWin = 5000 * bet; capped = true; }
  return { totalWin, steps, capped };
}

export function buyFeaturePrice(bet: number): number { return bet * 60; }
export function mysteryCost(bet: number): number { return Math.round(bet * 1.5 * 100) / 100; }
