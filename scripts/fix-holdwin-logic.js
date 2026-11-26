const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/engine.ts";
let t = fs.readFileSync(f, "utf8");

// نبحث عن بداية evaluateHoldWin ونستبدلها بالنسخة الصحيحة
const startMarker = "export function evaluateHoldWin(seed: number, bet: number, initialCoins:";
const endMarker = "export function buyFeaturePrice";

const startIndex = t.indexOf(startMarker);
const endIndex = t.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const correctHoldWin = `export function evaluateHoldWin(seed: number, bet: number, initialCoins: {c: number, r: number, sym: CoinId}[]): {
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

`;
  t = t.slice(0, startIndex) + correctHoldWin + t.slice(endIndex);
  fs.writeFileSync(f, t, "utf8");
  console.log("evaluateHoldWin replaced with correct end-of-feature payout logic.");
} else {
  console.log("Markers not found. Manual check required.");
}
