import { z } from "zod";
import { db } from "@/lib/db";
import { needUser, bad, ok, logErr } from "@/lib/guard";
import { publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const Body = z.object({ kind: z.enum(["DEPOSIT", "WITHDRAW"]), amount: z.number().positive().max(1000000), method: z.string().max(40).default("Demo Card") });

export async function GET() {
  const g = await needUser(); if (g.res) return g.res;
  return ok({ balance: g.user!.balance, ledger: await db.ledger(g.user!.id) });
}
export async function POST(req: Request) {
  try {
    const g = await needUser(); if (g.res) return g.res;
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad("Enter a valid demo amount");
    const { kind, amount, method } = p.data;
    const r = await db.post(g.user!.id, kind, amount, `${kind === "DEPOSIT" ? "Demo deposit" : "Demo withdrawal"} Â· ${method} (simulation)`);
    if (!r.ok) return bad(r.msg);
    const u = await db.userById(g.user!.id);
    return ok({ user: publicUser(u!), ledger: await db.ledger(g.user!.id) });
  } catch (e) { logErr("wallet", e); return bad("Wallet operation failed", 500); }
}