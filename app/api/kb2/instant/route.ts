import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { hiloCard, hiloMultiplier, coinFlip, wheelSpin, instantBySlug } from "@/lib/kb2/instantMath";
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
    const cfg = instantBySlug(String(b.slug || "hilo-classic"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.97;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.97; }
    
    const d = await db.post(u.id, "BET", stake, cfg.type + " bet " + cfg.name);
    if (!d.ok) return bad(d.msg);
    
    let result: any;
    
    if (cfg.type === "hilo") {
      const current = hiloCard();
      const higher = Boolean(b.higher);
      const next = hiloCard();
      const win = higher ? next > current : next < current;
      const mult = win ? hiloMultiplier(current, higher, rtp) : 0;
      result = { type: "hilo", current: current, next: next, higher: higher, win: win, mult: mult };
    } else if (cfg.type === "coin") {
      const bet = b.bet || "heads";
      const flip = coinFlip(bet, rtp);
      result = { type: "coin", bet: bet, flip: flip.result, win: flip.win, mult: flip.mult };
    } else {
      const spin = wheelSpin();
      result = { type: "wheel", segment: spin.segment, mult: spin.mult, color: spin.color, win: spin.mult > 0 };
    }
    
    const paid = result.win ? r2(stake * result.mult) : 0;
    const tx = (cfg.type === "hilo" ? "HL" : cfg.type === "coin" ? "CF" : "WF") + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, cfg.type + " win " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: result, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: stake });
  } catch (e) {
    console.error("kb2 instant", e);
    return bad("Server error", 500);
  }
}