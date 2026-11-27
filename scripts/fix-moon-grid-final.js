const fs = require("fs");
const f = "src/kb3/slots/moon-rabbit-mint/MoonGame.tsx";
let t = fs.readFileSync(f, "utf8");
const lines = t.split("\n");

// البحث عن بداية الكتلة المعطوبة (السطر الذي يحتوي "(inHoldWin ? col : col).map")
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("(inHoldWin ? col : col).map")) { startIdx = i; break; }
}
if (startIdx < 0) { console.log("START NOT FOUND"); process.exit(1); }

// البحث عن أول </div> بعد mm-grid الذي يغلق الشبكة
let depth = 0;
for (let i = startIdx; i < lines.length; i++) {
  const line = lines[i];
  // عدّ الأقواس المعقوفة
  for (const ch of line) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  // عندما نصل إلى depth=0 ووجدنا </div>، انتهت الكتلة
  if (depth <= 0 && line.includes("</div>")) { endIdx = i; break; }
}
if (endIdx < 0) { console.log("END NOT FOUND, startIdx=" + startIdx); process.exit(1); }

console.log("Replacing lines " + (startIdx+1) + " to " + (endIdx+1));

// الكتلة الجديدة المتوازنة
const newBlock = [
  '{(inHoldWin ? (hwSteps[hwStepIdx]?.grid || grid) : grid).map((col, c) => col.map((cell, r) => (',
  '  <div key={c + "-" + r} className="mm-cell" data-c={c} data-r={r}>',
  '    {cell ? <SymImg cell={cell as Cell}/> : <div className="mm-cell-empty"/>}',
  '  </div>',
  ')))}'
].join("\n");

lines.splice(startIdx, endIdx - startIdx + 1, newBlock);
fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("Grid block replaced successfully");
