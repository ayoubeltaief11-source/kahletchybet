export const GAME_PACK_MAP: Record<string, string> = {
  'candy-cascade': 'candy',
  'gemfall-kingdom': 'gems',
  'fruit-burst-valley': 'fruit',
  'dragon-peaks': 'myth',
  'ocean-depths': 'gems',
  'cosmic-rift': 'myth',
  'neon-cherry-rush': 'fruit',
  'electric-lemon': 'fruit',
  'plasma-bell': 'myth',
  'volcano-vault': 'volcano',
  'arctic-treasure': 'myth',
  'desert-coins': 'myth',
  'mystery-pyramid': 'myth',
  'shadow-relics': 'myth',
  'enchanted-forest': 'myth',
  'skyward-jet': 'volcano',
  'ember-rocket': 'volcano',
  'drift-balloon': 'space',
  'rotor-heli': 'volcano',
  'nightglide-stealth': 'space',
  'precision-dice': 'space',
  'classic-mines': 'space',
  'plinko-low': 'space',
  'hi-lo-classic': 'space',
  'limbo-rush': 'space',
  'emerald-roulette': 'myth',
  'crimson-roulette': 'myth',
  'royal-velvet': 'myth',
  'midnight-wheel': 'myth',
  'golden-crown': 'myth',
};

export function getPackForGame(slug: string): string {
  return GAME_PACK_MAP[slug] || 'myth';
}

export function getSymbolPath(slug: string, index: number): string {
  const pack = getPackForGame(slug);
  return `/assets/packs/${pack}/s${index + 1}.png`;
}
