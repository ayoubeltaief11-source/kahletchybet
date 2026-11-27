import { INFLIGHT_TTL } from "./config";

const PG = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
export const STORE_MODE = PG ? "postgres" : "memory";
let sql: any = null;
let ready: Promise<void> | null = null;

const DDL = [
  "CREATE TABLE IF NOT EXISTS sports_cache (k TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, etag TEXT NOT NULL DEFAULT '')",
  "CREATE TABLE IF NOT EXISTS sports_budget (day TEXT NOT NULL, hour TEXT NOT NULL, provider TEXT NOT NULL, used INT NOT NULL DEFAULT 0, PRIMARY KEY (day, hour, provider))",
  "CREATE TABLE IF NOT EXISTS sports_meta (provider TEXT PRIMARY KEY, hdr_limit INT NOT NULL DEFAULT 0, hdr_left INT NOT NULL DEFAULT 0, last_ok BIGINT NOT NULL DEFAULT 0, last_err TEXT NOT NULL DEFAULT '', hits BIGINT NOT NULL DEFAULT 0, misses BIGINT NOT NULL DEFAULT 0, seen_at BIGINT NOT NULL DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS sports_lock (fixture_id TEXT PRIMARY KEY, reason TEXT NOT NULL, until_ts BIGINT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS sports_inflight (k TEXT PRIMARY KEY, started BIGINT NOT NULL)"
];

async function db() {
  if (!PG) return null;
  if (!ready) {
    ready = (async () => {
      const m = await import("postgres");
      sql = m.default(PG, { ssl: "require", max: 3, idle_timeout: 20 });
      for (const d of DDL) await sql.unsafe(d);
    })();
  }
  await ready;
  return sql;
}

const memCache = new Map<string, { payload: string; fetched_at: number; expires_at: number; etag: string }>();
const memBudget = new Map<string, number>();
const memMeta = new Map<string, any>();
const memLock = new Map<string, { reason: string; until_ts: number }>();
const memFlight = new Map<string, number>();

export function dayKey(t = Date.now()) { return new Date(t).toISOString().slice(0, 10); }
export function hourKey(t = Date.now()) { return new Date(t).toISOString().slice(0, 13); }

export interface CacheRow { payload: string; fetched_at: number; expires_at: number; etag: string }

export async function cacheGet(k: string): Promise<CacheRow | null> {
  const s = await db();
  if (!s) { return memCache.get(k) || null; }
  const r = await s.unsafe("SELECT payload, fetched_at, expires_at, etag FROM sports_cache WHERE k = $1", [k]);
  if (!r.length) return null;
  return { payload: r[0].payload, fetched_at: Number(r[0].fetched_at), expires_at: Number(r[0].expires_at), etag: r[0].etag };
}

export async function cacheSet(k: string, payload: string, ttl: number, etag: string): Promise<void> {
  const t = Date.now();
  const s = await db();
  if (!s) { memCache.set(k, { payload, fetched_at: t, expires_at: t + ttl, etag }); return; }
  await s.unsafe(
    "INSERT INTO sports_cache (k, payload, fetched_at, expires_at, etag) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (k) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = EXCLUDED.fetched_at, expires_at = EXCLUDED.expires_at, etag = EXCLUDED.etag",
    [k, payload, t, t + ttl, etag]
  );
}

export async function budgetUsed(provider: string): Promise<{ day: number; hour: number }> {
  const s = await db();
  const d = dayKey(); const h = hourKey();
  if (!s) { return { day: memBudget.get(d + "|" + provider) || 0, hour: memBudget.get(h + "|" + provider) || 0 }; }
  const rd = await s.unsafe("SELECT COALESCE(SUM(used),0) AS n FROM sports_budget WHERE day = $1 AND provider = $2", [d, provider]);
  const rh = await s.unsafe("SELECT used FROM sports_budget WHERE day = $1 AND hour = $2 AND provider = $3", [d, h, provider]);
  return { day: Number(rd[0].n), hour: rh.length ? Number(rh[0].used) : 0 };
}

export async function budgetTake(provider: string, n = 1): Promise<void> {
  const s = await db();
  const d = dayKey(); const h = hourKey();
  if (!s) {
    memBudget.set(d + "|" + provider, (memBudget.get(d + "|" + provider) || 0) + n);
    memBudget.set(h + "|" + provider, (memBudget.get(h + "|" + provider) || 0) + n);
    return;
  }
  await s.unsafe(
    "INSERT INTO sports_budget (day, hour, provider, used) VALUES ($1,$2,$3,$4) ON CONFLICT (day, hour, provider) DO UPDATE SET used = sports_budget.used + EXCLUDED.used",
    [d, h, provider, n]
  );
}

export async function metaPatch(provider: string, patch: Record<string, any>): Promise<void> {
  const s = await db();
  if (!s) { memMeta.set(provider, Object.assign({}, memMeta.get(provider) || {}, patch, { seen_at: Date.now() })); return; }
  const cur = (await metaGet(provider)) || {};
  const m = Object.assign({ hdr_limit: 0, hdr_left: 0, last_ok: 0, last_err: "", hits: 0, misses: 0 }, cur, patch);
  await s.unsafe(
    "INSERT INTO sports_meta (provider, hdr_limit, hdr_left, last_ok, last_err, hits, misses, seen_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (provider) DO UPDATE SET hdr_limit = EXCLUDED.hdr_limit, hdr_left = EXCLUDED.hdr_left, last_ok = EXCLUDED.last_ok, last_err = EXCLUDED.last_err, hits = EXCLUDED.hits, misses = EXCLUDED.misses, seen_at = EXCLUDED.seen_at",
    [provider, m.hdr_limit, m.hdr_left, m.last_ok, String(m.last_err).slice(0, 300), m.hits, m.misses, Date.now()]
  );
}

export async function metaGet(provider: string): Promise<any | null> {
  const s = await db();
  if (!s) { return memMeta.get(provider) || null; }
  const r = await s.unsafe("SELECT * FROM sports_meta WHERE provider = $1", [provider]);
  return r.length ? r[0] : null;
}
export async function metaAll(): Promise<any[]> {
  const s = await db();
  if (!s) { return Array.from(memMeta.keys()).map(function (k) { return Object.assign({ provider: k }, memMeta.get(k)); }); }
  return await s.unsafe("SELECT * FROM sports_meta ORDER BY provider");
}
export async function bumpHit(provider: string, hit: boolean): Promise<void> {
  const m = (await metaGet(provider)) || { hits: 0, misses: 0 };
  await metaPatch(provider, { hits: Number(m.hits || 0) + (hit ? 1 : 0), misses: Number(m.misses || 0) + (hit ? 0 : 1) });
}

export async function lockSet(fixtureId: string, reason: string, ms: number): Promise<void> {
  const until = Date.now() + ms;
  const s = await db();
  if (!s) { memLock.set(fixtureId, { reason, until_ts: until }); return; }
  await s.unsafe(
    "INSERT INTO sports_lock (fixture_id, reason, until_ts) VALUES ($1,$2,$3) ON CONFLICT (fixture_id) DO UPDATE SET reason = EXCLUDED.reason, until_ts = GREATEST(sports_lock.until_ts, EXCLUDED.until_ts)",
    [fixtureId, reason, until]
  );
}
export async function lockActive(fixtureId: string): Promise<string | null> {
  const s = await db();
  const t = Date.now();
  if (!s) { const v = memLock.get(fixtureId); return v && v.until_ts > t ? v.reason : null; }
  const r = await s.unsafe("SELECT reason FROM sports_lock WHERE fixture_id = $1 AND until_ts > $2", [fixtureId, t]);
  return r.length ? r[0].reason : null;
}
export async function lockCount(): Promise<number> {
  const s = await db();
  const t = Date.now();
  if (!s) { return Array.from(memLock.values()).filter(function (v) { return v.until_ts > t; }).length; }
  const r = await s.unsafe("SELECT COUNT(*) AS n FROM sports_lock WHERE until_ts > $1", [t]);
  return Number(r[0].n);
}

export async function claimFlight(k: string): Promise<boolean> {
  const t = Date.now();
  const s = await db();
  if (!s) {
    const at = memFlight.get(k);
    if (at && t - at < INFLIGHT_TTL) return false;
    memFlight.set(k, t); return true;
  }
  await s.unsafe("DELETE FROM sports_inflight WHERE k = $1 AND started < $2", [k, t - INFLIGHT_TTL]);
  const r = await s.unsafe("INSERT INTO sports_inflight (k, started) VALUES ($1,$2) ON CONFLICT (k) DO NOTHING RETURNING k", [k, t]);
  return r.length > 0;
}
export async function releaseFlight(k: string): Promise<void> {
  const s = await db();
  if (!s) { memFlight.delete(k); return; }
  await s.unsafe("DELETE FROM sports_inflight WHERE k = $1", [k]);
}
export async function flightCount(): Promise<number> {
  const s = await db();
  if (!s) { return memFlight.size; }
  const r = await s.unsafe("SELECT COUNT(*) AS n FROM sports_inflight WHERE started > $1", [Date.now() - INFLIGHT_TTL]);
  return Number(r[0].n);
}
export async function cacheCount(): Promise<number> {
  const s = await db();
  if (!s) { return memCache.size; }
  const r = await s.unsafe("SELECT COUNT(*) AS n FROM sports_cache");
  return Number(r[0].n);
}
