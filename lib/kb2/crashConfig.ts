import raw from "./crash-games.json";

export interface CrashConfig {
  slug: string;
  name: string;
  craft: string;
  accent: string;
  hue: number;
  skin: string;
  sky: string;
  badge: string;
  maxWin: string;
  vol: string;
  tag: string;
}

function toHue(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  return isFinite(n) ? n : 0xe8b33c;
}

export const CRASH_GAMES: CrashConfig[] = (raw as Omit<CrashConfig, "hue">[]).map(function (g) {
  return Object.assign({}, g, { hue: toHue(g.accent) });
});

export function crashBySlug(slug: string): CrashConfig {
  const hit = CRASH_GAMES.find(function (g) { return g.slug === slug; });
  return hit || CRASH_GAMES[0];
}

export const CRASH_COUNT = CRASH_GAMES.length;
