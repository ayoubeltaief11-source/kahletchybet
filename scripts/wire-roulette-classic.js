const fs = require("fs");
const f = "app/casino/roulette2/[id]/page.tsx";
let t = fs.readFileSync(f, "utf8");
const before = t;
t = t.split("@/src/kb3/roulette/RoulettePro").join("@/src/kb3/roulette/RouletteGame");
t = t.split("@/components/kb2/roulette/RoulettePro").join("@/src/kb3/roulette/RouletteGame");
if (t === before) { console.log("WARN: import path not found"); }
else { fs.writeFileSync(f, t, "utf8"); console.log("page wired to RouletteGame"); }
console.log("has RouletteGame=" + t.includes("RouletteGame"));
