const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");

// تحديد بداية كتلة العرض
let start = t.indexOf("{Array(3).fill(null).map");
if (start < 0) start = t.indexOf("{(inHoldWin ? hwSteps");
if (start < 0) { console.log("BLOCK START NOT FOUND"); process.exit(1); }

// عدّ الأقواس المعقوفة من start حتى التوازن (الكتلة كلها داخل JSX {})
let depth = 0, end = -1;
for (let i = start; i < t.length; i++) {
  const ch = t[i];
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
}
if (end < 0) { console.log("BLOCK END NOT FOUND"); process.exit(1); }

const oldBlock = t.slice(start, end + 1);
console.log("OLD BLOCK LENGTH: " + oldBlock.length);
console.log("OLD BLOCK HEAD: " + oldBlock.slice(0, 80).replace(/\n/g, " "));

const newBlock = "{(inHoldWin ? (hwSteps[hwStepIdx]?.grid || grid) : grid).map((col, c) => col.map((cell, r) => (<div key={c + \"-\" + r} className=\"mm-cell\" data-c={c} data-r={r}>{cell ? <SymImg cell={cell as Cell}/> : <div className=\"mm-cell-empty\"/>}</div>)))}";

t = t.slice(0, start) + newBlock + t.slice(end + 1);
fs.writeFileSync(f, t, "utf8");
console.log("BLOCK REPLACED WITH BALANCED VERSION");
