const fs = require("fs");
const f = "components/kb/HeroCarousel.tsx";
let t = fs.readFileSync(f, "utf8");
const oldWant = 'const want = ["jet", "mega5", "jackpot5", "vip", "mines", "plinko"];';
const newWant = 'const want = ["atlas-skyfall", "falcon-dunes", "moon-rabbit-mint", "pitch-pulse", "skyward-jet", "golden-crown"];';
if (t.includes(oldWant)) {
  t = t.replace(oldWant, newWant);
  fs.writeFileSync(f, t, "utf8");
  console.log("HeroCarousel updated to show new games");
} else {
  console.log("Pattern not found - HeroCarousel may already be updated");
}
