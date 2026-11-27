const fs = require("fs");
const f = "app/casino/page.tsx";
let t = fs.readFileSync(f, "utf8");
const before = t;

if (t.indexOf('from "@/lib/lobby-featured"') < 0) {
  const anchor = 'import { Row, GameCard, Cover } from "@/components/kb2/Row";';
  t = t.replace(anchor, anchor + '\nimport { FEATURED, EXCLUSIVE_COUNT } from "@/lib/lobby-featured";\nimport FeaturedCover from "@/components/kb/FeaturedCover";');
}

const start = t.indexOf('<h2 className="kb-h2">New Exclusives');
if (start < 0) { console.log("EXCLUSIVES HEADING NOT FOUND"); process.exit(1); }
const secEnd = t.indexOf("</section>", start);
if (secEnd < 0) { console.log("SECTION END NOT FOUND"); process.exit(1); }

const block = [
  '<h2 className="kb-h2">New Exclusives <span className="kb-badge">{EXCLUSIVE_COUNT} TITLES</span></h2>',
  '        <div className="kb-row">',
  '          {FEATURED.map(function (g) {',
  '            return <GameCard key={g.id} href={g.href} name={g.title} tag={g.tag} badge="EXCLUSIVE" maxWin="" vol="" felt={g.color} accent={g.color2} slug={g.id} cover={<FeaturedCover g={g}/>}/>;',
  '          })}',
  '        </div>',
  '      '
].join("\n");

t = t.slice(0, start) + block + t.slice(secEnd);

t = t.replace(
  /<p>\{totalCount\} simulation titles\.[\s\S]*?<\/p>/,
  '<p>{totalCount + EXCLUSIVE_COUNT} simulation titles. {EXCLUSIVE_COUNT} are studio exclusives, {newCount} run on the new studio engines with server-settled rounds, and {KB_GAMES.length} stay available in the classic catalog. Every game shows its RTP because the long-run result is the lesson.</p>'
);

t = t.replace('<div><b>{totalCount}</b><span>Titles</span></div>', '<div><b>{totalCount + EXCLUSIVE_COUNT}</b><span>Titles</span></div>');
t = t.replace('<div><b>{newCount}</b><span>Studio</span></div>', '<div><b>{newCount + EXCLUSIVE_COUNT}</b><span>Studio</span></div>');

if (t === before) { console.log("NO CHANGE"); process.exit(1); }
fs.writeFileSync(f, t, "utf8");
console.log("LOBBY PATCHED");

const reg = fs.readFileSync("src/kb3/registry.ts", "utf8");
const ids = ["atlas-skyfall","falcon-dunes","moon-rabbit-mint","pitch-pulse","skyward-jet","ember-rocket","drift-balloon","rotor-heli","nightglide-stealth","emerald-roulette","crimson-roulette","royal-velvet","midnight-wheel","golden-crown"];
console.log("--- id present in registry ---");
ids.forEach(function (id) { console.log((reg.indexOf('"' + id + '"') >= 0 ? "YES " : "NO  ") + id); });
