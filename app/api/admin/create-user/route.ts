import { z } from "zod";
import { db, hashPassword, nid, now } from "@/lib/db";
import { needAdmin, bad, ok, logErr } from "@/lib/guard";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["user", "secondary_admin"]).default("user"),
});

export async function POST(req: Request) {
  const g = await needAdmin(); if (g.res) return g.res;
  const user = await db.userById(g.user!.id);
  if (user?.role !== "admin") {
    return bad("Unauthorized: Admin access required", 403);
  }
  try {
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad("Invalid request: " + p.error.message);
    const { name, email, password, role: newRole } = p.data;

    const existing = await db.userByEmail(email);
    if (existing) return bad("Email already registered", 409);

    const hashed = hashPassword(password);
    const id = nid();
    await db.createUser({
      id,
      email,
      name,
      password: hashed,
      role: newRole as any,
      avatar: "bolt",
      balance: 500.51,
      banned: false,
      created: now(),
    });

    return ok({ message: "Account created successfully", userId: id, role: newRole });
  } catch (e) {
    logErr("create-user", e);
    return bad("Failed to create account", 500);
  }
}
