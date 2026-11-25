const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
const anchor = '      <Row title="New Roulette" count={newGamesByFamily("roulette").length} badge="EXCLUSIVE" href={"/casino/roulette2/" + newGamesByFamily("roulette")[0].slug}>';
const atlasRow = '      <Row title="Atlas Skyfall" count={1} badge="NEW - PAYS ANYWHERE" href="/casino/atlas-skyfall">\n        <GameCard href="/casino/atlas-skyfall" name="Atlas Skyfall" tag="PAYS ANYWHERE + TUMBLE + MULT BALLS" badge="NEW" maxWin="x25000" vol="High" felt="linear-gradient(170deg,#0B1530,#060b1a)" accent="#2DD4D4" slug="atlas-skyfall" cover={<Cover kind="cluster" hue="#2DD4D4" hue2="#C98A3C"/>}/>\n      </Row>\n';
if (t.includes(anchor) && !t.includes('title="Atlas Skyfall"')) {
  t = t.split(anchor).join(atlasRow + anchor);
  fs.writeFileSync(f, t, "utf8");
  console.log("Atlas featured row added to lobby");
} else {
  console.log("anchor found=" + t.includes(anchor) + " already=" + t.includes('title="Atlas Skyfall"'));
}
