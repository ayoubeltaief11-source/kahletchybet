const fs = require("fs");
const f = "lib/kb2/crashLoop.ts";
let t = fs.readFileSync(f, "utf8");
if (!t.includes("mulberry32")) {
  t = t.replace("export function botsOf(index: number): BotBet[] {", "function mulberry32(seed: number): () => number {\n  let a = seed >>> 0;\n  return function () {\n    a = (a + 0x6d2b79f5) | 0;\n    let t = Math.imul(a ^ (a >>> 15), 1 | a);\n    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;\n    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n  };\n}\n\nexport function botsOf(index: number, gameId?: string): BotBet[] {");
  t = t.replace("const rng = makeRng(index * 7919 + 42);", "const rng = makeRng(index * 7919 + 42 + (gameId ? hashStr(gameId) : 0));");
  fs.writeFileSync(f, t, "utf8");
  console.log("botsOf seeded per game: " + t.includes("gameId ? hashStr(gameId)"));
} else {
  console.log("already seeded");
}
