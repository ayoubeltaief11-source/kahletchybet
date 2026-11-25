const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
const broken = 'cover={<Cover kind="reels" hue="#C98A3C" hue2="#2DD4D4"}/>}';
const fixed = 'cover={<Cover kind="reels" hue="#C98A3C" hue2="#2DD4D4"/>}';
if (t.includes(broken)) {
  t = t.split(broken).join(fixed);
  fs.writeFileSync(f, t, "utf8");
  console.log("Syntax fixed: removed extra } in GameCard cover");
} else {
  console.log("Pattern not found, checking current state...");
}
