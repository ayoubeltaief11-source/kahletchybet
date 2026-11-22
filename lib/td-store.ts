import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Cap { user_id: string; weekly_cap: number; updated: number; }
export interface Round { id: string; user_id: string; slug: string; engine: string; stake: number; payout: number; mult: number; ts: number; capped: boolean; }
export interface Audit { id: string; actor: string; action: string; target: string; detail: string; ts: number; }

interface Shape { caps: Cap[]; rounds: Round[]; audit: Audit[]; settings: Record<string, string>; }
const EMPTY: Shape = { caps: [], rounds: [], audit: [], settings: {} };

const PG = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
export const TD_MODE = PG ? "postgres" : "file";
let sql: any = null; let ready: Promise<void> | null = null;

const DDL = [
  `CREATE TABLE IF NOT EXISTS td_caps (user_id TEXT PRIMARY KEY, weekly_cap NUMERIC NOT NULL, updated BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS td_rounds (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, slug TEXT NOT NULL, engine TEXT NOT NULL, stake NUMERIC NOT NULL, payout NUMERIC NOT NULL, mult NUMERIC NOT NULL, ts BIGINT NOT NULL, capped BOOLEAN NOT NULL DEFAULT FALSE)`,
  `CREATE TABLE IF NOT EXISTS td_audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, detail TEXT NOT NULL, ts BIGINT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS td_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_td_rounds_user ON td_rounds(user_id)`,
];

async function pg() {
  if (!ready) {
    ready = (async () => {
      const m = await import("postgres");
      sql = m.default(PG, { ssl: "require", max: 4, idle_timeout: 20 });
      for (const d of DDL) await sql.unsafe(d);
    })();
  }
  await ready; return sql;
}

const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "td-store.json");
let mem: Shape | null = null;
let chain: Promise<any> = Promise.resolve();

function load(): Shape {
  if (mem) return mem;
  try { if (existsSync(FILE)) { mem = { ...EMPTY, ...JSON.parse(readFileSync(FILE, "utf8")) }; return mem!; } } catch {}
  mem = JSON.parse(JSON.stringify(EMPTY)); return mem!;
}
function save() { try { if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true }); writeFileSync(FILE, JSON.stringify(mem)); } catch {} }
function serial<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = chain.then(fn, fn); chain = run.then(() => {}, () => {}); return run;
}

export const rid = () => randomBytes(10).toString("hex");
const now = () => Date.now();
export const WEEK = 7 * 24 * 60 * 60 * 1000;

export const td = {
  async defaultCap(): Promise<number> {
    if (TD_MODE === "postgres") { const s = await pg(); const r = await s`SELECT value FROM td_settings WHERE key='default_cap' LIMIT 1`; return r[0] ? Number(r[0].value) : 30; }
    return serial(() => Number(load().settings["default_cap"] ?? 30));
  },
  async setDefaultCap(v: number) {
    if (TD_MODE === "postgres") { const s = await pg(); await s`INSERT INTO td_settings (key,value) VALUES ('default_cap',${String(v)}) ON CONFLICT (key) DO UPDATE SET value=${String(v)}`; return; }
    await serial(() => { load().settings["default_cap"] = String(v); save(); });
  },
  async cap(userId: string): Promise<number> {
    if (TD_MODE === "postgres") { const s = await pg(); const r = await s`SELECT weekly_cap FROM td_caps WHERE user_id=${userId} LIMIT 1`; return r[0] ? Number(r[0].weekly_cap) : await td.defaultCap(); }
    return serial(() => { const c = load().caps.find(x => x.user_id === userId); return c ? c.weekly_cap : Number(load().settings["default_cap"] ?? 30); });
  },
  async setCap(userId: string, v: number) {
    if (TD_MODE === "postgres") { const s = await pg(); await s`INSERT INTO td_caps (user_id,weekly_cap,updated) VALUES (${userId},${v},${now()}) ON CONFLICT (user_id) DO UPDATE SET weekly_cap=${v}, updated=${now()}`; return; }
    await serial(() => { const d = load(); const i = d.caps.findIndex(x => x.user_id === userId); if (i >= 0) d.caps[i] = { user_id: userId, weekly_cap: v, updated: now() }; else d.caps.push({ user_id: userId, weekly_cap: v, updated: now() }); save(); });
  },
  async caps(): Promise<Cap[]> {
    if (TD_MODE === "postgres") { const s = await pg(); return (await s`SELECT * FROM td_caps`).map((r: any) => ({ ...r, weekly_cap: Number(r.weekly_cap), updated: Number(r.updated) })); }
    return serial(() => [...load().caps]);
  },
  async weekNet(userId: string): Promise<number> {
    const since = now() - WEEK;
    if (TD_MODE === "postgres") { const s = await pg(); const r = await s`SELECT COALESCE(SUM(payout - stake),0) AS net FROM td_rounds WHERE user_id=${userId} AND ts>=${since}`; return Number(r[0]?.net ?? 0); }
    return serial(() => load().rounds.filter(r => r.user_id === userId && r.ts >= since).reduce((a, r) => a + (r.payout - r.stake), 0));
  },
  async addRound(r: Round) {
    if (TD_MODE === "postgres") { const s = await pg(); await s`INSERT INTO td_rounds (id,user_id,slug,engine,stake,payout,mult,ts,capped) VALUES (${r.id},${r.user_id},${r.slug},${r.engine},${r.stake},${r.payout},${r.mult},${r.ts},${r.capped})`; return; }
    await serial(() => { const d = load(); d.rounds.unshift(r); d.rounds = d.rounds.slice(0, 4000); save(); });
  },
  async rounds(userId?: string): Promise<Round[]> {
    if (TD_MODE === "postgres") { const s = await pg(); const rows = userId ? await s`SELECT * FROM td_rounds WHERE user_id=${userId} ORDER BY ts DESC LIMIT 200` : await s`SELECT * FROM td_rounds ORDER BY ts DESC LIMIT 300`; return rows.map((r: any) => ({ ...r, stake: Number(r.stake), payout: Number(r.payout), mult: Number(r.mult), ts: Number(r.ts), capped: r.capped === true })); }
    return serial(() => { const d = load(); return (userId ? d.rounds.filter(r => r.user_id === userId) : d.rounds).slice(0, 300); });
  },
  async log(actor: string, action: string, target: string, detail: string) {
    const a: Audit = { id: rid(), actor, action, target, detail, ts: now() };
    if (TD_MODE === "postgres") { const s = await pg(); await s`INSERT INTO td_audit (id,actor,action,target,detail,ts) VALUES (${a.id},${a.actor},${a.action},${a.target},${a.detail},${a.ts})`; return; }
    await serial(() => { const d = load(); d.audit.unshift(a); d.audit = d.audit.slice(0, 1000); save(); });
  },

  async rtpOverrides(): Promise<Record<string, number>> {
    if (TD_MODE === "postgres") {
      const s = await pg();
      const r = await s`SELECT key, value FROM td_settings WHERE key LIKE 'rtp_%'`;
      const o: Record<string, number> = {};
      for (const row of r) {
        const k = String(row.key).replace("rtp_", "");
        o[k] = Number(row.value);
      }
      return o;
    }
    return serial(() => {
      const o: Record<string, number> = {};
      for (const k of Object.keys(load().settings)) {
        if (k.startsWith("rtp_")) o[k.replace("rtp_", "")] = Number(load().settings[k]);
      }
      return o;
    });
  },
  async setRtpOverride(cat: string, v: number) {
    const key = "rtp_" + cat;
    const val = String(v);
    if (TD_MODE === "postgres") {
      const s = await pg();
      await s`INSERT INTO td_settings (key, value) VALUES (${key}, ${val}) ON CONFLICT (key) DO UPDATE SET value = ${val}`;
      return;
    }
    await serial(() => { load().settings[key] = val; save(); });
  },
  async kbRtp(): Promise<Record<string, number>> {
    if (TD_MODE === "postgres") {
      const s = await pg();
      const rows = await s`SELECT key, value FROM td_settings WHERE key LIKE ${"kbrtp_%"}`;
      const o: Record<string, number> = {};
      for (const r of rows) { o[String(r.key).replace("kbrtp_", "")] = Number(r.value); }
      return o;
    }
    return serial(() => {
      const st = load().settings; const o: Record<string, number> = {};
      Object.keys(st).forEach(k => { if (k.indexOf("kbrtp_") === 0) o[k.replace("kbrtp_", "")] = Number(st[k]); });
      return o;
    });
  },
  async kbSetRtp(cat: string, v: number) {
    const key = "kbrtp_" + cat; const val = String(v);
    if (TD_MODE === "postgres") {
      const s = await pg();
      await s`INSERT INTO td_settings (key, value) VALUES (${key}, ${val}) ON CONFLICT (key) DO UPDATE SET value = ${val}`;
      return;
    }
    await serial(() => { load().settings[key] = val; save(); });
  },
  async kbRoundPut(id: string, data: string) {
    if (TD_MODE === "postgres") {
      const s = await pg();
      await s`INSERT INTO td_settings (key, value) VALUES (${id}, ${data}) ON CONFLICT (key) DO UPDATE SET value = ${data}`;
      return;
    }
    await serial(() => { load().settings[id] = data; save(); });
  },
  async kbRoundGet(id: string): Promise<string | null> {
    if (TD_MODE === "postgres") {
      const s = await pg();
      const r = await s`SELECT value FROM td_settings WHERE key = ${id} LIMIT 1`;
      return r[0] ? String(r[0].value) : null;
    }
    return serial(() => { const v = load().settings[id]; return v === undefined ? null : String(v); });
  },
  async audits(): Promise<Audit[]> {
    if (TD_MODE === "postgres") { const s = await pg(); return (await s`SELECT * FROM td_audit ORDER BY ts DESC LIMIT 200`).map((r: any) => ({ ...r, ts: Number(r.ts) })); }
    return serial(() => [...load().audit].slice(0, 200));
  },
};