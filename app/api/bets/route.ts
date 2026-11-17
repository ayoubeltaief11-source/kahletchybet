import { z } from "zod";
import { db, nid, now } from "@/lib/db";
import { needUser, bad, ok, logErr } from "@/lib/guard";

export const dynamic = "force-dynamic";
const Sel = z.object({ fixture: z.string(), label: z.string(), market: z.string(), pick: z.string(), price: z.number().min(1.01).max(1000) });
const Body = z.object({ selections: z.array(Sel).min(1).max(12), stake: z.number().min(10).max(100000), mode: z.enum(["single", "combo"]).default("combo") });

export async function GET() {
  const g = await needUser(); if (g.res) return g.res;
  return ok({ bets: await db.bets(g.user!.id) });
}
export async function POST(req: Request) {
  try {
    const g = await needUser(); if (g.res) return g.res;
    const p = Body.safeParse(await req.json());
    if (!p.success) return bad(p.error.issues[0]?.message ?? "Invalid bet");
    const { selections, stake, mode } = p.data;
    const total = mode === "combo" ? stake : stake * selections.length;
    if (total > g.user!.balance) return bad("Insufficient demo balance");
    const combo = selections.reduce((a, s) => a * s.price, 1);
    const created: string[] = [];
    if (mode === "combo") {
      const r = await db.post(g.user!.id, "BET", stake, `Demo combo  ${selections.length}`);
      if (!r.ok) return bad(r.msg);
      const id = nid();
      await db.addBet({ id, user_id: g.user!.id, payload: JSON.stringify(selections), stake, odds: combo, potential: Math.round(stake * combo * 100) / 100, status: "OPEN", created: now(), settled: null });
      created.push(id);
    } else {
      for (const s of selections) {
        const r = await db.post(g.user!.id, "BET", stake, `Demo single  ${s.pick}`);
        if (!r.ok) return bad(r.msg);
        const id = nid();
        await db.addBet({ id, user_id: g.user!.id, payload: JSON.stringify([s]), stake, odds: s.price, potential: Math.round(stake * s.price * 100) / 100, status: "OPEN", created: now(), settled: null });
        created.push(id);
      }
    }
    return ok({ created, bets: await db.bets(g.user!.id), balance: (await db.userById(g.user!.id))!.balance,
      notice: "Demo bets stay OPEN until real settlement data is connected. No real money is involved." });
  } catch (e) { logErr("bets", e); return bad("Bet placement failed", 500); }
}