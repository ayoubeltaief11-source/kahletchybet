export interface Sig { path: number; env: number; pace: number; frame: number; feature: number; layout: number; hero: number; lucky: number[]; }
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
export function sigOf(id: string): Sig {
  const h = hash(id);
  const pick = (shift: number, mod: number): number => ((h >>> shift) % mod + mod) % mod;
  const lucky: number[] = [];
  let seed = h;
  while (lucky.length < 5) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const n = seed % 37;
    if (lucky.indexOf(n) < 0) lucky.push(n);
  }
  return { path: pick(0,4), env: pick(3,4), pace: pick(6,3), frame: pick(8,4), feature: pick(11,4), layout: pick(14,3), hero: pick(17,3), lucky: lucky };
}
export const PATH_NAME = ["LINEAR","ARC","SPIRAL","STEPPED"];
export const ENV_NAME = ["DEEP SPACE","CLOUD DECK","CITY NIGHT","AURORA RIDGE"];
export const PACE_NAME = ["CRUISE","STANDARD","TURBO"];
export const FRAME_NAME = ["GOLD CARVED","NEON EDGE","DARK TIMBER","CRYSTAL BEVEL"];
export const FEATURE_NAME = ["PAYLINES","EXPANDING WILD","MULTIPLIER TRAIL","LOCK AND RESPIN"];
export const LAYOUT_NAME = ["CLASSIC","TOWER","COMPACT"];
export const PACE_SPEED = [0.15, 0.22, 0.33];
