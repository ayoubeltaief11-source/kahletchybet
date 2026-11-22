import { apiFootball, mapApiFootball, mapApiFootballOdds, oddsApi, mapOddsApi, sportmonks } from "@/lib/providers";
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
      if (base.configured && base.ok && (base.response ?? []).length > 0) {
        let oddsMap = new Map<number, any[]>();
        const ids = base.response.slice(0, 20).map((f: any) => f.fixture?.id).filter(Boolean);
        if (ids.length && scope !== "finished") {
          const o = await apiFootball("/odds", { fixture: String(ids[0]) });
          if (o.configured && o.ok) oddsMap = mapApiFootballOdds(o.response ?? []);
        }
        let fixtures = mapApiFootball(base.response, oddsMap as any);
        fixtures = fixtures.map(f => f.markets.length ? f : { ...f, markets: buildMarkets(f.id, "football", f.home, f.away), provider: f.provider + " + simulated markets" });
        return ok({ configured: true, source: "API-Football", simulated: false, remaining: base.remaining ?? null, fixtures });
      }

      const sm = await sportmonks("/livescores", { include: "participants;league;scores" });
      if (sm.configured && sm.ok && (sm.data ?? []).length > 0) {
        const fixtures = sm.data.map((f: any) => {
          const home = f.participants?.find((p: any) => p.meta?.location === "home")?.name ?? "Home";
          const away = f.participants?.find((p: any) => p.meta?.location === "away")?.name ?? "Away";
          return {
            id: "sm-" + f.id, sport: "football", league: f.league?.name ?? "Football", leagueLogo: f.league?.image_path ?? "",
            home, away, homeLogo: f.participants?.[0]?.image_path ?? "", awayLogo: f.participants?.[1]?.image_path ?? "",
            kickoff: f.starting_at ?? new Date().toISOString(), state: "LIVE" as const, minute: f.minute ?? null,
            scoreHome: f.scores?.[0]?.score?.goals ?? 0, scoreAway: f.scores?.[1]?.score?.goals ?? 0,
            markets: buildMarkets("sm-" + f.id, "football", home, away), provider: "Sportmonks", updated: Date.now()
          };
        });
        return ok({ configured: true, source: "Sportmonks", simulated: false, fixtures });
      }

      return fallback("Showing intelligent simulation engine (API keys not configured or quota reached).", true);
    }

    const r = await oddsApi(sport);
    if (r.configured && r.ok) {
      let fixtures = mapOddsApi(r.events ?? [], sport);
      if (scope === "live") fixtures = fixtures.filter(f => f.state === "LIVE");
      if (scope === "upcoming") fixtures = fixtures.filter(f => f.state === "UPCOMING");
      if (scope === "finished") fixtures = fixtures.filter(f => f.state === "FINISHED");
      if (fixtures.length > 0) {
        fixtures = fixtures.map(f => ({ ...f, markets: [...f.markets, ...buildMarkets(f.id, sport, f.home, f.away).filter(m => !f.markets.some(x => x.key === m.key))] }));
        return ok({ configured: true, source: "The Odds API", simulated: false, remaining: r.remaining ?? null, fixtures });
      }
    }
    return fallback("Showing intelligent simulation engine for " + sport + ".", true);
  } catch (e) {
    logErr("sports", e);
    return fallback("Provider network error. Seamless simulation fallback active.", true);
  }
}