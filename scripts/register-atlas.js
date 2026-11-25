const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
if (t.includes("atlas-skyfall")) {
  console.log("atlas-skyfall already registered");
} else {
  const entry = `  { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", assetDir: "atlas-skyfall", color: "#2DD4D4", color2: "#C98A3C" },`;
  t = t.replace("export const GAMES: GameRec[] = [", "export const GAMES: GameRec[] = [\n" + entry);
  fs.writeFileSync(f, t, "utf8");
  console.log("atlas-skyfall registered in registry.ts");
}
