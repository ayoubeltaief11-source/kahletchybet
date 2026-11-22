import { simFixtureById, simFixtures, buildMarkets } from "@/lib/sim";
import { apiFootball, mapApiFootball, mapApiFootballOdds, oddsApi, mapOddsApi } from "@/lib/providers";
import { ok, bad, logErr } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return bad("Missing fixture id");
  try {
    if (id.startsWith("sim-")) {
      const f = simFixtureById(id);
      if (!f) return bad("Fixture not found", 404);
      return ok({ fixture: f, simulated: true, source: "kahlatchybet Simulation Engine" });
    }
    if (id.startsWith("af-")) {
      const fid = id.slice(3);
      const r = await apiFootball("/fixtures", { id: fid });
      if (r.configured && r.ok && (r.response ?? []).length) {
        const o = await apiFootball("/odds", { fixture: fid });
        const om = (o.configured && o.ok) ? mapApiFootballOdds(o.response ?? []) : new Map();
        const f = mapApiFootball(r.response, om as any)[0];
        const extra = buildMarkets(f.id, "football", f.home, f.away).filter(m => !f.markets.some(x => x.key === m.key));
        return ok({ fixture: { ...f, markets: [...f.markets, ...extra] }, simulated: false, source: "API-Football" });
      }
    }
    if (id.startsWith("oa-")) {
      for (const sp of ["basketball", "tennis", "baseball", "hockey", "mma", "esports", "volleyball", "football"]) {
        const r = await oddsApi(sp);
        if (r.configured && r.ok) {
          const f = mapOddsApi(r.events ?? [], sp).find(x => x.id === id);
          if (f) {
            const extra = buildMarkets(f.id, sp, f.home, f.away).filter(m => !f.markets.some(x => x.key === m.key));
            return ok({ fixture: { ...f, markets: [...f.markets, ...extra] }, simulated: false, source: "The Odds API" });
          }
        }
      }
    }
    const anyFix = simFixtures("football", "all").find(f => f.id === id);
    if (anyFix) return ok({ fixture: anyFix, simulated: true, source: "kahlatchybet Simulation Engine" });
    return bad("Fixture not found", 404);
  } catch (e) { logErr("fixture", e); return bad("Could not load fixture", 500); }
}