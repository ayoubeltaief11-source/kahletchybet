const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
if (t.includes('id: "moon-rabbit-mint"')) { console.log("already registered"); }
else {
  const m = t.match(/GameRec\[\]\s*=\s*\[/);
  if (!m) { console.log("ERROR: GameRec array not found"); process.exit(1); }
  const idx = m.index + m[0].length;
  const entry = '\n  { id: "moon-rabbit-mint", title: "Moon Rabbit Mint", type: "hold3", pack: "myth", assetDir: "moon-rabbit-mint", color: "#E0B060", color2: "#2DD4D4" },';
  t = t.slice(0, idx) + entry + t.slice(idx);
  fs.writeFileSync(f, t, "utf8");
  console.log("moon-rabbit-mint inserted");
}
console.log("verify: " + fs.readFileSync(f, "utf8").includes('id: "moon-rabbit-mint"'));
