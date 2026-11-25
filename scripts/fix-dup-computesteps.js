const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/engine.ts";
let t = fs.readFileSync(f, "utf8");
const marker = "export interface CascadeStep";
const idx = t.indexOf(marker);
if (idx >= 0) t = t.slice(0, idx);
const block = `export interface CascadeStep { grid: Cell[][]; wins: { sym: SymId; count: number; pay: number; positions: [number, number][] }[]; }
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
      const info = counts[sym];
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
    for (let c = 0; c < COLS; c++) grid[c] = fillColumn(grid[c], ROWS - grid[c].length, rng, weights);
  }
  return { steps, finalGrid: grid, multSum, multPositions, scatterCount, baseWin, capped };
}
`;
t = t + block;
fs.writeFileSync(f, t, "utf8");
const n = (t.match(/export function computeSteps/g) || []).length;
console.log("computeSteps copies now: " + n);
