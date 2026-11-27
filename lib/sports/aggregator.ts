import { SM, OA, AF, intervalFor, STALE_MS, LOCK_MS, ODDS_JUMP_PCT, STABLE_LEAGUES, TRIAL_LEAGUES, SPORT_CATEGORIES } from "./config";
import { cacheGet, cacheSet, claimFlight, releaseFlight, bumpHit, lockSet, lockActive } from "./store";
import { smGet, oaGet, afGet, effectiveInterval } from "./providers";
import { createHash } from "node:crypto";

export type SState = "UPCOMING" | "LIVE" | "HT" | "FINISHED" | "POSTPONED" | "CANCELLED";
export interface SPick { label: string; price: number }
export interface SMarket { key: string; name: string; picks: SPick[] }
export interface SFx {
  id: string; sport: string; league: string; leagueId: number; leagueLogo: string;
  home: string; away: string; homeLogo: string; awayLogo: string;
  kickoff: string; state: SState; minute: number | null;
  scoreHome: number | null; scoreAway: number | null;
  markets: SMarket[]; provider: string; fetchedAt: number; stale: boolean; locked: string | null;
  rawStateId: number | null; trialRisk: boolean;
}
export interface Bundle { fixtures: SFx[]; source: string; lastUpdated: number; stale: boolean; available: boolean; note: string }

const FINISHED_IDS = [5, 7, 8];
const HT_IDS = [3];
const LIVE_IDS = [2, 4, 6, 9, 22];
const POSTPONED_IDS = [10, 12];
const CANCELLED_IDS = [11, 13, 14];

function stateFromId(id: number | null, fromInplay: boolean): SState {
  const n = Number(id);
  if (FINISHED_IDS.indexOf(n) >= 0) return "FINISHED";
  if (HT_IDS.indexOf(n) >= 0) return "HT";
  if (POSTPONED_IDS.indexOf(n) >= 0) return "POSTPONED";
  if (CANCELLED_IDS.indexOf(n) >= 0) return "CANCELLED";
  if (LIVE_IDS.indexOf(n) >= 0) return "LIVE";
  return fromInplay ? "LIVE" : "UPCOMING";
}
function norm(s: string): string { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function mergeKey(f: SFx): string { return norm(f.league) + "|" + String(f.kickoff).slice(0, 10) + "|" + norm(f.home) + "|" + norm(f.away); }
function etagOf(s: string): string { return createHash("sha1").update(s).digest("hex").slice(0, 16); }

async function shared(key: string, provider: string, baseTtl: number, loader: () => Promise<any>): Promise<{ data: any; fetchedAt: number; stale: boolean; available: boolean }> {
  const ttl = await effectiveInterval(provider, baseTtl);
  const hit = await cacheGet(key);
  const now = Date.now();
  if (hit && now < hit.expires_at) { await bumpHit(provider, true); return { data: JSON.parse(hit.payload), fetchedAt: hit.fetched_at, stale: false, available: true }; }
  await bumpHit(provider, false);
  const owns = await claimFlight(key);
  if (!owns) {
    if (hit) return { data: JSON.parse(hit.payload), fetchedAt: hit.fetched_at, stale: true, available: true };
    return { data: null, fetchedAt: 0, stale: true, available: false };
  }
  try {
    const data = await loader();
    if (data !== null && data !== undefined) {
      const payload = JSON.stringify(data);
      await cacheSet(key, payload, ttl, etagOf(payload));
      return { data, fetchedAt: Date.now(), stale: false, available: true };
    }
  } finally { await releaseFlight(key); }
  if (hit) return { data: JSON.parse(hit.payload), fetchedAt: hit.fetched_at, stale: true, available: true };
  return { data: null, fetchedAt: 0, stale: true, available: false };
}

export async function getLeagues(): Promise<{ id: number; name: string; logo: string; trialRisk: boolean }[]> {
  const r = await shared("sm:leagues", SM, intervalFor("leagues"), async function () {
    const res = await smGet("/my/leagues");
    if (!res.ok || !res.data || !Array.isArray(res.data.data)) return null;
    return res.data.data.map(function (l: any) { return { id: Number(l.id), name: String(l.name || ""), logo: String(l.image_path || ""), trialRisk: TRIAL_LEAGUES.indexOf(Number(l.id)) >= 0 }; });
  });
  if (r.available && Array.isArray(r.data)) return r.data;
  return STABLE_LEAGUES.map(function (id) { return { id: id, name: "League " + id, logo: "", trialRisk: false }; });
}

function mapSm(rows: any[], fromInplay: boolean): SFx[] {
  const out: SFx[] = [];
  for (const f of rows || []) {
    const ps = f.participants || [];
    const h = ps.find(function (p: any) { return p.meta && p.meta.location === "home"; }) || ps[0] || {};
    const a = ps.find(function (p: any) { return p.meta && p.meta.location === "away"; }) || ps[1] || {};
    let sh: number | null = null; let sa: number | null = null; let minute: number | null = null;
    for (const s of f.scores || []) {
      const g = s.score && typeof s.score.goals === "number" ? s.score.goals : null;
      const side = s.score && s.score.participant ? s.score.participant : null;
      const desc = String(s.description || "").toUpperCase();
      if (g !== null && (desc.indexOf("CURRENT") >= 0 || desc.indexOf("2ND") >= 0 || desc.indexOf("1ST") >= 0)) {
        if (side === "home") sh = g; else if (side === "away") sa = g;
      }
    }
    for (const e of f.events || []) { if (typeof e.minute === "number" && (minute === null || e.minute > minute)) minute = e.minute; }
    const lid = Number(f.league_id || (f.league && f.league.id) || 0);
    out.push({
      id: "sm-" + f.id, sport: "football", league: String((f.league && f.league.name) || "Football"), leagueId: lid,
      leagueLogo: String((f.league && f.league.image_path) || ""),
      home: String(h.name || ""), away: String(a.name || ""), homeLogo: String(h.image_path || ""), awayLogo: String(a.image_path || ""),
      kickoff: String(f.starting_at || ""), state: stateFromId(f.state_id ?? null, fromInplay), minute: minute,
      scoreHome: sh, scoreAway: sa, markets: [], provider: "Sportmonks", fetchedAt: Date.now(), stale: false, locked: null,
      rawStateId: f.state_id ?? null, trialRisk: TRIAL_LEAGUES.indexOf(lid) >= 0
    });
  }
  return out.filter(function (f) { return f.home && f.away; });
}

export async function getLive(): Promise<Bundle> {
  const r = await shared("sm:live", SM, intervalFor("live"), async function () {
    const res = await smGet("/football/livescores/inplay", { include: "participants;league;scores;events" });
    if (!res.ok || !res.data || !Array.isArray(res.data.data)) return null;
    return mapSm(res.data.data, true);
  });
  return bundle(r, "Sportmonks");
}

export async function getByDate(date: string): Promise<Bundle> {
  const r = await shared("sm:date:" + date, SM, intervalFor("today"), async function () {
    const res = await smGet("/football/fixtures/date/" + date, { include: "participants;league;scores" });
    if (!res.ok || !res.data || !Array.isArray(res.data.data)) return null;
    return mapSm(res.data.data, false);
  });
  return bundle(r, "Sportmonks");
}

export async function getActiveOddsSports(): Promise<{ key: string; title: string; group: string }[]> {
  const r = await shared("oa:sports", OA, intervalFor("sports"), async function () {
    const res = await oaGet("/sports", {});
    if (!res.ok || !Array.isArray(res.data)) return null;
    return res.data.filter(function (s: any) { return s.active; }).map(function (s: any) { return { key: String(s.key), title: String(s.title || s.key), group: String(s.group || "") }; });
  });
  return r.available && Array.isArray(r.data) ? r.data : [];
}

export async function getPreMatch(category: string): Promise<Bundle> {
  const cat = SPORT_CATEGORIES.find(function (c) { return c.key === category; });
  if (!cat) return { fixtures: [], source: "none", lastUpdated: 0, stale: false, available: false, note: "unknown category" };
  const list = await getActiveOddsSports();
  const pick = list.find(function (s) { return cat.prefix.some(function (p) { return s.key.indexOf(p) === 0; }); });
  if (!pick) return { fixtures: [], source: "The Odds API", lastUpdated: 0, stale: false, available: true, note: "no active competition" };
  const r = await shared("oa:odds:" + pick.key, OA, intervalFor("odds"), async function () {
    const res = await oaGet("/sports/" + pick.key + "/odds", { regions: "eu", markets: "h2h,totals", oddsFormat: "decimal" });
    if (!res.ok || !Array.isArray(res.data)) return null;
    const now = Date.now();
    const out: SFx[] = [];
    for (const e of res.data) {
      const start = new Date(e.commence_time).getTime();
      if (!isFinite(start) || start <= now) continue;
      const mk: SMarket[] = [];
      for (const b of e.bookmakers || []) {
        for (const m of b.markets || []) {
          if (mk.some(function (x) { return x.key === m.key; })) continue;
          const picks: SPick[] = (m.outcomes || []).map(function (o: any) { return { label: String(o.name) + (o.point !== undefined ? " " + o.point : ""), price: Number(o.price) }; }).filter(function (p: SPick) { return isFinite(p.price) && p.price > 1; });
          if (picks.length >= 2) mk.push({ key: String(m.key), name: m.key === "h2h" ? "Match Winner" : m.key === "totals" ? "Over / Under" : String(m.key), picks: picks });
        }
      }
      if (!mk.length) continue;
      out.push({ id: "oa-" + e.id, sport: category, league: String(e.sport_title || pick.title), leagueId: 0, leagueLogo: "",
        home: String(e.home_team || ""), away: String(e.away_team || ""), homeLogo: "", awayLogo: "",
        kickoff: String(e.commence_time), state: "UPCOMING", minute: null, scoreHome: null, scoreAway: null,
        markets: mk, provider: "The Odds API", fetchedAt: Date.now(), stale: false, locked: null, rawStateId: null, trialRisk: false });
    }
    return out;
  });
  return bundle(r, "The Odds API");
}

function bundle(r: { data: any; fetchedAt: number; stale: boolean; available: boolean }, source: string): Bundle {
  const fx: SFx[] = r.available && Array.isArray(r.data) ? r.data : [];
  for (const f of fx) { f.fetchedAt = r.fetchedAt; f.stale = r.stale || (Date.now() - r.fetchedAt > STALE_MS && (f.state === "LIVE" || f.state === "HT")); }
  return { fixtures: fx, source: source, lastUpdated: r.fetchedAt, stale: r.stale, available: r.available && fx.length > 0, note: r.available ? "" : "Data temporarily unavailable" };
}

export function mergeBundles(primary: Bundle, secondary: Bundle): Bundle {
  const seen = new Map<string, SFx>();
  for (const f of primary.fixtures) seen.set(mergeKey(f), f);
  for (const f of secondary.fixtures) { const k = mergeKey(f); if (!seen.has(k)) seen.set(k, f); }
  return { fixtures: Array.from(seen.values()), source: primary.available ? primary.source : secondary.source,
    lastUpdated: Math.max(primary.lastUpdated, secondary.lastUpdated), stale: primary.stale && secondary.stale,
    available: primary.available || secondary.available, note: primary.available || secondary.available ? "" : "Data temporarily unavailable" };
}

export async function applyGuard(prev: SFx | null, next: SFx): Promise<SFx> {
  let reason: string | null = null;
  if (next.state === "FINISHED" || next.state === "POSTPONED" || next.state === "CANCELLED") reason = "closed";
  if (next.stale) reason = "stale";
  if (prev) {
    if (prev.scoreHome !== next.scoreHome || prev.scoreAway !== next.scoreAway) await lockSet(next.id, "goal", LOCK_MS.goal);
    if (prev.state !== next.state) await lockSet(next.id, "state", LOCK_MS.state);
    const pm = prev.markets[0]; const nm = next.markets[0];
    if (pm && nm) {
      const a = pm.picks[0]; const b = nm.picks.find(function (p) { return p.label === (a && a.label); });
      if (a && b && a.price > 0 && Math.abs(b.price - a.price) / a.price >= ODDS_JUMP_PCT) await lockSet(next.id, "odds jump", LOCK_MS.oddsJump);
    }
  }
  const active = await lockActive(next.id);
  next.locked = reason || active;
  return next;
}

export { AF };
