import { apiFootball, mapApiFootball, mapApiFootballOdds, oddsApi, mapOddsApi, type Fixture } from "@/lib/providers";
import { ok, logErr } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sport = (url.searchParams.get("sport") || "football").replace(/[^a-z]/g, "");
  const scope = url.searchParams.get("scope") || "all";
  try {
    if (sport === "football") {
      const params: Record<string, string> =
        scope === "live" ? { live: "all" }
        : scope === "upcoming" ? { next: "20" }
        : scope === "finished" ? { last: "20" }
        : { date: new Date().toISOString().slice(0, 10) };
      const base = await apiFootball("/fixtures", params);
      if (!base.configured) return ok({ configured: false, source: "none", fixtures: [], message: "FOOTBALL_ODDS_API_KEY is not configured on the server." });
      if (!base.ok) return ok({ configured: true, source: "error", fixtures: [], message: base.error ?? "Provider request failed", status: base.status });
      let oddsMap = new Map<number, any[]>();
      const ids = (base.response ?? []).slice(0, 20).map((f: any) => f.fixture?.id).filter(Boolean);
      if (ids.length && scope !== "finished") {
        const o = await apiFootball("/odds", { fixture: String(ids[0]) });
        if (o.configured && o.ok) oddsMap = mapApiFootballOdds(o.response ?? []);
      }
      const fixtures: Fixture[] = mapApiFootball(base.response ?? [], oddsMap as any);
      return ok({ configured: true, source: "API-Football", remaining: base.remaining ?? null, fixtures, message: fixtures.length ? null : "The provider returned no fixtures for this filter." });
    }
    const r = await oddsApi(sport);
    if (!r.configured) return ok({ configured: false, source: "none", fixtures: [], message: "ODDS_API_KEY is not configured on the server. This sport uses The Odds API." });
    if (!r.ok) return ok({ configured: true, source: "error", fixtures: [], message: r.error ?? "Provider request failed" });
    let fixtures = mapOddsApi(r.events ?? [], sport);
    if (scope === "live") fixtures = fixtures.filter(f => f.state === "LIVE");
    if (scope === "upcoming") fixtures = fixtures.filter(f => f.state === "UPCOMING");
    if (scope === "finished") fixtures = fixtures.filter(f => f.state === "FINISHED");
    return ok({ configured: true, source: "The Odds API", remaining: r.remaining ?? null, fixtures, message: fixtures.length ? null : "The provider returned no events for this sport right now." });
  } catch (e) {
    logErr("sports", e);
    return ok({ configured: true, source: "error", fixtures: [], message: "The sports data provider could not be reached." });
  }
}