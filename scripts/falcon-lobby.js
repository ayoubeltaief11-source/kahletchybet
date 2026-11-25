const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
if (t.includes('title="Falcon Dunes"')) {
  console.log("Falcon Dunes row already exists");
} else {
  const anchor = '      <Row title="Atlas Skyfall"';
  const falconRow = '      <Row title="Falcon Dunes" count={1} badge="NEW - 243 WAYS" href="/casino/falcon-dunes">\n        <GameCard href="/casino/falcon-dunes" name="Falcon Dunes" tag="243 WAYS + WILD MULTS + FREE SPINS" badge="NEW" maxWin="x5000" vol="High" felt="linear-gradient(170deg,#2a1a0a,#1a1206)" accent="#C98A3C" slug="falcon-dunes" cover={<Cover kind="reels" hue="#C98A3C" hue2="#2DD4D4"}/>}\n      </Row>\n';
  if (t.includes(anchor)) {
    t = t.split(anchor).join(falconRow + anchor);
  } else {
    const anchor2 = '      <Row title="New Roulette"';
    t = t.split(anchor2).join(falconRow + anchor2);
  }
  fs.writeFileSync(f, t, "utf8");
  console.log("Falcon Dunes row added to lobby");
}
