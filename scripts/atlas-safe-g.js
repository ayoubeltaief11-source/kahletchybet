const fs = require("fs");
const f = "src/kb3/slots/atlas-skyfall/AtlasGame.tsx";
let t = fs.readFileSync(f, "utf8");
const old = '  const g = getGame("atlas-skyfall");';
const neu = '  const g = (function () { try { return getGame("atlas-skyfall"); } catch (e) { return { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", assetDir: "atlas-skyfall", color: "#2DD4D4", color2: "#C98A3C" }; } })();';
if (t.includes(old)) { t = t.split(old).join(neu); fs.writeFileSync(f, t, "utf8"); console.log("AtlasGame decoupled from getGame throw"); }
else console.log("anchor already replaced or missing: " + t.includes("try { return getGame"));
