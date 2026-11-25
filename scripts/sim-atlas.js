const path = require("path");
const fs = require("fs");
// Compile engine first
const { execSync } = require("child_process");
execSync('npx tsc "src/kb3/slots/atlas-skyfall/engine.ts" --outDir ".tmp-atlas" --module commonjs --target es2019 --skipLibCheck --esModuleInterop', { stdio: "inherit" });
const { computeSpin, MULT_VALUES } = require(path.join(__dirname, "..", ".tmp-atlas", "engine.js"));

const N = 1000000;
const BET = 1;
let totalBet = 0, totalWin = 0, wins = 0, maxWin = 0;
let fsHits = 0, fsWins = 0;
const winBuckets = { lt1:0, gte1:0, gte5:0, gte10:0, gte50:0, gte100:0, gte500:0, gte1000:0 };

for (let i = 0; i < N; i++) {
  const seed = i * 7919 + 13;
  const ante = (i % 4 === 0);
  const r = computeSpin(seed, ante, false, 0);
  totalBet += BET;
  totalWin += r.totalWin;
  if (r.totalWin > 0) wins++;
  if (r.totalWin > maxWin) maxWin = r.totalWin;
  if (r.scatterCount >= 4) fsHits++;
  if (r.totalWin >= 1) winBuckets.gte1++;
  if (r.totalWin >= 5) winBuckets.gte5++;
  if (r.totalWin >= 10) winBuckets.gte10++;
  if (r.totalWin >= 50) winBuckets.gte50++;
  if (r.totalWin >= 100) winBuckets.gte100++;
  if (r.totalWin >= 500) winBuckets.gte500++;
  if (r.totalWin >= 1000) winBuckets.gte1000++;
  if (r.totalWin < 1) winBuckets.lt1++;
}

const rtp = (totalWin / totalBet * 100).toFixed(2);
const hitRate = (wins / N * 100).toFixed(2);
const volatility = (maxWin / BET).toFixed(0);
const fsRate = (fsHits / N * 100).toFixed(3);

console.log("=== Atlas Skyfall Simulation ===");
console.log("Rounds: " + N);
console.log("RTP: " + rtp + "%");
console.log("Hit rate: " + hitRate + "%");
console.log("Max win: " + volatility + "x");
console.log("Free spins trigger: " + fsRate + "% (1 in " + Math.round(N/fsHits) + ")");
console.log("Win distribution:");
console.log("  <1x:    " + (winBuckets.lt1/N*100).toFixed(2) + "%");
console.log("  >=1x:   " + (winBuckets.gte1/N*100).toFixed(2) + "%");
console.log("  >=5x:   " + (winBuckets.gte5/N*100).toFixed(2) + "%");
console.log("  >=10x:  " + (winBuckets.gte10/N*100).toFixed(2) + "%");
console.log("  >=50x:  " + (winBuckets.gte50/N*100).toFixed(2) + "%");
console.log("  >=100x: " + (winBuckets.gte100/N*100).toFixed(2) + "%");
console.log("  >=500x: " + (winBuckets.gte500/N*100).toFixed(2) + "%");
console.log("  >=1000x:" + (winBuckets.gte1000/N*100).toFixed(2) + "%");
if (parseFloat(rtp) < 95 || parseFloat(rtp) > 96.5) {
  console.log("WARNING: RTP outside target 95-96.5%. Adjust weights.");
} else {
  console.log("RTP within target range.");
}
