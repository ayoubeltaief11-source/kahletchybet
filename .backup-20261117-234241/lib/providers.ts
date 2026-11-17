/* SERVER-ONLY provider adapters. Keys never reach the browser.
   Endpoints below are the documented public endpoints of each provider. */

export interface Pick { label: string; price: number }
export interface Market { key: string; name: string; picks: Pick[] }
export interface Fixture {
  id: string; sport: string; league: string; leagueLogo: string;
  home: string; away: string; homeLogo: string; awayLogo: string;
  kickoff: string; state: "LIVE" | "UPCOMING" | "FINISHED";
  minute: number | null; scoreHome: number | null; scoreAway: number | null;
  markets: Market[]; provider: string; updated: number;
}

const TTL = 90_000;
const cache = new Map<string, { at: number; body: any }>();

async function cached(key: string, fn: () => Promise<any>) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return { ...hit.body, cached: true };
  const body = await fn();
  cache.set(key, { at: Date.now(), body });
  return body;
}

/* ---- API-Football v3 (api-sports.io) ---- */
const AF_BASE = "https://v3.football.api-sports.io";
function afState(short: string): Fixture["state"] {
  if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(short)) return "LIVE";
  if (["FT", "AET", "PEN", "AWD", "WO"].includes(short)) return "FINISHED";
  return "UPCOMING";
}
export async function apiFootball(path: string, params: Record<string, string>) {
  const key = process.env.FOOTBALL_ODDS_API_KEY;
  if (!key) return { configured: false as const };
  const qs = new URLSearchParams(params).toString();
  const url = `${AF_BASE}${path}${qs ? "?" + qs : ""}`;
  return cached("af:" + url, async () => {
    const r = await fetch(url, { headers: { "x-apisports-key": key }, cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (j && j.errors && Object.keys(j.errors).length)) {
      return { configured: true as const, ok: false as const, status: r.status, error: JSON.stringify(j?.errors ?? j?.message ?? "provider error"), response: [] };
    }
    return { configured: true as const, ok: true as const, remaining: r.headers.get("x-ratelimit-requests-remaining"), response: j.response ?? [] };
  });
}
export function mapApiFootball(rows: any[], oddsMap: Map<number, Market[]>): Fixture[] {
  return rows.map((f) => {
    const fx = f.fixture ?? {}; const lg = f.league ?? {}; const tm = f.teams ?? {}; const gl = f.goals ?? {};
    return {
      id: "af-" + fx.id, sport: "football", league: lg.name ?? "Football", leagueLogo: lg.logo ?? "",
      home: tm.home?.name ?? "Home", away: tm.away?.name ?? "Away",
      homeLogo: tm.home?.logo ?? "", awayLogo: tm.away?.logo ?? "",
      kickoff: fx.date ?? new Date().toISOString(), state: afState(fx.status?.short ?? "NS"),
      minute: fx.status?.elapsed ?? null, scoreHome: gl.home ?? null, scoreAway: gl.away ?? null,
      markets: oddsMap.get(Number(fx.id)) ?? [], provider: "API-Football", updated: Date.now(),
    };
  });
}
export function mapApiFootballOdds(rows: any[]): Map<number, Market[]> {
  const out = new Map<number, Market[]>();
  for (const row of rows) {
    const fid = Number(row.fixture?.id);
    const book = (row.bookmakers ?? [])[0];
    if (!fid || !book) continue;
    const markets: Market[] = [];
    for (const b of book.bets ?? []) {
      const nm = String(b.name ?? "");
      const key = nm === "Match Winner" ? "1x2" : nm === "Goals Over/Under" ? "totals" : nm === "Both Teams Score" ? "btts" : nm === "Double Chance" ? "dc" : nm === "Asian Handicap" ? "ah" : nm.toLowerCase().replace(/\s+/g, "_");
      if (!["1x2", "totals", "btts", "dc", "ah"].includes(key)) continue;
      const picks: Pick[] = (b.values ?? []).slice(0, 8).map((v: any) => ({ label: String(v.value), price: Number(v.odd) })).filter((p: Pick) => isFinite(p.price) && p.price > 1);
      if (picks.length >= 2) markets.push({ key, name: nm, picks });
    }
    if (markets.length) out.set(fid, markets);
  }
  return out;
}

/* ---- The Odds API v4 ---- */
const OA_BASE = "https://api.the-odds-api.com/v4";
export const OA_SPORTS: Record<string, string> = {
  basketball: "basketball_nba", tennis: "tennis_atp_french_open", volleyball: "volleyball_cev_champions_league",
  baseball: "baseball_mlb", hockey: "icehockey_nhl", mma: "mma_mixed_martial_arts",
  esports: "esports_lol", football: "soccer_epl",
};
export async function oddsApi(sportKey: string) {
  const key = process.env.ODDS_API_KEY;
  if (!key) return { configured: false as const };
  const mapped = OA_SPORTS[sportKey];
  if (!mapped) return { configured: true as const, ok: false as const, error: "This sport is not mapped to a documented The Odds API sport key.", events: [] };
  const url = `${OA_BASE}/sports/${mapped}/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${key}`;
  return cached("oa:" + mapped, async () => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return { configured: true as const, ok: false as const, status: r.status, error: `Provider responded ${r.status}`, events: [] };
    const j = await r.json();
    return { configured: true as const, ok: true as const, remaining: r.headers.get("x-requests-remaining"), events: Array.isArray(j) ? j : [] };
  });
}
export function mapOddsApi(events: any[], sport: string): Fixture[] {
  const nowMs = Date.now();
  return events.map((e) => {
    const books = e.bookmakers ?? [];
    const markets: Market[] = [];
    for (const b of books) {
      for (const m of b.markets ?? []) {
        if (markets.some((x) => x.key === m.key)) continue;
        const picks: Pick[] = (m.outcomes ?? []).map((o: any) => ({ label: o.name + (o.point !== undefined ? " " + o.point : ""), price: Number(o.price) })).filter((p: Pick) => isFinite(p.price) && p.price > 1);
        if (picks.length >= 2) markets.push({ key: m.key, name: m.key === "h2h" ? "Match Winner" : m.key === "totals" ? "Over / Under" : m.key, picks });
      }
    }
    const start = new Date(e.commence_time).getTime();
    return {
      id: "oa-" + e.id, sport, league: e.sport_title ?? sport, leagueLogo: "",
      home: e.home_team ?? "Home", away: e.away_team ?? "Away", homeLogo: "", awayLogo: "",
      kickoff: e.commence_time, state: nowMs < start ? "UPCOMING" : nowMs < start + 8_100_000 ? "LIVE" : "FINISHED",
      minute: null, scoreHome: null, scoreAway: null,
      markets, provider: books[0]?.title ? `The Odds API Â· ${books[0].title}` : "The Odds API", updated: nowMs,
    } as Fixture;
  }).filter((f) => f.markets.length > 0);
}