const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");

// البحث عن كتلة Falcon Dunes المعطوبة واستبدالها بالكتلة الصحيحة المغلقة
const brokenRegex = /<Row\s+title="Falcon Dunes"[\s\S]*?<\/Row>/;

const correctRow = `<Row title="Falcon Dunes" count={1} badge="NEW - 243 WAYS" href="/casino/falcon-dunes">
        <GameCard href="/casino/falcon-dunes" name="Falcon Dunes" tag="243 WAYS + WILD MULTS + FREE SPINS" badge="NEW" maxWin="x5000" vol="High" felt="linear-gradient(170deg,#2a1a0a,#1a1206)" accent="#C98A3C" slug="falcon-dunes" cover={<Cover kind="reels" hue="#C98A3C" hue2="#2DD4D4"/>} />
      </Row>`;

if (brokenRegex.test(t)) {
  t = t.replace(brokenRegex, correctRow);
  fs.writeFileSync(f, t, "utf8");
  console.log("Falcon Dunes row syntax fixed (GameCard properly closed).");
} else if (t.includes('title="Falcon Dunes"')) {
  console.log("Falcon Dunes exists but regex didn't match. Please check app/casino/page.tsx manually.");
} else {
  console.log("Falcon Dunes row not found.");
}
