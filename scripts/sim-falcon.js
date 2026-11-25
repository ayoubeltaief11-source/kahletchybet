const path = require("path");
const { execSync } = require("child_process");
execSync('npx tsc "src/kb3/slots/falcon-dunes/engine.ts" --outDir ".tmp-falcon" --module commonjs --target es2019 --skipLibCheck --esModuleInterop', { stdio: "inherit" });
const E = require(path.join(__dirname, "..", ".tmp-falcon", "engine.js"));

const N = 1000000;
const BET = 1;
let totalBet = 0, totalWin = 0, wins = 0, maxWin = 0, feature = 0, freeWinTotal = 0;
const buckets = { lt1: 0, gte1: 0, gte5: 0, gte10: 0, gte50: 0, gte100: 0, gte500: 0, gte1000: 0, cap: 0 };

function lcg(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function simulateFree(seed, modeIndex) {
  const mode = E.FS_MODES[modeIndex];
  let total = 0;
  let s = seed;
  for (let i = 0; i < mode.spins; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const r = E.evaluateFreeSpin(s, BET, modeIndex, 0);
    total += r.spinWin;
  }
  return total;
}

for (let i = 0; i < N; i++) {
  const seed = i * 7919 + 17;
  const ante = i % 3 === 0;
  const cost = ante ? 1.25 : 1;
  const r = E.evaluateRound(seed, BET, ante);
  totalBet += cost;
  let roundWin = r.totalWin;
  if (r.featureTriggered) {
    feature++;
    const rr = lcg(seed ^ 0x9e3779b9);
    const modeIndex = Math.floor(rr() * E.FS_MODES.length);
    const fw = simulateFree(seed ^ 0x51ed, modeIndex);
    freeWinTotal += fw;
    roundWin += fw;
  }
  if (roundWin > 5000) roundWin = 5000;
  totalWin += roundWin;
  if (roundWin > 0) wins++;
  if (roundWin > maxWin) maxWin = roundWin;
  if (r.capped) buckets.cap++;
  if (roundWin < BET) buckets.lt1++;
  if (roundWin >= BET) buckets.gte1++;
  if (roundWin >= BET * 5) buckets.gte5++;
  if (roundWin >= BET * 10) buckets.gte10++;
  if (roundWin >= BET * 50) buckets.gte50++;
  if (roundWin >= BET * 100) buckets.gte100++;
  if (roundWin >= BET * 500) buckets.gte500++;
  if (roundWin >= BET * 1000) buckets.gte1000++;
}

const rtp = (totalWin / totalBet * 100).toFixed(2);
const baseRtp = ((totalWin - freeWinTotal) / totalBet * 100).toFixed(2);
console.log("=== Falcon Dunes Simulation (incl. free spins) ===");
console.log("RTP total: " + rtp + "%   (base " + baseRtp + "% + feature " + (freeWinTotal / totalBet * 100).toFixed(2) + "%)");
console.log("Hit rate: " + (wins / N * 100).toFixed(2) + "%");
console.log("Max win: " + maxWin + "x");
console.log("Feature trigger: " + (feature / N * 100).toFixed(3) + "% (1 in " + Math.round(N / Math.max(1, feature)) + ")");
console.log("Capped: " + buckets.cap);
console.log("  >=1x:" + (buckets.gte1 / N * 100).toFixed(2) + "%  >=10x:" + (buckets.gte10 / N * 100).toFixed(2) + "%  >=100x:" + (buckets.gte100 / N * 100).toFixed(2) + "%");
const v = parseFloat(rtp);
console.log(v >= 95 && v <= 96.5 ? "RTP within target." : "WARNING: adjust weights/pays.");
