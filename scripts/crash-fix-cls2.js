const fs = require("fs");
const f = "components/kb2/crash/CrashLive.tsx";
let t = fs.readFileSync(f, "utf8");
const old = 'const hist = historyOf(live.index, rtp, 16).map(function (h) {  return { ...h, cls: cls }; });';
const neu = 'const hist = historyOf(live.index, rtp, 16);';
if (t.includes(old)) {
  t = t.split(old).join(neu);
  fs.writeFileSync(f, t, "utf8");
  console.log("hist map cleaned");
} else {
  console.log("anchor not found, trying flexible:");
  const lines = t.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const hist = historyOf") && lines[i].includes("cls: cls")) {
      lines[i] = '  const hist = historyOf(live.index, rtp, 16);';
      console.log("fixed at line " + (i + 1));
      break;
    }
  }
  fs.writeFileSync(f, lines.join("\n"), "utf8");
}
const after = fs.readFileSync(f, "utf8");
console.log("cls still used in hist: " + after.includes("cls: cls"));
