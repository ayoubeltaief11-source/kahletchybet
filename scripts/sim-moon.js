const path = require("path");
const { execSync } = require("child_process");
execSync('npx tsc "src/kb3/slots/moon-rabbit-mint/engine.ts" --outDir ".tmp-moon" --module commonjs --target es2019 --skipLibCheck --esModuleInterop', { stdio: "inherit" });
const E = require(path.join(__dirname, "..", ".tmp-moon", "engine.js"));

const N = 1000000;
const BET = 1;
let totalBet = 0, totalWin = 0, wins = 0, maxWin = 0, feature = 0;
const coinDist = { std: 0, mini: 0, minor: 0, major: 0, grand: 0 };

for (let i = 0; i < N; i++) {
  const seed = i * 7919 + 23;
  const mystery = i % 5 === 0;
  const cost = mystery ? 1.5 : 1;
  totalBet += cost;
  const rng = E.mulberry32(seed);
  const weights = mystery ? E.MYSTERY_WEIGHTS : E.BASE_WEIGHTS;
  const grid = E.makeGrid(rng, weights, mystery);
  const base = E.evaluateBase(grid, BET, mystery);
  let roundWin = base.totalWin;
  if (roundWin > 0) wins++;
  if (base.coinCount >= 5) {
    feature++;
    const initialCoins = [];
    for (let c = 0; c < E.REELS; c++) {
      for (let r = 0; r < E.ROWS; r++) {
        const cell = grid[c][r];
        if (cell && String(cell.sym).startsWith("c")) initialCoins.push({ c: c, r: r, sym: cell.sym });
      }
    }
    const hw = E.evaluateHoldWin(seed ^ 0x9e3779b9, BET, initialCoins);
    roundWin += hw.totalWin;
    for (const step of hw.steps) {
      for (const w of step.wins) {
        if (w.type === "coin" && w.coin) {
          if (["mini","minor","major","grand"].indexOf(w.coin) >= 0) coinDist[w.coin]++;
          else coinDist.std++;
        }
      }
    }
  }
  if (roundWin > maxWin) maxWin = roundWin;
  totalWin += roundWin;
}

const rtp = (totalWin / totalBet * 100).toFixed(2);
console.log("=== Moon Rabbit Mint Simulation ===");
console.log("RTP: " + rtp + "%");
console.log("Hit rate: " + (wins / N * 100).toFixed(2) + "%");
console.log("Feature trigger: " + (feature / N * 100).toFixed(3) + "% (1 in " + Math.round(N / Math.max(1, feature)) + ")");
console.log("Max win: " + maxWin + "x");
console.log("Coin dist in feature: std=" + coinDist.std + " mini=" + coinDist.mini + " minor=" + coinDist.minor + " major=" + coinDist.major + " grand=" + coinDist.grand);
const v = parseFloat(rtp);
console.log(v >= 95 && v <= 96.5 ? "RTP within target." : "WARNING: RTP outside 95-96.5, adjust weights.");
