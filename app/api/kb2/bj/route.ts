import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { createShoe, playHand, calcScore } from "@/lib/kb2/bjMath";
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
    const stake = r2(Number(b.stake));
    const action = b.action || "stand";
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.995; 
    try { rtp = resolveRtp("table", await td.kbRtp()); } catch (e) { rtp = 0.995; }
    
    const d = await db.post(u.id, "BET", stake, "Blackjack bet");
    if (!d.ok) return bad(d.msg);
    
    const shoe = createShoe(6);
    const pCards = [shoe.pop()!, shoe.pop()!];
    const dCards = [shoe.pop()!, { ...shoe.pop()!, hidden: true }];
    
    const res = playHand(shoe, stake, action, pCards, dCards);
    res.dealerHand.cards.forEach(c => c.hidden = false);
    
    const finalStake = action === "double" ? stake * 2 : stake;
    const paid = r2(finalStake * res.payoutMult);
    const tx = "BJ" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    let balance = d.balance;
    if (paid > 0 && res.outcome !== "push") {
      const w = await db.post(u.id, "WIN", paid, "Blackjack " + res.outcome + " " + tx);
      if (w.ok) balance = w.balance;
    } else if (res.outcome === "push") {
      const w = await db.post(u.id, "WIN", stake, "Blackjack push " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: res, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: finalStake });
  } catch (e) {
    console.error("kb2 bj", e);
    return bad("Server error", 500);
  }
}