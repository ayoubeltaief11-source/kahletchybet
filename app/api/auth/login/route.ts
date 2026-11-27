import { z } from "zod";
import { db, verifyPassword } from "@/lib/db";
import { startSession, publicUser, rateLimit } from "@/lib/auth";
import { bad, ok, logErr } from "@/lib/guard";
import { headers } from "next/headers";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0] ?? "local";
    if (!rateLimit("login:" + ip, 12, 60000)) return bad("Too many attempts. Try again shortly.", 429);
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad("Enter a valid email and password");
    const u = await db.userByEmail(p.data.email);
    if (!u || !verifyPassword(p.data.password, u.password)) return bad("Email or password is incorrect", 401);
    if (u.banned) return bad("This account is suspended", 403);
    await startSession(u.id);
    const mustChange = (u as any).must_change_password === true;
    
    return ok({ user: publicUser(u), mustChangePassword: mustChange });
    
  } catch (e) { logErr("login", e); return bad("Sign-in failed", 500); }
}


