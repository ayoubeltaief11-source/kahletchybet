import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { rollDice, evaluateSicBo, sicboBySlug, PAYOUTS } from "@/lib/kb2/sicboMath";
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
    const cfg = sicboBySlug(String(b.slug || "classic"));
    const bets = b.bets || {};
    const totalStake = Object.keys(bets).reduce(function (a, k) { return a + r2(Number(bets[k]) || 0); }, 0);
    if (totalStake < 1) return bad("Minimum bet is 1 TD");
    if (totalStake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.972;
    try { rtp = resolveRtp("table", await td.kbRtp()); } catch (e) { rtp = 0.972; }
    
    const d = await db.post(u.id, "BET", totalStake, "Sic Bo bet");
    if (!d.ok) return bad(d.msg);
    
    const dice = rollDice();
    const res = evaluateSicBo(dice);
    
    let paid = 0;
    Object.keys(bets).forEach(function (type) {
      const amount = r2(Number(bets[type]));
      if (amount <= 0) return;
      let mult = 0;
      if (type === "big" && res.isBig) mult = PAYOUTS.bigSmall;
      else if (type === "small" && res.isSmall) mult = PAYOUTS.bigSmall;
      else if (type.startsWith("triple:") && res.specificTriples[parseInt(type.split(":")[1]) - 1]) mult = PAYOUTS.specificTriple;
      else if (type === "anytriple" && res.anyTriple) mult = PAYOUTS.anyTriple;
      else if (type.startsWith("double:") && res.specificDoubles[parseInt(type.split(":")[1]) - 1]) mult = PAYOUTS.specificDouble;
      else if (type.startsWith("combo:")) {
        const idx = parseInt(type.split(":")[1]);
        if (res.twoDiceCombos[idx]) mult = PAYOUTS.twoDiceCombo;
      }
      else if (type.startsWith("sum:")) {
        const s = parseInt(type.split(":")[1]);
        if (res.sumBets[s - 4]) mult = PAYOUTS.sum[s as keyof typeof PAYOUTS.sum] || 0;
      }
      if (mult > 0) paid += r2(amount * mult);
    });
    
    const tx = "SB" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Sic Bo win " + dice.join("-") + " " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: res, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: totalStake });
  } catch (e) {
    console.error("kb2 sicbo", e);
    return bad("Server error", 500);
  }
}