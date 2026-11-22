import raw from "./games.json";

export interface NewGame {
  slug: string;
  name: string;
  family: "roulette" | "slots" | "crash" | "instant";
  engine?: string;
  type?: string;
  craft?: string;
  risk?: string;
  rows?: number;
  accent: string;
  accent2: string;
  felt?: string;
  sky?: string;
  rtp: number;
  vol: string;
  maxWin: string;
  badge: string;
  tag: string;
}

export const NEW_GAMES: NewGame[] = (raw as { games: NewGame[] }).games;

export function newGameBySlug(slug: string): NewGame {
  const hit = NEW_GAMES.find(function (g) { return g.slug === slug; });
  return hit || NEW_GAMES[0];
}

export function newGamesByFamily(family: string): NewGame[] {
  return NEW_GAMES.filter(function (g) { return g.family === family; });
}

export const NEW_GAMES_COUNT = NEW_GAMES.length;

export function hrefFor(g: NewGame): string {
  if (g.family === "roulette") return "/casino/roulette2/" + g.slug;
  if (g.family === "crash") return "/casino/sky/" + g.slug;
  if (g.family === "slots") {
    if (g.engine === "megaways") return "/casino/mega/" + g.slug;
    if (g.engine === "lines") return "/casino/lines/" + g.slug;
    if (g.engine === "holdwin" || g.engine === "holdwin5") return "/casino/hold/" + g.slug;
    return "/casino/cluster/" + g.slug;
  }
  if (g.family === "instant") {
    if (g.engine === "dice") return "/casino/dice/" + g.slug;
    if (g.engine === "mines") return "/casino/mines/" + g.slug;
    if (g.engine === "plinko") return "/casino/plinko/" + g.slug;
    return "/casino/instant/" + g.slug;
  }
  return "/casino/instant/" + g.slug;
}