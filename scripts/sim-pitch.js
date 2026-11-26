const path = require("path");
const { execSync } = require("child_process");
console.log("Compiling TS...");
execSync('npx tsc "src/kb3/sports/pitch-pulse/engine.ts" "src/kb3/sports/pitch-pulse/clock.ts" "src/kb3/sports/pitch-pulse/leagues.ts" --outDir ".tmp-pitch" --module commonjs --target es2019 --skipLibCheck --esModuleInterop', { stdio: "inherit" });
const { calculateOdds } = require(path.join(__dirname, "..", ".tmp-pitch", "engine.js"));
const { mulberry32 } = require(path.join(__dirname, "..", ".tmp-pitch", "clock.js"));

const N = 2000000;
let totalStake = 0, totalReturn = 0, totalGoals = 0, bttsCount = 0, over25Count = 0;

for (let i = 0; i < N; i++) {
  const rng = mulberry32(i);
  const lamH = 1.2 + (rng() * 0.6);
  const lamA = 0.9 + (rng() * 0.6);
  const odds = calculateOdds(lamH, lamA);
  
  // Simulate 1X2 bet on favorite (lowest price)
  const prices = [odds.p1, odds.pX, odds.p2].map(p => +(1/p).toFixed(2)); // true probs
  // Simplified RTP check: theoretical RTP for 1X2 is 1/1.06 = 94.33%
  totalStake += 3; // 1 unit on each outcome to guarantee a win for RTP math check
  totalReturn += (1 / odds.p1) + (1 / odds.pX) + (1 / odds.p2); // sum of (stake * price) for all 3
  
  // Simulate actual match for stats
  const gH = poisson(lamH, rng);
  const gA = poisson(lamA, rng);
  totalGoals += (gH + gA);
  if (gH > 0 && gA > 0) bttsCount++;
  if ((gH + gA) > 2) over25Count++;
}

function poisson(lambda, rng) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

console.log("=== Pitch Pulse Simulation ===");
console.log("Matches: " + N);
console.log("Theoretical 1X2 RTP: " + ((1 / 1.06) * 100).toFixed(2) + "% (Margin 6%)");
console.log("Simulated Return Ratio: " + ((totalReturn / totalStake) * 100).toFixed(2) + "%");
console.log("Avg Goals per match: " + (totalGoals / N).toFixed(2));
console.log("BTTS %: " + ((bttsCount / N) * 100).toFixed(2) + "%");
console.log("Over 2.5 %: " + ((over25Count / N) * 100).toFixed(2) + "%");
