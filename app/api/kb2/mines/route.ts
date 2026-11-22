import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { generateMines, minesMultiplier, minesBySlug, GRID_SIZE } from "@/lib/kb2/minesMath";
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
    const cfg = minesBySlug(String(b.slug || "classic"));
    const mines = Math.max(1, Math.min(24, Math.floor(Number(b.mines) || cfg.defaultMines)));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.97;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.97; }
    
    const d = await db.post(u.id, "BET", stake, "Mines bet " + cfg.name);
    if (!d.ok) return bad(d.msg);
    
    const minePositions = generateMines(mines);
    const tx = "MN" + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    await td.kbRoundPut("kb_" + tx, JSON.stringify({
      uid: u.id, gid: cfg.slug, stake: stake, mines: mines,
      positions: minePositions, revealed: [], done: 0
    }));
    
    return NextResponse.json({ ok: true, tx: tx, rtp: rtp, balance: d.balance, stake: stake, mines: mines, positions: minePositions });
  } catch (e) {
    console.error("kb2 mines", e);
    return bad("Server error", 500);
  }
}