const fs = require("fs");
// 1) fix TS syntax in chroma-key.js
const fc = "scripts/chroma-key.js";
let c = fs.readFileSync(fc, "utf8");
c = c.split("meta.width!").join("meta.width").split("meta.height!").join("meta.height");
fs.writeFileSync(fc, c, "utf8");
console.log("chroma syntax fixed: " + !c.includes("meta.width!"));
// 2) tune engine: lower pays, rarer wild, more scatter
const fe = "src/kb3/slots/falcon-dunes/engine.ts";
let t = fs.readFileSync(fe, "utf8");
t = t.replace(/export const PAYS: Record<string, number\[\]> = \{[\s\S]*?\};/, `export const PAYS: Record<string, number[]> = {
  s1: [0.06, 0.3, 1.2],
  s2: [0.06, 0.3, 1.2],
  s3: [0.09, 0.36, 1.5],
  s4: [0.09, 0.36, 1.5],
  s5: [0.15, 0.6, 3],
  s6: [0.15, 0.6, 3],
  s7: [0.3, 1.2, 6],
  s8: [0.6, 3, 15]
};`);
t = t.replace(/const SCATTER_COL = w\(\[\.\.\.LOW, \.\.\.HIGH, "scatter"\], \[[^\]]*\]\);/, 'const SCATTER_COL = w([...LOW, ...HIGH, "scatter"], [170, 160, 140, 130, 80, 65, 40, 26, 30]);');
t = t.replace(/const WILD_COL = w\(\[\.\.\.LOW, \.\.\.HIGH, "wild"\], \[[^\]]*\]\);/, 'const WILD_COL = w([...LOW, ...HIGH, "wild"], [170, 160, 140, 130, 80, 65, 40, 26, 10]);');
t = t.replace(/const SCATTER_COL_MID = w\(\[\.\.\.LOW, \.\.\.HIGH, "scatter"\], \[[^\]]*\]\);/, 'const SCATTER_COL_MID = w([...LOW, ...HIGH, "scatter"], [150, 140, 125, 115, 70, 55, 34, 22, 42]);');
fs.writeFileSync(fe, t, "utf8");
console.log("engine tuned");
