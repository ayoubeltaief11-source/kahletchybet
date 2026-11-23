export type Pack = "candy" | "fruit" | "gems" | "myth" | "space" | "volcano";
export type GType = "roulette" | "cluster" | "lines" | "mega" | "hold" | "crash" | "instant";

export interface GameRec {
  id: string;
  title: string;
  type: GType;
  pack: Pack;
  assetDir: string;
  color: string;
  color2: string;
}

const R: GameRec[] = [
  { id: "emerald-roulette", title: "Emerald Roulette", type: "roulette", pack: "myth", assetDir: "emerald-roulette", color: "#0c7a4e", color2: "#ffd97a" },
  { id: "crimson-roulette", title: "Crimson Roulette", type: "roulette", pack: "myth", assetDir: "crimson-roulette", color: "#c4202f", color2: "#fff6d8" },
  { id: "royal-velvet", title: "Royal Velvet", type: "roulette", pack: "myth", assetDir: "royal-velvet", color: "#6b2fa0", color2: "#f0abfc" },
  { id: "midnight-wheel", title: "Midnight Wheel", type: "roulette", pack: "myth", assetDir: "midnight-wheel", color: "#1e3a8a", color2: "#93c5fd" },
  { id: "golden-crown", title: "Golden Crown", type: "roulette", pack: "myth", assetDir: "golden-crown", color: "#e8b33c", color2: "#fff6d8" },
  { id: "candy-cascade", title: "Candy Cascade", type: "cluster", pack: "candy", assetDir: "candy-cascade", color: "#ff6fb5", color2: "#ffd97a" },
  { id: "gemfall-kingdom", title: "Gemfall Kingdom", type: "cluster", pack: "gems", assetDir: "gemfall-kingdom", color: "#22d3ee", color2: "#9dc4ff" },
  { id: "fruit-burst-valley", title: "Fruit Burst Valley", type: "cluster", pack: "fruit", assetDir: "fruit-burst-valley", color: "#4ade80", color2: "#fde68a" },
  { id: "dragon-peaks", title: "Dragon Peaks", type: "mega", pack: "myth", assetDir: "dragon-peaks", color: "#ff6b3d", color2: "#ffd24a" },
  { id: "ocean-depths", title: "Ocean Depths", type: "mega", pack: "gems", assetDir: "ocean-depths", color: "#22d3ee", color2: "#9dc4ff" },
  { id: "cosmic-rift", title: "Cosmic Rift", type: "mega", pack: "myth", assetDir: "cosmic-rift", color: "#a855f7", color2: "#f0abfc" },
  { id: "neon-cherry-rush", title: "Neon Cherry Rush", type: "lines", pack: "fruit", assetDir: "neon-cherry-rush", color: "#ff4757", color2: "#ff8b96" },
  { id: "electric-lemon", title: "Electric Lemon", type: "lines", pack: "fruit", assetDir: "electric-lemon", color: "#facc15", color2: "#fef08a" },
  { id: "plasma-bell", title: "Plasma Bell", type: "lines", pack: "myth", assetDir: "plasma-bell", color: "#3b82f6", color2: "#93c5fd" },
  { id: "volcano-vault", title: "Volcano Vault", type: "hold", pack: "volcano", assetDir: "volcano-vault", color: "#ff6b3d", color2: "#ffd24a" },
  { id: "arctic-treasure", title: "Arctic Treasure", type: "hold", pack: "gems", assetDir: "arctic-treasure", color: "#22d3ee", color2: "#9dc4ff" },
  { id: "desert-coins", title: "Desert Coins", type: "hold", pack: "myth", assetDir: "desert-coins", color: "#e8b33c", color2: "#fff6d8" },
  { id: "mystery-pyramid", title: "Mystery Pyramid", type: "hold", pack: "myth", assetDir: "mystery-pyramid", color: "#e8b33c", color2: "#fff6d8" },
  { id: "shadow-relics", title: "Shadow Relics", type: "hold", pack: "myth", assetDir: "shadow-relics", color: "#a855f7", color2: "#f0abfc" },
  { id: "enchanted-forest", title: "Enchanted Forest", type: "hold", pack: "myth", assetDir: "enchanted-forest", color: "#12d18e", color2: "#a7f3d0" },
  { id: "skyward-jet", title: "Skyward Jet", type: "crash", pack: "volcano", assetDir: "skyward-jet", color: "#e8b33c", color2: "#fff6d8" },
  { id: "ember-rocket", title: "Ember Rocket", type: "crash", pack: "volcano", assetDir: "ember-rocket", color: "#ff6b3d", color2: "#ffd24a" },
  { id: "drift-balloon", title: "Drift Balloon", type: "crash", pack: "space", assetDir: "drift-balloon", color: "#7fb2ff", color2: "#9dc4ff" },
  { id: "rotor-heli", title: "Rotor Heli", type: "crash", pack: "volcano", assetDir: "rotor-heli", color: "#12d18e", color2: "#a7f3d0" },
  { id: "nightglide-stealth", title: "Nightglide Stealth", type: "crash", pack: "space", assetDir: "nightglide-stealth", color: "#a855f7", color2: "#f0abfc" },
  { id: "precision-dice", title: "Precision Dice", type: "instant", pack: "space", assetDir: "precision-dice", color: "#3b82f6", color2: "#93c5fd" },
  { id: "classic-mines", title: "Classic Mines", type: "instant", pack: "space", assetDir: "classic-mines", color: "#12d18e", color2: "#a7f3d0" },
  { id: "plinko-low", title: "Plinko Low Risk", type: "instant", pack: "space", assetDir: "plinko-low", color: "#12d18e", color2: "#a7f3d0" },
  { id: "hi-lo-classic", title: "Hi-Lo Classic", type: "instant", pack: "space", assetDir: "hi-lo-classic", color: "#12d18e", color2: "#a7f3d0" },
  { id: "limbo-rush", title: "Limbo Rush", type: "instant", pack: "space", assetDir: "limbo-rush", color: "#12d18e", color2: "#a7f3d0" }
];

export const REGISTRY: Record<string, GameRec> = {};
for (const g of R) REGISTRY[g.id] = g;

export function getGame(id: string): GameRec {
  const g = REGISTRY[id];
  if (!g) throw new Error("Unknown game id: " + id);
  return g;
}
export function hasGame(id: string): boolean { return !!REGISTRY[id]; }
export function allGames(): GameRec[] { return R.slice(); }
export function sym(id: string, n: number): string {
  const g = getGame(id);
  return "/assets/packs/" + g.pack + "/s" + (((n % 9) + 9) % 9 + 1) + ".png";
}
export function asset(id: string, kind: "cover" | "bg" | "logo" | "character"): string {
  const g = getGame(id);
  const ext = kind === "bg" ? ".jpg" : ".png";
  return "/assets/" + g.assetDir + "/" + kind + ext;
}
