import { needAdmin, ok } from "@/lib/guard";
import { PROVIDER_TIER, BUDGETS, INTERVALS, SM, OA, AF, STABLE_LEAGUES, TRIAL_LEAGUES } from "@/lib/sports/config";
import { STORE_MODE, budgetUsed, metaAll, cacheCount, flightCount, lockCount } from "@/lib/sports/store";
import { getLeagues } from "@/lib/sports/aggregator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  const metas = await metaAll();
  const providers = [];
  for (const p of [SM, OA, AF]) {
    const u = await budgetUsed(p);
    const m = metas.find(function (x: any) { return x.provider === p; }) || {};
    const hits = Number(m.hits || 0); const misses = Number(m.misses || 0);
    providers.push({
      provider: p,
      configured: p === SM ? !!process.env.SPORTMONKS_API_KEY : p === OA ? !!process.env.ODDS_API_KEY : !!process.env.FOOTBALL_ODDS_API_KEY,
      budget: BUDGETS[PROVIDER_TIER][p], usedToday: u.day, usedHour: u.hour,
      headerLimit: Number(m.hdr_limit || 0), headerRemaining: Number(m.hdr_left || 0),
      lastOk: Number(m.last_ok || 0), lastError: String(m.last_err || ""),
      cacheHitRate: hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0
    });
  }
  const leagues = await getLeagues();
  return ok({
    tier: PROVIDER_TIER, store: STORE_MODE, intervals: INTERVALS[PROVIDER_TIER],
    providers: providers, cacheKeys: await cacheCount(), inflight: await flightCount(), activeLocks: await lockCount(),
    leagues: leagues, stableLeagues: STABLE_LEAGUES, trialLeagues: TRIAL_LEAGUES
  });
}
