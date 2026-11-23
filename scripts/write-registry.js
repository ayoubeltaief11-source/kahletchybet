const fs = require('fs');
const rows = [
["emerald-roulette","Emerald Roulette","roulette","myth","#0c7a4e","#ffd97a"],
["crimson-roulette","Crimson Roulette","roulette","myth","#c4202f","#fff6d8"],
["royal-velvet","Royal Velvet","roulette","myth","#6b2fa0","#f0abfc"],
["midnight-wheel","Midnight Wheel","roulette","myth","#1e3a8a","#93c5fd"],
["golden-crown","Golden Crown","roulette","myth","#e8b33c","#fff6d8"],
["candy-cascade","Candy Cascade","cluster","candy","#ff6fb5","#ffd97a"],
["gemfall-kingdom","Gemfall Kingdom","cluster","gems","#22d3ee","#9dc4ff"],
["fruit-burst-valley","Fruit Burst Valley","cluster","fruit","#4ade80","#fde68a"],
["dragon-peaks","Dragon Peaks","mega","myth","#ff6b3d","#ffd24a"],
["ocean-depths","Ocean Depths","mega","gems","#22d3ee","#9dc4ff"],
["cosmic-rift","Cosmic Rift","mega","myth","#a855f7","#f0abfc"],
["neon-cherry-rush","Neon Cherry Rush","lines","fruit","#ff4757","#ff8b96"],
["electric-lemon","Electric Lemon","lines","fruit","#facc15","#fef08a"],
["plasma-bell","Plasma Bell","lines","myth","#3b82f6","#93c5fd"],
["volcano-vault","Volcano Vault","hold","volcano","#ff6b3d","#ffd24a"],
["arctic-treasure","Arctic Treasure","hold","gems","#22d3ee","#9dc4ff"],
["desert-coins","Desert Coins","hold","myth","#e8b33c","#fff6d8"],
["mystery-pyramid","Mystery Pyramid","hold","myth","#e8b33c","#fff6d8"],
["shadow-relics","Shadow Relics","hold","myth","#a855f7","#f0abfc"],
["enchanted-forest","Enchanted Forest","hold","gems","#12d18e","#a7f3d0"],
["skyward-jet","Skyward Jet","crash","volcano","#e8b33c","#fff6d8"],
["ember-rocket","Ember Rocket","crash","volcano","#ff6b3d","#ffd24a"],
["drift-balloon","Drift Balloon","crash","space","#7fb2ff","#9dc4ff"],
["rotor-heli","Rotor Heli","crash","volcano","#12d18e","#a7f3d0"],
["nightglide-stealth","Nightglide Stealth","crash","space","#a855f7","#f0abfc"],
["precision-dice","Precision Dice","instant","space","#3b82f6","#93c5fd"],
["classic-mines","Classic Mines","instant","space","#12d18e","#a7f3d0"],
["plinko-low","Plinko Low Risk","instant","space","#12d18e","#a7f3d0"],
["hi-lo-classic","Hi-Lo Classic","instant","space","#12d18e","#a7f3d0"],
["limbo-rush","Limbo Rush","instant","space","#12d18e","#a7f3d0"]
];
const L = [];
L.push('export type Pack = "candy" | "fruit" | "gems" | "myth" | "space" | "volcano";');
L.push('export type GType = "roulette" | "cluster" | "lines" | "mega" | "hold" | "crash" | "instant";');
L.push('export interface GameRec { id: string; title: string; type: GType; pack: Pack; assetDir: string; color: string; color2: string; }');
L.push('const R: GameRec[] = [');
for (const r of rows) L.push('  { id: "' + r[0] + '", title: "' + r[1] + '", type: "' + r[2] + '", pack: "' + r[3] + '", assetDir: "' + r[0] + '", color: "' + r[4] + '", color2: "' + r[5] + '" },');
L.push('];');
L.push('export const REGISTRY: Record<string, GameRec> = {};');
L.push('for (const g of R) REGISTRY[g.id] = g;');
L.push('export function getGame(id: string): GameRec {');
L.push('  const g = REGISTRY[id];');
L.push('  if (!g) throw new Error("Unknown game id: " + id);');
L.push('  return g;');
L.push('}');
L.push('export function hasGame(id: string): boolean { return !!REGISTRY[id]; }');
L.push('export function allGames(): GameRec[] { return R.slice(); }');
L.push('export function sym(id: string, n: number): string {');
L.push('  const g = getGame(id);');
L.push('  const i = (((n % 9) + 9) % 9) + 1;');
L.push('  return "/assets/packs/" + g.pack + "/s" + i + ".png";');
L.push('}');
L.push('export function asset(id: string, kind: "cover" | "bg" | "logo" | "character"): string {');
L.push('  const g = getGame(id);');
L.push('  const ext = kind === "bg" ? ".jpg" : ".png";');
L.push('  return "/assets/" + g.assetDir + "/" + kind + ext;');
L.push('}');
fs.writeFileSync('src/kb3/registry.ts', L.join('\n') + '\n', 'utf8');
const t = fs.readFileSync('src/kb3/registry.ts', 'utf8');
console.log('entries=' + (t.match(/id: "/g) || []).length);
console.log('has getGame=' + t.includes('export function getGame'));
console.log('braces balanced=' + ((t.match(/\{/g)||[]).length === (t.match(/\}/g)||[]).length));
