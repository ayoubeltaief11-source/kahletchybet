const fs = require("fs");
const f = "src/kb3/registry.ts";
let t = fs.readFileSync(f, "utf8");
const oldType = 'export type GType = "roulette" | "cluster" | "lines" | "mega" | "hold" | "crash" | "instant";';
const newType = 'export type GType = "roulette" | "cluster" | "lines" | "mega" | "hold" | "hold3" | "crash" | "instant";';
if (t.includes(oldType)) {
  t = t.replace(oldType, newType);
  fs.writeFileSync(f, t, "utf8");
  console.log("GType successfully updated to include 'hold3'");
} else {
  console.log("Pattern not found. Current GType line:");
  const match = t.match(/export type GType = [^;]+;/);
  console.log(match ? match[0] : "Not found");
}
