const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
let t = fs.readFileSync(f, "utf8");
const R = [
  ['import { getGame, asset } from "../../registry";\n', ''],
  ['  const g = (function () { try { return getGame("atlas-skyfall"); } catch (e) { return { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", assetDir: "atlas-skyfall", color: "#2DD4D4", color2: "#C98A3C" }; } })();', '  const g = { color: "#2DD4D4", color2: "#C98A3C" };'],
  ['asset("atlas-skyfall", "bg")', '"/assets/atlas-skyfall/bg.jpg"'],
  ['asset("atlas-skyfall", "logo")', '"/assets/atlas-skyfall/logo.png"']
];
for (const [a, b] of R) { if (t.includes(a)) t = t.split(a).join(b); else console.log("MISS: " + a.slice(0, 60)); }
fs.writeFileSync(f, t, "utf8");
console.log("registry dependency removed: " + !t.includes("getGame") + " / asset calls left: " + (t.match(/asset\(/g) || []).length);
