import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { spinRoulette, rouletteBySlug } from "@/lib/kb2/rouletteMath";
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
    const cfg = rouletteBySlug(String(b.slug || "european"));
    const bets = b.bets || {};
    const totalStake = Object.keys(bets).reduce(function (a, k) { return a + r2(Number(bets[k]) || 0); }, 0);
    if (totalStake < 1) return bad("Minimum bet is 1 TD");
    if (totalStake > u.balance) return bad("Insufficient TD balance");
    let rtp = cfg.rtp || 0.973;
    try { rtp = resolveRtp("roulette", await td.kbRtp()); } catch (e) { rtp = cfg.rtp || 0.973; }
    const d = await db.post(u.id, "BET", totalStake, "Roulette spin " + cfg.name);
    if (!d.ok) return bad(d.msg);
    const res = spinRoulette(cfg, bets);
    const paid = res.totalPaid;
    const tx = "RR" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Roulette win " + res.number + " " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    return NextResponse.json({ ok: true, result: res, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: totalStake });
  } catch (e) {
    console.error("kb2 roulette", e);
    return bad("Server error", 500);
  }
}