export type Tier = "free" | "pro";
export const PROVIDER_TIER: Tier = process.env.PROVIDER_TIER === "pro" ? "pro" : "free";
export const SM = "sportmonks";
export const OA = "oddsapi";
export const AF = "apifootball";
export const BRAND = "kahlatchybet";
export const CURRENCY = "TD";

export interface Budget { daily: number; hourly: number; reserve: number }
export const BUDGETS: Record<Tier, Record<string, Budget>> = {
  free: {
    sportmonks: { daily: 900, hourly: 150, reserve: 0 },
    oddsapi: { daily: 12, hourly: 4, reserve: 60 },
    apifootball: { daily: 20, hourly: 8, reserve: 20 }
  },
  pro: {
    sportmonks: { daily: 20000, hourly: 1800, reserve: 0 },
    oddsapi: { daily: 600, hourly: 60, reserve: 200 },
    apifootball: { daily: 6000, hourly: 300, reserve: 500 }
  }
};

export const INTERVALS: Record<Tier, Record<string, number>> = {
  free: { live: 60000, today: 14400000, upcoming: 43200000, standings: 43200000, finished: 86400000, odds: 3600000, leagues: 43200000, sports: 86400000 },
  pro: { live: 20000, today: 600000, upcoming: 3600000, standings: 21600000, finished: 86400000, odds: 600000, leagues: 43200000, sports: 86400000 }
};

export const STALE_MS = 60000;
export const LOCK_MS = { goal: 12000, red: 12000, penalty: 12000, state: 15000, oddsJump: 10000 };
export const ODDS_JUMP_PCT = 0.15;
export const INFLIGHT_TTL = 30000;

export const ARCHIVE_SEASONS = [2022, 2023, 2024];
export const STABLE_LEAGUES = [271, 501, 513, 1659];
export const TRIAL_LEAGUES = [8, 82];
export const CRICKET_LEAGUES = [2153, 2155, 2160];

export const SPORT_CATEGORIES: { key: string; label: string; prefix: string[] }[] = [
  { key: "football", label: "Football", prefix: ["soccer_"] },
  { key: "basketball", label: "Basketball", prefix: ["basketball_"] },
  { key: "tennis", label: "Tennis", prefix: ["tennis_"] },
  { key: "hockey", label: "Ice Hockey", prefix: ["icehockey_"] },
  { key: "baseball", label: "Baseball", prefix: ["baseball_"] },
  { key: "mma", label: "MMA", prefix: ["mma_"] },
  { key: "volleyball", label: "Volleyball", prefix: ["volleyball_"] },
  { key: "cricket", label: "Cricket", prefix: ["cricket_"] }
];

export function budgetFor(provider: string): Budget {
  return BUDGETS[PROVIDER_TIER][provider] || { daily: 0, hourly: 0, reserve: 0 };
}
export function intervalFor(kind: string): number {
  return INTERVALS[PROVIDER_TIER][kind] || 3600000;
}
export function throttleFactor(used: number, limit: number): number {
  if (limit <= 0) return 8;
  const r = used / limit;
  if (r >= 0.95) return 8;
  if (r >= 0.85) return 4;
  if (r >= 0.70) return 2;
  return 1;
}
export function isArchiveSeason(y: number): boolean {
  return ARCHIVE_SEASONS.indexOf(Number(y)) >= 0;
}
