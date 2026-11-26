const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
if (!t.includes('id: "pitch-pulse"')) {
  const m = t.match(/export type GType = [^;]+;/);
  if (m) {
    t = t.replace(m[0], m[0].replace(";", ' | "virtual-sports";'));
  }
  const idx = t.indexOf("export const GAMES") !== -1 ? t.indexOf("export const GAMES") : t.indexOf("const R: GameRec[] = [") + "const R: GameRec[] = [".length;
  const entry = '\n  { id: "pitch-pulse", title: "Pitch Pulse League", type: "virtual-sports", pack: "sports", assetDir: "pitch-pulse", color: "#2a9d8f", color2: "#e9c46a" },';
  t = t.slice(0, idx) + entry + t.slice(idx);
  fs.writeFileSync(f, t, "utf8");
  console.log("pitch-pulse registered");
}
console.log("verify: " + fs.readFileSync(f, "utf8").includes('id: "pitch-pulse"'));
