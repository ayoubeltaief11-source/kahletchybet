import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { diceRoll, diceMultiplier, limboRoll, diceBySlug } from "@/lib/kb2/diceMath";
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
    const cfg = diceBySlug(String(b.slug || "dice-classic"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.97;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.97; }
    
    const d = await db.post(u.id, "BET", stake, cfg.type + " bet " + cfg.name);
    if (!d.ok) return bad(d.msg);
    
    let roll: number, win: boolean, mult: number, actualMult: number;
    
    if (cfg.type === "dice") {
      const target = Math.max(2, Math.min(98, Math.floor(Number(b.target) || 50)));
      const over = Boolean(b.over);
      roll = diceRoll();
      win = over ? roll > target : roll < target;
      mult = diceMultiplier(target, over, rtp);
      actualMult = win ? mult : 0;
    } else {
      const targetMult = Math.max(1.01, Math.min(1000, r2(Number(b.targetMult) || 2)));
      const res = limboRoll(targetMult, rtp);
      roll = res.roll;
      win = res.win;
      mult = targetMult;
      actualMult = res.actualMult;
    }
    
    const paid = win ? r2(stake * actualMult) : 0;
    const tx = (cfg.type === "dice" ? "DC" : "LM") + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, cfg.type + " win " + roll + " " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({
      ok: true, type: cfg.type, roll: roll, win: win,
      mult: mult, actualMult: actualMult, paid: paid, tx: tx,
      rtp: rtp, balance: balance, stake: stake
    });
  } catch (e) {
    console.error("kb2 dice", e);
    return bad("Server error", 500);
  }
}