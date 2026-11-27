import { allGames, hasGame, asset } from "../src/kb3/registry";
import type { GameRec } from "../src/kb3/registry";

export interface Featured {
  id: string; title: string; href: string; type: string; pack: string;
  color: string; color2: string; cover: string; bg: string; logo: string;
  tag: string; blurb: string;
}

const DIRECT: Record<string, string> = {
  "atlas-skyfall": "/casino/atlas-skyfall",
  "falcon-dunes": "/casino/falcon-dunes",
  "moon-rabbit-mint": "/casino/moon-rabbit-mint",
  "pitch-pulse": "/casino/pitch-pulse"
};

const BY_TYPE: Record<string, string> = {
  crash: "/casino/sky/",
  roulette: "/casino/roulette2/",
  cluster: "/casino/cluster/",
  lines: "/casino/lines/",
  mega: "/casino/mega/",
  hold: "/casino/hold/",
  hold3: "/casino/hold/",
  instant: "/casino/instant/",
  "virtual-sports": "/casino/pitch-pulse"
};

const TYPE_LABEL: Record<string, string> = {
  crash: "CRASH", roulette: "LIVE WHEEL", hold3: "HOLD AND WIN", hold: "HOLD AND WIN",
  cluster: "CLUSTER", lines: "PAYLINES", mega: "MEGAWAYS", instant: "INSTANT",
  "virtual-sports": "VIRTUAL SPORTS"
};

const BLURB: Record<string, string> = {
  "atlas-skyfall": "Pays anywhere on the grid. Land the scatter and let the sky multipliers stack.",
  "falcon-dunes": "243 ways across the dunes with wild multipliers and a free-spins pick.",
  "moon-rabbit-mint": "Hold and win under the moon. Fill the grid to reach the Mythic tier.",
  "pitch-pulse": "A full virtual league with live rounds, results and season tables.",
  "skyward-jet": "Shared-round crash. Cash out before the jet stalls.",
  "golden-crown": "The crown wheel with a single zero and a straight-up 35 to 1."
};

const FALLBACK: Featured[] = [
  { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", color: "#7C5CFF", color2: "#F2C14E" },
  { id: "falcon-dunes", title: "Falcon Dunes", type: "lines", pack: "volcano", color: "#E08A3C", color2: "#F2C14E" },
  { id: "moon-rabbit-mint", title: "Moon Rabbit Mint", type: "hold3", pack: "myth", color: "#E0B060", color2: "#2DD4D4" },
  { id: "pitch-pulse", title: "Pitch Pulse League", type: "virtual-sports", pack: "sports", color: "#2a9d8f", color2: "#e9c46a" }
].map(function (r: any) {
  return {
    id: r.id, title: r.title, href: DIRECT[r.id], type: r.type, pack: r.pack,
    color: r.color, color2: r.color2,
    cover: "/assets/" + r.id + "/cover.png",
    bg: "/assets/" + r.id + "/bg.jpg",
    logo: "/assets/" + r.id + "/logo.png",
    tag: TYPE_LABEL[r.type] || "EXCLUSIVE",
    blurb: BLURB[r.id] || "A studio release settled against your TD wallet."
  } as Featured;
});

function toFeatured(rec: GameRec): Featured {
  const base = BY_TYPE[rec.type];
  return {
    id: rec.id, title: rec.title,
    href: DIRECT[rec.id] || (base ? (rec.type === "virtual-sports" ? base : base + rec.id) : "/casino"),
    type: rec.type, pack: rec.pack, color: rec.color, color2: rec.color2,
    cover: asset(rec.id, "cover"), bg: asset(rec.id, "bg"), logo: asset(rec.id, "logo"),
    tag: TYPE_LABEL[rec.type] || rec.type.toUpperCase(),
    blurb: BLURB[rec.id] || (TYPE_LABEL[rec.type] || "Studio") + " release settled against your TD wallet."
  };
}

const byId: Record<string, GameRec> = {};
allGames().forEach(function (r) { byId[r.id] = r; });

function pick(ids: string[]): Featured[] {
  const out: Featured[] = [];
  const seen: Record<string, boolean> = {};
  ids.forEach(function (id) {
    if (seen[id]) return;
    const rec = byId[id];
    if (rec) { out.push(toFeatured(rec)); seen[id] = true; return; }
    const fb = FALLBACK.filter(function (f) { return f.id === id; })[0];
    if (fb) { out.push(fb); seen[id] = true; }
  });
  return out;
}

const CRASH_ORDER = ["skyward-jet", "ember-rocket", "drift-balloon", "rotor-heli", "nightglide-stealth"];
const ROULETTE_ORDER = ["emerald-roulette", "crimson-roulette", "royal-velvet", "midnight-wheel", "golden-crown"];
const FLAGSHIP = ["atlas-skyfall", "falcon-dunes", "moon-rabbit-mint", "pitch-pulse"];

export const FEATURED: Featured[] = pick(FLAGSHIP.concat(CRASH_ORDER, ROULETTE_ORDER));
export const HERO: Featured[] = pick(FLAGSHIP.concat(["skyward-jet", "golden-crown"]));
export const EXCLUSIVE_COUNT = FEATURED.length;
export function featuredById(id: string): Featured | null {
  const hit = FEATURED.filter(function (f) { return f.id === id; })[0];
  return hit || null;
}
export { hasGame };
