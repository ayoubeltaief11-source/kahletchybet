const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
if (t.includes('id: "atlas-skyfall"')) {
  console.log("atlas already in registry");
} else {
  const m = t.match(/export const GAMES[^=]*=\s*\[/);
  if (!m) { console.log("ERROR: GAMES array not found"); process.exit(1); }
  const idx = m.index + m[0].length;
  const entry = '\n  { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", assetDir: "atlas-skyfall", color: "#2DD4D4", color2: "#C98A3C" },';
  t = t.slice(0, idx) + entry + t.slice(idx);
  fs.writeFileSync(f, t, "utf8");
  console.log("atlas inserted into GAMES at index " + idx);
}
const after = fs.readFileSync(f, "utf8");
console.log("registry has atlas: " + after.includes('id: "atlas-skyfall"'));
