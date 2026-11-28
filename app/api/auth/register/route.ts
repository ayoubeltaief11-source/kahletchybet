import { z } from "zod";
import { db, hashPassword, nid, now } from "@/lib/db";
import { startSession, publicUser, rateLimit } from "@/lib/auth";
import { bad, ok, logErr } from "@/lib/guard";
import { headers } from "next/headers";

const Body = z.object({
  email: z.string().email().max(160),
  name: z.string().min(3).max(40),
  password: z.string().min(8).max(120),
});

export async function POST(req: Request) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!rateLimit("reg:" + ip, 6, 300000)) return bad("Too many attempts. Wait a few minutes.", 429);
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");
    const { email, name, password } = parsed.data;
    const e = email.trim().toLowerCase();
    if (await db.userByEmail(e)) return bad("That email is already registered");
    const id = nid();
    await db.createUser({ id, email: e, name: name.trim(), password: hashPassword(password), role: "user", avatar: "bolt", balance: 0,
      must_change_password: false, banned: false, created: now() });
    // zero-start policy: admin funds accounts manually
    await startSession(id);
    const u = await db.userById(id);
    return ok({ user: publicUser(u!) });
  } catch (e) { logErr("register", e); return bad("Registration failed", 500); }
}
