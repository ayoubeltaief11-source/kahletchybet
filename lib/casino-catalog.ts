import type { EngineKind } from "./casino-engine";

export interface CasinoTitle {
  slug: string; name: string; engine: EngineKind; category: string;
  symbols: string[]; hue: string; hue2: string; tag: string; rtp: string; volatility: string;
}

const SLOT_THEMES: [string, string[], string, string][] = [
  ["Sugar Storm", ["\u{1F36C}","\u{1F36D}","\u{1F370}","\u{1F9C1}","\u{1F369}","\u{1F48E}"], "#FF6FB5", "#A855F7"],
  ["Candy Nebula", ["\u{1F36D}","\u{1F36C}","\u{1F36B}","\u{1F368}","\u{1F9C1}","\u{2B50}"], "#F472B6", "#7C3AED"],
  ["Five Guardians", ["\u{1F981}","\u{1F409}","\u{1F42F}","\u{1F985}","\u{1F40D}","\u{1F451}"], "#E8B33C", "#B45309"],
  ["Golden Lions", ["\u{1F981}","\u{1F4B0}","\u{1F3EE}","\u{1FA99}","\u{1F451}","\u{1F48E}"], "#F0B429", "#92400E"],
  ["Pharaoh Vault", ["\u{1F3FA}","\u{1F441}","\u{1F408}","\u{1F5FF}","\u{1F451}","\u{1F48E}"], "#D9A441", "#7C2D12"],
  ["Ocean Treasury", ["\u{1F41A}","\u{1F420}","\u{1F980}","\u{1F988}","\u{1F30A}","\u{1F451}"], "#22D3EE", "#0E7490"],
  ["Dragon Fortune", ["\u{1F409}","\u{1F525}","\u{1F3EE}","\u{1FA99}","\u{1F9E7}","\u{1F451}"], "#EF4444", "#7F1D1D"],
  ["Crystal Kingdom", ["\u{1F48E}","\u{1F52E}","\u{2744}","\u{1F4A0}","\u{2B50}","\u{1F451}"], "#818CF8", "#3730A3"],
  ["Wild Safari", ["\u{1F981}","\u{1F418}","\u{1F992}","\u{1F993}","\u{1F40A}","\u{1F451}"], "#F59E0B", "#78350F"],
  ["Emerald Rush", ["\u{1F340}","\u{1F49A}","\u{1F48E}","\u{1FA99}","\u{1F340}","\u{1F451}"], "#12D18E", "#065F46"],
  ["Fruit Fiesta", ["\u{1F352}","\u{1F34B}","\u{1F347}","\u{1F349}","\u{1F514}","\u{0037}"], "#FB7185", "#9F1239"],
  ["Diamond Bay", ["\u{1F48E}","\u{1F4A0}","\u{1F4B0}","\u{1FA99}","\u{2B50}","\u{1F451}"], "#38BDF8", "#1E3A8A"],
  ["Sunset Jackpot", ["\u{1F305}","\u{1F334}","\u{1F379}","\u{1F4B0}","\u{2B50}","\u{1F451}"], "#FB923C", "#9A3412"],
  ["Thunder Vault", ["\u{26A1}","\u{1F329}","\u{1F4B0}","\u{1FA99}","\u{1F52E}","\u{1F451}"], "#6366F1", "#312E81"],
  ["Mystic Moon", ["\u{1F319}","\u{2B50}","\u{1F52E}","\u{1F989}","\u{1F56F}","\u{1F451}"], "#8B5CF6", "#4C1D95"],
  ["Royal Gems", ["\u{1F451}","\u{1F48E}","\u{1F48D}","\u{1FA99}","\u{1F3F5}","\u{2B50}"], "#E8B33C", "#78350F"],
  ["Pirate Chest", ["\u{1F3F4}","\u{1F4B0}","\u{1F5FA}","\u{2693}","\u{1F9ED}","\u{1F451}"], "#0EA5E9", "#0C4A6E"],
  ["Neon Nights", ["\u{1F303}","\u{1F4A1}","\u{1F3B6}","\u{1F48E}","\u{26A1}","\u{0037}"], "#EC4899", "#581C87"],
  ["Lucky Clovers", ["\u{1F340}","\u{1F308}","\u{1FA99}","\u{1F514}","\u{2B50}","\u{1F451}"], "#34D399", "#064E3B"],
  ["Aztec Sun", ["\u{1F5FF}","\u{2600}","\u{1F40D}","\u{1FA99}","\u{1F525}","\u{1F451}"], "#F59E0B", "#7C2D12"],
  ["Space Relics", ["\u{1F680}","\u{1F6F8}","\u{1FA90}","\u{2B50}","\u{1F48E}","\u{1F451}"], "#60A5FA", "#1E1B4B"],
  ["Viking Hoard", ["\u{2694}","\u{1F6E1}","\u{1FA93}","\u{1FA99}","\u{1F525}","\u{1F451}"], "#94A3B8", "#1E293B"],
  ["Blossom Fortune", ["\u{1F338}","\u{1F33A}","\u{1F33C}","\u{1F98B}","\u{1FA99}","\u{1F451}"], "#F9A8D4", "#9D174D"],
  ["Frozen Riches", ["\u{2744}","\u{1F9CA}","\u{1F427}","\u{1F48E}","\u{2B50}","\u{1F451}"], "#67E8F9", "#155E75"],
];

const ROULETTE_THEMES: [string, string, string][] = [
  ["American Roulette Gold", "#E8B33C", "#78350F"],
  ["American Roulette Noir", "#94A3B8", "#0F172A"],
  ["Double Zero Deluxe", "#EF4444", "#7F1D1D"],
  ["Roulette Royale", "#12D18E", "#064E3B"],
  ["Midnight Roulette", "#8B5CF6", "#3B0764"],
  ["Platinum Wheel", "#38BDF8", "#0C4A6E"],
];

const CRASH_THEMES: [string, string, string][] = [
  ["Sky Ascent", "#FF4757", "#7F1D1D"],
  ["Rocket Vault", "#F97316", "#7C2D12"],
  ["Jet Horizon", "#22D3EE", "#155E75"],
  ["Neon Climb", "#A855F7", "#4C1D95"],
  ["Gold Launch", "#E8B33C", "#78350F"],
  ["Turbo Rise", "#12D18E", "#064E3B"],
];

const VOL = ["Low", "Medium", "High", "Very High"];
const RTP = ["96.10", "96.40", "96.80", "97.10", "95.90"];

function build(): CasinoTitle[] {
  const out: CasinoTitle[] = [];
  const editions = ["", " Deluxe", " Megaways", " Extreme", " Jackpot", " Nights", " Turbo", " Legacy", " Prime"];
  let k = 0;
  for (let e = 0; e < editions.length; e++) {
    for (let i = 0; i < SLOT_THEMES.length; i++) {
      const t = SLOT_THEMES[i];
      const name = (t[0] + editions[e]).trim();
      out.push({
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        name, engine: "slots", category: e === 2 ? "megaways" : e === 4 ? "jackpot" : "slots",
        symbols: t[1], hue: t[2], hue2: t[3],
        tag: k % 17 === 0 ? "HOT" : k % 23 === 0 ? "NEW" : "", rtp: RTP[k % RTP.length], volatility: VOL[k % VOL.length],
      });
      k++;
    }
  }
  for (let i = 0; i < ROULETTE_THEMES.length; i++) {
    const t = ROULETTE_THEMES[i];
    out.push({ slug: t[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: t[0], engine: "roulette", category: "roulette",
      symbols: [], hue: t[1], hue2: t[2], tag: i === 0 ? "HOT" : "", rtp: "94.74", volatility: "Medium" });
  }
  for (let i = 0; i < CRASH_THEMES.length; i++) {
    const t = CRASH_THEMES[i];
    out.push({ slug: t[0].toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: t[0], engine: "crash", category: "crash",
      symbols: [], hue: t[1], hue2: t[2], tag: i === 0 ? "HOT" : "", rtp: "97.00", volatility: VOL[i % VOL.length] });
  }
  return out;
}

export const CATALOG: CasinoTitle[] = build();
export const CASINO_CATS = [
  { key: "all", label: "All Games" },
  { key: "slots", label: "Slots" },
  { key: "megaways", label: "Megaways" },
  { key: "jackpot", label: "Jackpot" },
  { key: "roulette", label: "Roulette" },
  { key: "crash", label: "Crash" },
  { key: "hot", label: "Popular" },
  { key: "new", label: "New" },
];
export const bySlug = (s: string) => CATALOG.find(c => c.slug === s) ?? null;