import { SM, OA, AF, budgetFor, throttleFactor, isArchiveSeason } from "./config";
import { budgetUsed, budgetTake, metaPatch, metaGet } from "./store";

export interface ProvResult { ok: boolean; configured: boolean; status: number; data: any; left: number; limit: number; skipped?: string }

function scrub(s: string): string {
  return String(s).replace(/api_token=[^&\s"]+/gi, "api_token=hidden").replace(/apiKey=[^&\s"]+/gi, "apiKey=hidden").slice(0, 240);
}
function num(h: Headers, names: string[]): number {
  for (const n of names) { const v = h.get(n); if (v !== null && isFinite(Number(v))) return Number(v); }
  return 0;
}

async function gate(provider: string): Promise<string | null> {
  const b = budgetFor(provider);
  const u = await budgetUsed(provider);
  const m = await metaGet(provider);
  const hdrLeft = m ? Number(m.hdr_left || 0) : 0;
  if (u.day >= b.daily) return "daily budget reached";
  if (u.hour >= b.hourly) return "hourly guard reached";
  if (b.reserve > 0 && hdrLeft > 0 && hdrLeft <= b.reserve) return "provider reserve reached";
  return null;
}

async function call(provider: string, url: string, headers: Record<string, string>, leftNames: string[], limitNames: string[]): Promise<ProvResult> {
  const blocked = await gate(provider);
  if (blocked) return { ok: false, configured: true, status: 0, data: null, left: 0, limit: 0, skipped: blocked };
  await budgetTake(provider, 1);
  try {
    const r = await fetch(url, { headers, cache: "no-store" });
    const left = num(r.headers, leftNames);
    const limit = num(r.headers, limitNames);
    await metaPatch(provider, { hdr_left: left, hdr_limit: limit, last_ok: r.ok ? Date.now() : undefined, last_err: r.ok ? "" : "HTTP " + r.status });
    if (!r.ok) return { ok: false, configured: true, status: r.status, data: null, left, limit };
    const j = await r.json();
    return { ok: true, configured: true, status: r.status, data: j, left, limit };
  } catch (e) {
    await metaPatch(provider, { last_err: scrub(e instanceof Error ? e.message : "network error") });
    return { ok: false, configured: true, status: 0, data: null, left: 0, limit: 0 };
  }
}

export async function smGet(path: string, params: Record<string, string> = {}): Promise<ProvResult> {
  const key = process.env.SPORTMONKS_API_KEY;
  if (!key) return { ok: false, configured: false, status: 0, data: null, left: 0, limit: 0 };
  const qs = new URLSearchParams(params).toString();
  const url = "https://api.sportmonks.com/v3" + path + (qs ? "?" + qs : "");
  return call(SM, url, { Authorization: key, Accept: "application/json" }, ["x-ratelimit-remaining"], ["x-ratelimit-limit"]);
}

export async function oaGet(path: string, params: Record<string, string> = {}): Promise<ProvResult> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return { ok: false, configured: false, status: 0, data: null, left: 0, limit: 0 };
  const qs = new URLSearchParams(Object.assign({}, params, { apiKey: key })).toString();
  const url = "https://api.the-odds-api.com/v4" + path + "?" + qs;
  return call(OA, url, { Accept: "application/json" }, ["x-requests-remaining"], ["x-requests-used"]);
}

export async function afGet(path: string, params: Record<string, string> = {}): Promise<ProvResult> {
  const key = process.env.FOOTBALL_ODDS_API_KEY;
  if (!key) return { ok: false, configured: false, status: 0, data: null, left: 0, limit: 0 };
  if (params.season && !isArchiveSeason(Number(params.season))) {
    return { ok: false, configured: true, status: 0, data: null, left: 0, limit: 0, skipped: "season outside free archive window" };
  }
  const qs = new URLSearchParams(params).toString();
  const url = "https://v3.football.api-sports.io" + path + (qs ? "?" + qs : "");
  return call(AF, url, { "x-apisports-key": key, Accept: "application/json" }, ["x-ratelimit-requests-remaining"], ["x-ratelimit-requests-limit"]);
}

export async function effectiveInterval(provider: string, base: number): Promise<number> {
  const b = budgetFor(provider);
  const u = await budgetUsed(provider);
  return base * throttleFactor(u.day, b.daily);
}
