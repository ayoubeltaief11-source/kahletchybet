const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
const newSection = `
      <section className="kb-section">
        <h2 className="kb-h2">New Exclusives <span className="kb-badge">6 TITLES</span></h2>
        <div className="kb-row">
          {["atlas-skyfall", "falcon-dunes", "moon-rabbit-mint", "pitch-pulse", "skyward-jet", "golden-crown"].map(function (id) {
            const g = KB_GAMES.find(function (x) { return x.id === id; });
            if (!g) return null;
            return <GameCard key={g.id} href={"/casino/" + g.id} name={g.name} tag={g.tag} badge="EXCLUSIVE" maxWin={g.maxWin} vol={g.vol} felt={g.felt} accent={g.color} slug={g.id} cover={<GameCoverSvg gameId={g.id} type={g.type} color={g.color} color2={g.color2} title={g.name} maxWin={g.maxWin}/>} />;
          })}
        </div>
      </section>
`;
if (!t.includes("New Exclusives")) {
  const insertPoint = t.indexOf("<HeroCarousel/>");
  if (insertPoint >= 0) {
    const endOfCarousel = t.indexOf("\n", insertPoint) + 1;
    t = t.slice(0, endOfCarousel) + newSection + t.slice(endOfCarousel);
    fs.writeFileSync(f, t, "utf8");
    console.log("New Exclusives section added after HeroCarousel");
  } else {
    console.log("HeroCarousel not found");
  }
} else {
  console.log("New Exclusives already exists");
}
