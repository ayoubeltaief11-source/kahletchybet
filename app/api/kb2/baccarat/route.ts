import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { createShoe, playBaccarat, baccaratBySlug } from "@/lib/kb2/baccaratMath";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const bad = (m: string, c?: number) => NextResponse.json({ ok: false, error: m }, { status: c || 400 });
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) return bad("Sign in to play", 401);
    const b = await req.json();
    const cfg = baccaratBySlug(String(b.slug || "classic"));
    const betType = b.betType || "player";
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.9894;
    try { rtp = resolveRtp("table", await td.kbRtp()); } catch (e) { rtp = 0.9894; }
    
    const d = await db.post(u.id, "BET", stake, "Baccarat " + betType + " bet");
    if (!d.ok) return bad(d.msg);
    
    const shoe = createShoe(8);
    const res = playBaccarat(shoe);
    
    let paid = 0;
    if (betType === res.winner) {
      if (res.winner === "banker" && cfg.commission > 0) {
        paid = r2(stake * 2 * (1 - cfg.commission));
      } else if (res.winner === "tie") {
        paid = r2(stake * 9);
      } else {
        paid = r2(stake * 2);
      }
    } else if (betType !== res.winner && res.winner === "tie") {
      paid = stake;
    }
    
    const tx = "BA" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Baccarat win " + res.winner + " " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: res, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: stake, betType: betType });
  } catch (e) {
    console.error("kb2 baccarat", e);
    return bad("Server error", 500);
  }
}