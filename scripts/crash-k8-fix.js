const fs = require("fs");
const f = "lib/kb2/crashLoop.ts";
let t = fs.readFileSync(f, "utf8");
const lines = t.split("\n");
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("export function botsOf(index: number)")) {
    lines[i] = lines[i].replace("export function botsOf(index: number)", "export function botsOf(index: number, gameId?: string)");
    found = true;
    console.log("botsOf signature updated at line " + (i + 1));
    break;
  }
}
if (!found) console.log("botsOf signature not found, checking current:");
const after = lines.join("\n");
fs.writeFileSync(f, after, "utf8");
console.log("has gameId param: " + after.includes("gameId?: string"));
