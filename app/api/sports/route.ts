import { apiFootball, mapApiFootball, mapApiFootballOdds, oddsApi, mapOddsApi } from "@/lib/providers";
import { simFixtures, buildMarkets } from "@/lib/sim";
import { ok, logErr } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sport = (u.searchParams.get("sport") || "football").replace(/[^a-z]/g, "");
  const scope = u.searchParams.get("scope") || "all";
  const fallback = (reason: string, configured: boolean) =>
    ok({ configured, source: "simulated", simulated: true, fixtures: simFixtures(sport, scope),
      message: reason, notice: "Simulated entertainment data - clearly labelled, not real bookmaker prices." });

  try {
    if (sport === "football") {
      const params: Record<string, string> =
        scope === "live" ? { live: "all" } : scope === "upcoming" ? { next: "20" }
        : scope === "finished" ? { last: "20" } : { date: new Date().toISOString().slice(0, 10) };
      const base = await apiFootball("/fixtures", params);
      if (!base.configured) return fallback("No provider key configured. Showing the simulation engine.", false);
      if (!base.ok) return fallback("Provider unavailable or quota reached. Showing the simulation engine.", true);
      let oddsMap = new Map<number, any[]>();
      const ids = (base.response ?? []).slice(0, 20).map((f: any) => f.fixture?.id).filter(Boolean);
      if (ids.length && scope !== "finished") {
        const o = await apiFootball("/odds", { fixture: String(ids[0]) });
        if (o.configured && o.ok) oddsMap = mapApiFootballOdds(o.response ?? []);
      }
      let fixtures = mapApiFootball(base.response ?? [], oddsMap as any);
      if (!fixtures.length) return fallback("The provider returned no fixtures for this filter.", true);
      fixtures = fixtures.map(f => f.markets.length ? f : { ...f, markets: buildMarkets(f.id, "football", f.home, f.away), provider: f.provider + " + simulated markets" });
      return ok({ configured: true, source: "API-Football", simulated: false, remaining: base.remaining ?? null, fixtures });
    }
    const r = await oddsApi(sport);
    if (!r.configured) return fallback("No provider key configured for this sport. Showing the simulation engine.", false);
    if (!r.ok) return fallback("Provider unavailable or quota reached. Showing the simulation engine.", true);
    let fixtures = mapOddsApi(r.events ?? [], sport);
    if (scope === "live") fixtures = fixtures.filter(f => f.state === "LIVE");
    if (scope === "upcoming") fixtures = fixtures.filter(f => f.state === "UPCOMING");
    if (scope === "finished") fixtures = fixtures.filter(f => f.state === "FINISHED");
    if (!fixtures.length) return fallback("The provider returned no events for this filter.", true);
    fixtures = fixtures.map(f => ({ ...f, markets: [...f.markets, ...buildMarkets(f.id, sport, f.home, f.away).filter(m => !f.markets.some(x => x.key === m.key))] }));
    return ok({ configured: true, source: "The Odds API", simulated: false, remaining: r.remaining ?? null, fixtures });
  } catch (e) {
    logErr("sports", e);
    return fallback("The provider could not be reached. Showing the simulation engine.", true);
  }
}