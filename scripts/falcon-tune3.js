const fs = require("fs");
// --- chroma-key: correct targets, sane FAIL, lock-safe ---
const fc = "scripts/chroma-key.js";
let c = fs.readFileSync(fc, "utf8");
c = c.replace(/  function walk\(dir\) \{[\s\S]*?  walk\(ROOT\);/, `  const targets = [];
  function addIf(p) { if (fs.existsSync(p)) targets.push(p); }
  for (let i = 1; i <= 8; i++) addIf(ROOT + "/symbols/s" + i + ".png");
  addIf(ROOT + "/symbols/wild.png");
  addIf(ROOT + "/symbols/scatter.png");
  addIf(ROOT + "/falcon-statue.png");
  addIf(ROOT + "/fx/coin.png");`);
c = c.split("if (after.some(function (v) { return v === 255; })) {").join("if (before.every(function (v) { return v === 255; }) && after.every(function (v) { return v === 255; })) {");
c = c.split('  fs.renameSync(dst + ".tmp", dst);').join('  try { fs.renameSync(dst + ".tmp", dst); } catch (e) { console.log("LOCKED (close Explorer then rerun): " + dst); try { fs.unlinkSync(dst + ".tmp"); } catch (e2) {} return; }');
fs.writeFileSync(fc, c, "utf8");
console.log("chroma targets+fail+lock fixed");
// --- engine: raise pays x1.5, stronger free wild ---
const fe = "src/kb3/slots/falcon-dunes/engine.ts";
let t = fs.readFileSync(fe, "utf8");
t = t.replace(/export const PAYS: Record<string, number\[\]> = \{[\s\S]*?\};/, `export const PAYS: Record<string, number[]> = {
  s1: [0.09, 0.45, 1.8],
  s2: [0.09, 0.45, 1.8],
  s3: [0.13, 0.54, 2.2],
  s4: [0.13, 0.54, 2.2],
  s5: [0.22, 0.9, 4.5],
  s6: [0.22, 0.9, 4.5],
  s7: [0.45, 1.8, 9],
  s8: [0.9, 4.5, 22]
};`);
t = t.split("if (i === 1 || i === 3) copy.wild = (copy.wild || 8) * 1.2;").join("if (i === 1 || i === 3) copy.wild = (copy.wild || 8) * 1.8;");
fs.writeFileSync(fe, t, "utf8");
console.log("engine pays raised");
