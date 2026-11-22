import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { minesMultiplier } from "@/lib/kb2/minesMath";
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
    const tx = String(b.tx || "");
    const mult = r2(Number(b.mult));
    
    const raw = await td.kbRoundGet("kb_" + tx);
    if (!raw) return bad("Round not found", 404);
    const st = JSON.parse(raw) as { uid: string; stake: number; mines: number; positions: number[]; revealed: number[]; done: number };
    if (st.uid !== u.id) return bad("Round owner mismatch", 403);
    if (st.done === 1) return bad("Round already settled", 409);
    
    const safeRevealed = st.revealed.filter(function (i) { return st.positions.indexOf(i) < 0; }).length;
    let rtp = 0.97;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.97; }
    const expectedMult = minesMultiplier(st.mines, safeRevealed, rtp);
    
    if (Math.abs(mult - expectedMult) > 0.01) return bad("Multiplier mismatch", 400);
    
    const paid = r2(st.stake * mult);
    st.done = 1;
    await td.kbRoundPut("kb_" + tx, JSON.stringify(st));
    
    const w = await db.post(u.id, "WIN", paid, "Mines cashout " + mult.toFixed(2) + "x " + tx);
    if (!w.ok) return bad(w.msg);
    
    return NextResponse.json({ ok: true, paid: paid, balance: w.balance });
  } catch (e) {
    console.error("kb2 mines cash", e);
    return bad("Server error", 500);
  }
}