const fs = require("fs");
// 1) chroma-key: rename instead of copy (Windows lock safe)
const fc = "scripts/chroma-key.js";
let c = fs.readFileSync(fc, "utf8");
c = c.split('fs.copyFileSync(dst + ".tmp", dst);\n  fs.unlinkSync(dst + ".tmp");').join('fs.renameSync(dst + ".tmp", dst);');
fs.writeFileSync(fc, c, "utf8");
console.log("chroma rename fix: " + c.includes('fs.renameSync(dst + ".tmp", dst)'));
// 2) engine: wild boost only on wild columns (1,3), lighter boost; base wild rarer
const fe = "src/kb3/slots/falcon-dunes/engine.ts";
let t = fs.readFileSync(fe, "utf8");
t = t.replace(/  const weights: Record<SymId, number>\[\] = REEL_WEIGHTS\.map\(function \(col\) \{[\s\S]*?\  \}\);/, `  const weights: Record<SymId, number>[] = REEL_WEIGHTS.map(function (col, i) {
    const copy = Object.assign({}, col);
    if (i === 1 || i === 3) copy.wild = (copy.wild || 8) * 1.2;
    return copy;
  });`);
t = t.replace(/const WILD_COL = w\(\[\.\.\.LOW, \.\.\.HIGH, "wild"\], \[[^\]]*\]\);/, 'const WILD_COL = w([...LOW, ...HIGH, "wild"], [170, 160, 140, 130, 80, 65, 40, 26, 8]);');
fs.writeFileSync(fe, t, "utf8");
console.log("free-spin wild columns fixed: " + t.includes("if (i === 1 || i === 3)"));
