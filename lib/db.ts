import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA } from "./schema.mjs";

export type Role = "user" | "admin";
export interface User { id: string; email: string; name: string; password: string; role: Role; avatar: string; balance: number; banned: boolean; must_change_password: boolean; created: number; }
export interface Session { token: string; user_id: string; expires: number; created: number; }
export interface Entry { id: string; user_id: string; kind: string; amount: number; before: number; after: number; note: string; created: number; }
export interface BetRow { id: string; user_id: string; payload: string; stake: number; odds: number; potential: number; status: string; created: number; settled: number | null; }
export interface Game { id: string; name: string; provider: string; category: string; external_id: string; launch_url: string; thumbnail: string; status: string; domains: string; config: string; featured: boolean; sort: number; created: number; }

export const nid = () => randomBytes(12).toString("hex");
export const now = () => Date.now();

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(pw, salt, 64).toString("hex");
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const a = scryptSync(pw, salt, 64); const b = Buffer.from(key, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/* ---------------- storage drivers ---------------- */
interface Shape { users: User[]; sessions: Session[]; ledger: Entry[]; bets: BetRow[]; games: Game[]; settings: Record<string, string>; }
const EMPTY: Shape = { users: [], sessions: [], ledger: [], bets: [], games: [], settings: {} };

let pg: any = null; let pgReady: Promise<void> | null = null;
const URL_PG = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
export const MODE = URL_PG ? "postgres" : "file";

async function pgInit() {
  if (!pgReady) {
    pgReady = (async () => {
      const mod = await import("postgres");
      pg = mod.default(URL_PG, { ssl: "require", max: 5, idle_timeout: 20 });
      for (const s of SCHEMA) await pg.unsafe(s);
    })();
  }
  await pgReady; return pg;
}

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "store.json");
let mem: Shape | null = null;
let chain: Promise<any> = Promise.resolve();

function load(): Shape {
  if (mem) return mem;
  try {
    if (existsSync(DATA_FILE)) { mem = { ...EMPTY, ...JSON.parse(readFileSync(DATA_FILE, "utf8")) }; return mem!; }
  } catch {}
  mem = JSON.parse(JSON.stringify(EMPTY)); return mem!;
}
function persist() {
  try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); writeFileSync(DATA_FILE, JSON.stringify(mem)); } catch {}
}
function serial<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});
  return run;
}

/* ---------------- unified API ---------------- */
export const db = {
  async userByEmail(email: string): Promise<User | null> {
    const e = email.trim().toLowerCase();
    if (MODE === "postgres") { const s = await pgInit(); const r = await s`SELECT * FROM users WHERE email=${e} LIMIT 1`; return r[0] ? norm(r[0]) : null; }
    return serial(() => load().users.find(u => u.email === e) ?? null);
  },
  async userById(id: string): Promise<User | null> {
    if (MODE === "postgres") { const s = await pgInit(); const r = await s`SELECT * FROM users WHERE id=${id} LIMIT 1`; return r[0] ? norm(r[0]) : null; }
    return serial(() => load().users.find(u => u.id === id) ?? null);
  },
  async users(): Promise<User[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM users ORDER BY created DESC`).map(norm); }
    return serial(() => [...load().users].sort((a, b) => b.created - a.created));
  },
  async createUser(u: User) {
    if (MODE === "postgres") { const s = await pgInit(); await s`INSERT INTO users (id,email,name,password,role,avatar,balance,banned,created) VALUES (${u.id},${u.email},${u.name},${u.password},${u.role},${u.avatar},${u.balance},${u.banned},${u.created})`; return; }
    await serial(() => { load().users.push(u); persist(); });
  },
  async patchUser(id: string, patch: Partial<User>) {
    if (MODE === "postgres") {
      const s = await pgInit(); const cur = await db.userById(id); if (!cur) return;
      const n = { ...cur, ...patch };
      await s`UPDATE users SET name=${n.name}, avatar=${n.avatar}, role=${n.role}, banned=${n.banned}, balance=${n.balance} WHERE id=${id}`;
      return;
    }
    await serial(() => { const d = load(); const i = d.users.findIndex(u => u.id === id); if (i >= 0) { d.users[i] = { ...d.users[i], ...patch }; persist(); } });
  },
  async addSession(sess: Session) {
    if (MODE === "postgres") { const s = await pgInit(); await s`INSERT INTO sessions (token,user_id,expires,created) VALUES (${sess.token},${sess.user_id},${sess.expires},${sess.created})`; return; }
    await serial(() => { load().sessions.push(sess); persist(); });
  },
  async session(token: string): Promise<Session | null> {
    if (MODE === "postgres") { const s = await pgInit(); const r = await s`SELECT * FROM sessions WHERE token=${token} LIMIT 1`; return r[0] ? { ...r[0], expires: Number(r[0].expires), created: Number(r[0].created) } : null; }
    return serial(() => load().sessions.find(x => x.token === token) ?? null);
  },
  async dropSession(token: string) {
    if (MODE === "postgres") { const s = await pgInit(); await s`DELETE FROM sessions WHERE token=${token}`; return; }
    await serial(() => { const d = load(); d.sessions = d.sessions.filter(x => x.token !== token); persist(); });
  },
  async ledger(uid: string): Promise<Entry[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM ledger WHERE user_id=${uid} ORDER BY created DESC LIMIT 300`).map(normE); }
    return serial(() => load().ledger.filter(x => x.user_id === uid).sort((a, b) => b.created - a.created).slice(0, 300));
  },
  async allLedger(): Promise<Entry[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM ledger ORDER BY created DESC LIMIT 800`).map(normE); }
    return serial(() => [...load().ledger].sort((a, b) => b.created - a.created).slice(0, 800));
  },
  /* Atomic balance mutation + journal write. Never allows negative. */
  async post(uid: string, kind: string, amount: number, note: string): Promise<{ ok: boolean; msg: string; balance: number }> {
    const amt = Math.round(Math.abs(amount) * 100) / 100;
    if (!isFinite(amt)) return { ok: false, msg: "Invalid amount", balance: 0 };
    const kindUpper = kind.toUpperCase();
    const debit = kindUpper === "WITHDRAW" || kindUpper === "BET";
    if (MODE === "postgres") {
      const s = await pgInit();
      return await s.begin(async (tx: any) => {
        const r = await tx`SELECT balance FROM users WHERE id=${uid} FOR UPDATE`;
        if (!r[0]) return { ok: false, msg: "Account missing", balance: 0 };
        const before = Number(r[0].balance);
        const delta = kindUpper === "ADJUST" ? Math.round(amount * 100) / 100 : debit ? -amt : amt;
        const after = Math.round((before + delta) * 100) / 100;
        if (after < 0) return { ok: false, msg: "Insufficient demo balance", balance: before };
        await tx`UPDATE users SET balance=${after} WHERE id=${uid}`;
        await tx`INSERT INTO ledger (id,user_id,kind,amount,before,after,note,created) VALUES (${nid()},${uid},${kind},${Math.abs(delta)},${before},${after},${note},${now()})`;
        return { ok: true, msg: "ok", balance: after };
      });
    }
    return await serial(() => {
      const d = load(); const u = d.users.find(x => x.id === uid);
      if (!u) return { ok: false, msg: "Account missing", balance: 0 };
      const before = u.balance;
      const delta = kindUpper === "ADJUST" ? Math.round(amount * 100) / 100 : debit ? -amt : amt;
      const after = Math.round((before + delta) * 100) / 100;
      if (after < 0) return { ok: false, msg: "Insufficient demo balance", balance: before };
      u.balance = after;
      d.ledger.unshift({ id: nid(), user_id: uid, kind, amount: Math.abs(delta), before, after, note, created: now() });
      persist();
      return { ok: true, msg: "ok", balance: after };
    });
  },
  async bets(uid: string): Promise<BetRow[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM bets WHERE user_id=${uid} ORDER BY created DESC LIMIT 200`).map(normB); }
    return serial(() => load().bets.filter(b => b.user_id === uid).sort((a, b) => b.created - a.created).slice(0, 200));
  },
  async allBets(): Promise<BetRow[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM bets ORDER BY created DESC LIMIT 800`).map(normB); }
    return serial(() => [...load().bets].sort((a, b) => b.created - a.created).slice(0, 800));
  },
  async addBet(b: BetRow) {
    if (MODE === "postgres") { const s = await pgInit(); await s`INSERT INTO bets (id,user_id,payload,stake,odds,potential,status,created,settled) VALUES (${b.id},${b.user_id},${b.payload},${b.stake},${b.odds},${b.potential},${b.status},${b.created},${b.settled})`; return; }
    await serial(() => { load().bets.unshift(b); persist(); });
  },
  async settleBet(id: string, status: string) {
    if (MODE === "postgres") { const s = await pgInit(); await s`UPDATE bets SET status=${status}, settled=${now()} WHERE id=${id}`; return; }
    await serial(() => { const d = load(); const b = d.bets.find(x => x.id === id); if (b) { b.status = status; b.settled = now(); persist(); } });
  },
  async games(): Promise<Game[]> {
    if (MODE === "postgres") { const s = await pgInit(); return (await s`SELECT * FROM games ORDER BY sort ASC, created DESC`).map(normG); }
    return serial(() => [...load().games].sort((a, b) => a.sort - b.sort || b.created - a.created));
  },
  async game(id: string): Promise<Game | null> {
    if (MODE === "postgres") { const s = await pgInit(); const r = await s`SELECT * FROM games WHERE id=${id} LIMIT 1`; return r[0] ? normG(r[0]) : null; }
    return serial(() => load().games.find(g => g.id === id) ?? null);
  },
  async saveGame(g: Game) {
    if (MODE === "postgres") {
      const s = await pgInit();
      await s`INSERT INTO games (id,name,provider,category,external_id,launch_url,thumbnail,status,domains,config,featured,sort,created)
        VALUES (${g.id},${g.name},${g.provider},${g.category},${g.external_id},${g.launch_url},${g.thumbnail},${g.status},${g.domains},${g.config},${g.featured},${g.sort},${g.created})
        ON CONFLICT (id) DO UPDATE SET name=${g.name},provider=${g.provider},category=${g.category},external_id=${g.external_id},
        launch_url=${g.launch_url},thumbnail=${g.thumbnail},status=${g.status},domains=${g.domains},config=${g.config},featured=${g.featured},sort=${g.sort}`;
      return;
    }
    await serial(() => { const d = load(); const i = d.games.findIndex(x => x.id === g.id); if (i >= 0) d.games[i] = g; else d.games.push(g); persist(); });
  },
  async dropGame(id: string) {
    if (MODE === "postgres") { const s = await pgInit(); await s`DELETE FROM games WHERE id=${id}`; return; }
    await serial(() => { const d = load(); d.games = d.games.filter(g => g.id !== id); persist(); });
  },
  async setting(k: string, v?: string): Promise<string> {
    if (MODE === "postgres") {
      const s = await pgInit();
      if (v === undefined) { const r = await s`SELECT value FROM settings WHERE key=${k} LIMIT 1`; return r[0]?.value ?? ""; }
      await s`INSERT INTO settings (key,value) VALUES (${k},${v}) ON CONFLICT (key) DO UPDATE SET value=${v}`; return v;
    }
    return await serial(() => { const d = load(); if (v !== undefined) { d.settings[k] = v; persist(); } return d.settings[k] ?? ""; });
  },
};

function norm(r: any): User { return { ...r, balance: Number(r.balance), banned: r.banned === true || r.banned === "t", created: Number(r.created) }; }
function normE(r: any): Entry { return { ...r, amount: Number(r.amount), before: Number(r.before), after: Number(r.after), created: Number(r.created) }; }
function normB(r: any): BetRow { return { ...r, stake: Number(r.stake), odds: Number(r.odds), potential: Number(r.potential), created: Number(r.created), settled: r.settled ? Number(r.settled) : null }; }
function normG(r: any): Game { return { ...r, featured: r.featured === true || r.featured === "t", sort: Number(r.sort), created: Number(r.created) }; }

/* Seed admin + demo catalogue once. */
let seeded = false;
export async function ensureSeed() {
  if (seeded) return; seeded = true;
  const email = (process.env.ADMIN_EMAIL || "admin@kahlatchybet.demo").toLowerCase();
  if (!(await db.userByEmail(email))) {
    const id = nid();
    await db.createUser({ id, email, name: "Administrator", password: hashPassword(process.env.ADMIN_PASSWORD || "ChangeMe123!"), role: "admin", avatar: "shield", balance: -1, must_change_password: false, banned: false, created: now() });
    // ZERO START POLICY: Admin funds only
  }
  if (!(await db.userByEmail("player@kahlatchybet.demo"))) {
    const id = nid();
    await db.createUser({ id, email: "player@kahlatchybet.demo", name: "Demo Player", password: hashPassword("Player123!"), role: "user", avatar: "bolt", balance: 0, must_change_password: false, banned: false, created: now() });
    // zero-start policy: no welcome credit
  }
  if ((await db.games()).length === 0) {
    const seedGames: [string, string, string, boolean][] = [
      ["kahlatchy Lightning Roulette", "Evolution", "live", true],
      ["kahlatchy Speed Blackjack", "Evolution", "live", true],
      ["kahlatchy Baccarat Salon", "Pragmatic Play Live", "live", false],
      ["kahlatchy Mega Wheel", "Pragmatic Play Live", "live", false],
      ["Golden Pharaoh Deluxe", "Awaiting Provider", "slots", true],
      ["Olympus Thunder", "Awaiting Provider", "slots", true],
      ["Sweet Cascade", "Awaiting Provider", "slots", false],
      ["Big Bass Voyage", "Awaiting Provider", "slots", false],
      ["Sugar Nebula", "Awaiting Provider", "slots", false],
      ["Starlight Fortune", "Awaiting Provider", "slots", false],
      ["kahlatchy Aviator", "Awaiting Provider", "crash", true],
      ["Jet Horizon", "Awaiting Provider", "crash", false],
      ["Rocket Ascent", "Awaiting Provider", "crash", false],
      ["European Roulette Pro", "Awaiting Provider", "roulette", true],
      ["American Roulette Pro", "Awaiting Provider", "roulette", false],
      ["French Roulette Gold", "Awaiting Provider", "roulette", false],
      ["Blackjack Classic 21", "Awaiting Provider", "blackjack", true],
      ["Blackjack VIP Multi", "Awaiting Provider", "blackjack", false],
      ["Baccarat Punto Banco", "Awaiting Provider", "table", false],
      ["Sic Bo Grand", "Awaiting Provider", "table", false],
      ["Video Poker Aces", "Awaiting Provider", "table", false],
      ["Plinko kahlatchy", "Awaiting Provider", "instant", false],
      ["Mines Deep Field", "Awaiting Provider", "instant", true],
      ["Dice Precision", "Awaiting Provider", "instant", false],
      ["Keno Rapid", "Awaiting Provider", "instant", false],
      ["Scratch Gold Bar", "Awaiting Provider", "instant", false]
    ];
    let i = 0;
    for (const [name, provider, category, featured] of seedGames) {
      await db.saveGame({ id: nid(), name, provider, category, external_id: "", launch_url: "", thumbnail: "", status: "awaiting", domains: "", config: "{}", featured, sort: i++, created: now() });
    }
  }
}




