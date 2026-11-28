import { z } from "zod";
import { db } from "@/lib/db";
import { td } from "@/lib/td-store";
import { needAdmin, bad, ok, logErr } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["admin_credit", "cap", "defaultCap"]),
  userId: z.string().max(80).optional(),
  amount: z.number().optional(),
});

export async function GET() {
  const g = await needAdmin(); if (g.res) return g.res;
  const users = await db.users();
  const caps = await td.caps();
  const def = await td.defaultCap();
  const rows = [];
  for (const u of users) {
    const net = await td.weekNet(u.id);
    const cap = caps.find(c => c.user_id === u.id)?.weekly_cap ?? def;
    rows.push({ id: u.id, name: u.name, email: u.email, role: u.role, banned: u.banned, balance: u.balance, cap, net: Math.round(net * 100) / 100, headroom: Math.round(Math.max(0, cap - net) * 100) / 100 });
  }
  return ok({ users: rows, defaultCap: def, rounds: await td.rounds(), audit: await td.audits() });
}

export async function POST(req: Request) {
  const g = await needAdmin(); if (g.res) return g.res;
  const user = await db.userById(g.user!.id);
  if (user?.role !== "admin") {
    return bad("Unauthorized: Admin access required", 403);
  }
  try {
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad("Invalid request");
    const { action, userId, amount } = p.data;
    const admin = g.user!;

    if (action === "defaultCap") {
      const v = Number(amount);
      if (!isFinite(v) || v < 0) return bad("Enter a valid cap");
      await td.setDefaultCap(v);
      await td.log(admin.email, "DEFAULT_CAP", "global", "Default weekly cap set to " + v + " TD");
      return ok({ message: "Default cap updated" });
    }

    if (!userId) return bad("User ID is required");
    const target = await db.userById(userId);
    if (!target) return bad("No account with that ID", 404);
    const v = Number(amount);
    if (!isFinite(v) || v < 0) return bad("Enter a valid amount");

    if (action === "cap") {
      await td.setCap(userId, v);
      await td.log(admin.email, "SET_CAP", target.email, "Weekly cap set to " + v + " TD");
      return ok({ message: "Weekly cap saved for " + target.name });
    }

    // Admin Credit (issued by admin)
    const r = await db.post(userId, "ADMIN_CREDIT", v, "Admin credit (issued by " + admin.email + ")");
    if (!r.ok) return bad(r.msg);
    await td.log(admin.email, "ADMIN_CREDIT", target.email, v + " TD -> balance " + r.balance);
    return ok({ message: "Credited " + v + " TD to " + target.name, balance: r.balance });
  } catch (e) { logErr("admin-td", e); return bad("Operation failed", 500); }
}
