import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { dropBall, generateMultipliers, plinkoBySlug } from "@/lib/kb2/plinkoMath";
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
    const cfg = plinkoBySlug(String(b.slug || "medium"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.97;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.97; }
    
    const d = await db.post(u.id, "BET", stake, "Plinko drop " + cfg.name);
    if (!d.ok) return bad(d.msg);
    
    const result = dropBall();
    const bucket = result[0];
    const path = result.slice(1);
    const multipliers = generateMultipliers(cfg.risk, rtp);
    const mult = multipliers[bucket];
    const paid = r2(stake * mult);
    const tx = "PL" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, "Plinko win " + mult.toFixed(2) + "x bucket " + bucket + " " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: { bucket: bucket, path: path, multiplier: mult, paid: paid }, tx: tx, rtp: rtp, balance: balance, stake: stake });
  } catch (e) {
    console.error("kb2 plinko", e);
    return bad("Server error", 500);
  }
}