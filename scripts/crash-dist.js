const path = require("path");
const { stateAt, cleanupEngine } = require(path.join(__dirname, "..", ".tmp-crash", "crashEngine.js"));

const games = ["skyward-jet", "ember-rocket", "drift-balloon", "rotor-heli", "nightglide-stealth"];
const N = 100000;

for (const gameId of games) {
  let under15 = 0, over2 = 0, over10 = 0;
  const start = Date.now();
  for (let i = 0; i < N; i++) {
    const s = stateAt(gameId, start + i * 21000);
    const c = s.crashAt;
    if (c < 1.5) under15++;
    if (c >= 2) over2++;
    if (c >= 10) over10++;
  }
  cleanupEngine(gameId);
  console.log(gameId + ": <1.5x=" + (under15 / N * 100).toFixed(1) + "%  >=2x=" + (over2 / N * 100).toFixed(1) + "%  >=10x=" + (over10 / N * 100).toFixed(1) + "%");
}
