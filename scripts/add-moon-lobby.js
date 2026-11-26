const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
if (!t.includes('title="Moon Rabbit Mint"')) {
  const anchor = '<Row title="Falcon Dunes"';
  const moonRow = `<Row title="Moon Rabbit Mint" count={1} badge="NEW - HOLD & WIN" href="/casino/moon-rabbit-mint">
        <GameCard href="/casino/moon-rabbit-mint" name="Moon Rabbit Mint" tag="HOLD & WIN + MOON MERGE + MYSTERY" badge="NEW" maxWin="x5000" vol="High" felt="linear-gradient(170deg,#0a0a1a,#1a1004)" accent="#e0b060" slug="moon-rabbit-mint" cover={<Cover kind="reels" hue="#e0b060" hue2="#2DD4D4"/>} />
      </Row>\n      `;
  t = t.split(anchor).join(moonRow + anchor);
  fs.writeFileSync(f, t, "utf8");
  console.log("Moon Rabbit Mint added to lobby");
}
