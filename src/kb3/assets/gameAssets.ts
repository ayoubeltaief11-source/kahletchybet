export type PackName = "candy" | "gems" | "fruit" | "myth" | "space" | "volcano";

export interface GameAssetEntry {
  id: string;
  family: "slots" | "crash" | "roulette" | "instant";
  engine: string;
  pack: PackName;
  accent: string;
  accent2: string;
  symbols: string[];
  cover: string;
  bg: string;
  logo: string;
  character: string;
}

const RAW: [string, GameAssetEntry["family"], string, PackName, string, string][] = [
  ["candy-cascade", "slots", "cluster", "candy", "#ff6fb5", "#ffd97a"],
  ["gemfall-kingdom", "slots", "cluster", "gems", "#22d3ee", "#9dc4ff"],
  ["fruit-burst-valley", "slots", "cluster", "fruit", "#4ade80", "#fde68a"],
  ["dragon-peaks", "slots", "megaways", "myth", "#ff6b3d", "#ffd24a"],
  ["ocean-depths", "slots", "megaways", "gems", "#22d3ee", "#9dc4ff"],
  ["cosmic-rift", "slots", "megaways", "myth", "#a855f7", "#f0abfc"],
  ["neon-cherry-rush", "slots", "lines", "fruit", "#ff4757", "#ff8b96"],
  ["electric-lemon", "slots", "lines", "fruit", "#facc15", "#fef08a"],
  ["plasma-bell", "slots", "lines", "myth", "#3b82f6", "#93c5fd"],
  ["volcano-vault", "slots", "hold", "volcano", "#ff6b3d", "#ffd24a"],
  ["arctic-treasure", "slots", "hold", "myth", "#22d3ee", "#9dc4ff"],
  ["desert-coins", "slots", "hold", "myth", "#e8b33c", "#fff6d8"],
  ["mystery-pyramid", "slots", "hold", "myth", "#e8b33c", "#fff6d8"],
  ["shadow-relics", "slots", "hold", "myth", "#a855f7", "#f0abfc"],
  ["enchanted-forest", "slots", "hold", "myth", "#12d18e", "#a7f3d0"],
  ["skyward-jet", "crash", "crash", "volcano", "#e8b33c", "#fff6d8"],
  ["ember-rocket", "crash", "crash", "volcano", "#ff6b3d", "#ffd24a"],
  ["drift-balloon", "crash", "crash", "space", "#7fb2ff", "#9dc4ff"],
  ["rotor-heli", "crash", "crash", "volcano", "#12d18e", "#a7f3d0"],
  ["nightglide-stealth", "crash", "crash", "space", "#a855f7", "#f0abfc"],
  ["emerald-roulette", "roulette", "roulette", "myth", "#0c7a4e", "#ffd97a"],
  ["crimson-roulette", "roulette", "roulette", "myth", "#c4202f", "#fff6d8"],
  ["royal-velvet", "roulette", "roulette", "myth", "#6b2fa0", "#f0abfc"],
  ["midnight-wheel", "roulette", "roulette", "myth", "#1e3a8a", "#93c5fd"],
  ["golden-crown", "roulette", "roulette", "myth", "#e8b33c", "#fff6d8"],
  ["precision-dice", "instant", "dice", "space", "#3b82f6", "#93c5fd"],
  ["classic-mines", "instant", "mines", "space", "#12d18e", "#a7f3d0"],
  ["plinko-low", "instant", "plinko", "space", "#12d18e", "#a7f3d0"],
  ["hi-lo-classic", "instant", "hilo", "space", "#12d18e", "#a7f3d0"],
  ["limbo-rush", "instant", "limbo", "space", "#12d18e", "#a7f3d0"]
];

function symbolsFor(pack: PackName): string[] {
  const out: string[] = [];
  for (let i = 1; i <= 9; i++) out.push("/assets/packs/" + pack + "/s" + i + ".png");
  return out;
}

export const GAME_ASSETS: Record<string, GameAssetEntry> = {};
for (const r of RAW) {
  const id = r[0];
  GAME_ASSETS[id] = {
    id: id, family: r[1], engine: r[2], pack: r[3], accent: r[4], accent2: r[5],
    symbols: symbolsFor(r[3]),
    cover: "/assets/" + id + "/cover.png",
    bg: "/assets/" + id + "/bg.jpg",
    logo: "/assets/" + id + "/logo.png",
    character: "/assets/" + id + "/character.png"
  };
}

const FALLBACK: GameAssetEntry = {
  id: "fallback", family: "slots", engine: "cluster", pack: "myth",
  accent: "#e8b33c", accent2: "#fff6d8", symbols: symbolsFor("myth"),
  cover: "", bg: "", logo: "", character: ""
};

export function ga(id: string): GameAssetEntry { return GAME_ASSETS[id] || FALLBACK; }
export function symbolUrl(id: string, n: number): string { return ga(id).symbols[((n % 9) + 9) % 9]; }
export function coverUrl(id: string): string { return ga(id).cover; }
export function bgUrl(id: string): string { return ga(id).bg; }
export function logoUrl(id: string): string { return ga(id).logo; }
export function characterUrl(id: string): string { return ga(id).character; }
export function isKnownGame(id: string): boolean { return !!GAME_ASSETS[id]; }
