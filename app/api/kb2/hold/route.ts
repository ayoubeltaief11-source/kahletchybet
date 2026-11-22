import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { spinOnce, holdBySlug } from "@/lib/kb2/holdMath";
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
    const cfg = holdBySlug(String(b.slug || "magmareserve"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum stake is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    let rtp = 0.965;
    try { rtp = resolveRtp("slots", await td.kbRtp()); } catch (e) { rtp = 0.965; }
    const d = await db.post(u.id, "BET", stake, "Hold and Win " + cfg.name);
    if (!d.ok) return bad(d.msg);
    const res = spinOnce(rtp);
    const paid = r2(stake * res.totalMult);
    const tx = "HW" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Hold win " + res.totalMult.toFixed(2) + "x " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    return NextResponse.json({ ok: true, result: res, paid: paid, totalMult: res.totalMult, tx: tx, rtp: rtp, balance: balance, stake: stake });
  } catch (e) {
    console.error("kb2 hold", e);
    return bad("Server error", 500);
  }
}