const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");
const reps = [
  ['"Minimum stake is 1 TD"', '"Minimum stake is 1"'],
  ['"Insufficient TD balance"', '"Insufficient balance"'],
  ['"BET " + fmt(p.stake) + " TD"', '"BET " + fmt(p.stake)'],
  ['{fmt(amount)} TD', '{fmt(amount)}'],
  ['+{fmt(p.paid)} TD', '+{fmt(p.paid)}'],
  ['{fmt(totalBets)} TD staked', '{fmt(totalBets)} staked'],
  ['{fmt(totalWin)} TD paid', '{fmt(totalWin)} paid'],
  ['{fmt(b.stake)} TD', '{fmt(b.stake)}'],
  ['{fmt(b.stake * b.cash)} TD', '{fmt(b.stake * b.cash)}'],
  ['the long-run result is always negative. TD has no monetary value.', 'the long-run result is always negative. Virtual currency has no monetary value.']
];
let changed = 0;
for (const [a, b] of reps) {
  if (t.includes(a)) { t = t.split(a).join(b); changed++; }
}
fs.writeFileSync(f, t, "utf8");
console.log("replacements made: " + changed);
console.log("any TD left: " + t.includes(" TD"));
