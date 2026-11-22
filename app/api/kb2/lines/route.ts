import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { spinOnce, lineBySlug, FREE_AWARD } from "@/lib/kb2/lineMath";
import type { SpinResult } from "@/lib/kb2/lineMath";
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
    const cfg = lineBySlug(String(b.slug || "jadecourt"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum stake is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    let rtp = 0.965;
    try { rtp = resolveRtp("slots", await td.kbRtp()); } catch (e) { rtp = 0.965; }
    const d = await db.post(u.id, "BET", stake, "Payline spin " + cfg.name);
    if (!d.ok) return bad(d.msg);
    const rounds: SpinResult[] = [];
    const base = spinOnce(rtp, cfg.rows, false, 0);
    rounds.push(base);
    let left = base.scatters.length >= 3 ? FREE_AWARD : 0;
    let streak = 0;
    let freeWon = 0;
    let guard = 0;
    while (left > 0 && guard < 60) {
      guard += 1; left -= 1;
      const fr = spinOnce(rtp, cfg.rows, true, streak);
      rounds.push(fr);
      freeWon += fr.totalMult;
      if (fr.totalMult > 0) streak += 1; else streak = 0;
      if (fr.scatters.length >= 3) left += 5;
    }
    const totalMult = r2(base.totalMult + freeWon);
    const paid = r2(stake * totalMult);
    const tx = "LN" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Payline win " + totalMult.toFixed(2) + "x " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    return NextResponse.json({ ok: true, rounds: rounds, totalMult: totalMult, paid: paid, tx: tx, freeSpins: rounds.length - 1, rtp: rtp, balance: balance, stake: stake, rows: cfg.rows });
  } catch (e) {
    console.error("kb2 lines", e);
    return bad("Server error", 500);
  }
}