import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { db, ensureSeed, hashToken, nid, now, type User } from "./db";

const COOKIE = "kb_session";
const TTL = 1000 * 60 * 60 * 24 * 7;

export async function currentUser(): Promise<User | null> {
  await ensureSeed();
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const s = await db.session(hashToken(raw));
  if (!s || s.expires < now()) return null;
  const u = await db.userById(s.user_id);
  if (!u || u.banned) return null;
  return u;
}

export async function startSession(userId: string) {
  const raw = randomBytes(32).toString("hex");
  await db.addSession({ token: hashToken(raw), user_id: userId, expires: now() + TTL, created: now() });
  const jar = await cookies();
  jar.set(COOKIE, raw, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL / 1000 });
}

export async function endSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) await db.dropSession(hashToken(raw));
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export const publicUser = (u: User) => ({ id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar, balance: u.balance, created: u.created });

const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 12, windowMs = 60000) {
  const t = Date.now(); const rec = hits.get(key);
  if (!rec || t - rec.t > windowMs) { hits.set(key, { n: 1, t }); return true; }
  rec.n++; return rec.n <= max;
}
export const newId = nid;
