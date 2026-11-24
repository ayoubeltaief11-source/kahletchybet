const path = require("path");
const eng = require(path.join(__dirname, "..", ".tmp-rltsc", "engine.js"));
const N = 100000;

function run(variant) {
  const rng = eng.makeRng(20261124);
  const pockets = eng.pocketsFor(variant);
  const bets = [
    eng.makeBet(variant, "straight", ["17"], 1),
    eng.makeBet(variant, "red", eng.outsideNumbers("red"), 1),
    eng.makeBet(variant, "dozen", eng.dozenNumbers(1), 1)
  ];
  let stake = 0;
  let ret = 0;
  for (let i = 0; i < N; i++) {
    const pocket = pockets[Math.floor(rng() * pockets.length)];
    const s = eng.settle(variant, bets, pocket);
    stake += s.totalStake;
    ret += s.totalReturn;
  }
  const theo = (eng.theoreticalRtp(variant, "straight") + eng.theoreticalRtp(variant, "red") + eng.theoreticalRtp(variant, "dozen")) / 3;
  console.log(variant.padEnd(9) + " spins=" + N + "  RTP=" + ((ret / stake) * 100).toFixed(2) + "%  theory=" + (theo * 100).toFixed(2) + "%");
}

console.log("Roulette RTP simulation: 1 straight(17) + 1 red + 1 dozen per spin");
run("european");
run("american");
run("french");
