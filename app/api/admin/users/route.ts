import { z } from "zod";
import { db } from "@/lib/db";
import { needAdmin, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
const Body = z.object({ id: z.string(), action: z.enum(["ban", "unban", "role", "credit", "debit"]), value: z.union([z.string(), z.number()]).optional() });

export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  const users = await db.users();
  const rows = [];
  for (const u of users) rows.push({ id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar, balance: u.balance, banned: u.banned, created: u.created, bets: (await db.bets(u.id)).length });
  return ok({ users: rows });
}
export async function POST(req: Request) {
  const g = await needAdmin(); if (g.res) return g.res;
  const p = Body.safeParse(await req.json());
  if (!p.success) return bad("Invalid action");
  const { id, action, value } = p.data;
  const target = await db.userById(id);
  if (!target) return bad("User not found", 404);
  if (action === "ban") await db.patchUser(id, { banned: true });
  if (action === "unban") await db.patchUser(id, { banned: false });
  if (action === "role") {
    if (id === g.user!.id) return bad("You cannot change your own role");
    await db.patchUser(id, { role: value === "admin" ? "admin" : "user" });
  }
  if (action === "credit" || action === "debit") {
    const amt = Number(value);
    if (!isFinite(amt) || amt <= 0) return bad("Enter a positive amount");
    const r = await db.post(id, "ADJUST", action === "credit" ? amt : -amt, "Administrator adjustment");
    if (!r.ok) return bad(r.msg);
  }
  const users = await db.users();
  return ok({ users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, avatar: u.avatar, balance: u.balance, banned: u.banned, created: u.created })) });
}