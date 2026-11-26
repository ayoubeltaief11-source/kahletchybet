const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
if (!t.includes('title="Pitch Pulse"')) {
  const anchor = '<Row title="Moon Rabbit Mint"';
  const pitchRow = `<Row title="Pitch Pulse League" count={1} badge="VIRTUAL SPORTS" href="/casino/pitch-pulse">
        <GameCard href="/casino/pitch-pulse" name="Pitch Pulse League" tag="LIVE BETTING + 6 LEAGUES + HOLD & WIN" badge="NEW" maxWin="x10000" vol="Medium" felt="linear-gradient(170deg,#0f1115,#1e2330)" accent="#2a9d8f" slug="pitch-pulse" cover={<Cover kind="reels" hue="#2a9d8f" hue2="#e9c46a"/>} />
      </Row>\n      `;
  t = t.split(anchor).join(pitchRow + anchor);
  fs.writeFileSync(f, t, "utf8");
  console.log("Pitch Pulse added to lobby");
}
