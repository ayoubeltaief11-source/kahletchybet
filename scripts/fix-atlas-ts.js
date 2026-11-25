const fs = require("fs");
// --- AtlasGame: مسار الرموز مباشرة + إزالة سطر رصيد زائد + تأكيد فهرسة ---
const fa = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
let a = fs.readFileSync(fa, "utf8");
a = a.split('asset("atlas-skyfall", "symbols/" + sym)').join('"/assets/atlas-skyfall/symbols/" + sym + ".png"');
a = a.split('    setBal(function (b) { Math.round((b - bet) * 100) / 100; return b; });\n').join('');
a = a.split('res.steps[i]').join('res.steps[i]!');
fs.writeFileSync(fa, a, "utf8");
console.log("AtlasGame asset path fixed: " + a.includes('/assets/atlas-skyfall/symbols/'));
// --- engine: تأكيد عدم-undefined على الفهرسة ---
const fe = "src/kb3/slots/atlas-skyfall/engine.ts";
let e = fs.readFileSync(fe, "utf8");
const reps = [
  ["grid[c][r]", "grid[c]![r]!"],
  ["counts[k].count++", "counts[k]!.count++"],
  ["counts[k].positions.push", "counts[k]!.positions.push"],
  ["best = t[k]", "best = t[k]!"],
  ["weights[k]", "weights[k]!"],
  ["fillColumn(grid[c],", "fillColumn(grid[c]!,"],
  ["const info = counts[sym];", "const info = counts[sym]!;"],
  ["return Object.keys(weights)[Object.keys(weights).length - 1];", "return Object.keys(weights)[Object.keys(weights).length - 1]!;"]
];
for (const [x, y] of reps) e = e.split(x).join(y);
fs.writeFileSync(fe, e, "utf8");
console.log("engine index assertions applied");
