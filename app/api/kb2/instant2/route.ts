import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { kenoDraw, kenoMultiplier, generateTower, towerMultiplier, instant2BySlug, TOWER_ROWS, TOWER_COLS } from "@/lib/kb2/instant2Math";
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
    const cfg = instant2BySlug(String(b.slug || "keno-classic"));
    const stake = r2(Number(b.stake));
    if (!isFinite(stake) || stake < 1) return bad("Minimum bet is 1 TD");
    if (stake > u.balance) return bad("Insufficient TD balance");
    
    let rtp = 0.95;
    try { rtp = resolveRtp("instant", await td.kbRtp()); } catch (e) { rtp = 0.95; }
    
    const d = await db.post(u.id, "BET", stake, cfg.type + " bet " + cfg.name);
    if (!d.ok) return bad(d.msg);
    
    let result: any;
    
    if (cfg.type === "keno") {
      const picks = (b.picks || []).map(function (n: number) { return Math.max(1, Math.min(80, Math.floor(n))); });
      if (picks.length < 1 || picks.length > 10) return bad("Pick 1-10 numbers");
      const draw = kenoDraw();
      const hits = picks.filter(function (p: number) { return draw.indexOf(p) >= 0; }).length;
      const mult = kenoMultiplier(picks.length, hits);
      result = { type: "keno", picks: picks, draw: draw, hits: hits, mult: mult };
    } else {
      const grid = generateTower();
      const row = Math.max(0, Math.min(TOWER_ROWS - 1, Math.floor(Number(b.row) || 0)));
      const col = Math.max(0, Math.min(TOWER_COLS - 1, Math.floor(Number(b.col) || 0)));
      const isMine = grid[row][col] === 1;
      const mult = isMine ? 0 : towerMultiplier(row + 1);
      result = { type: "tower", grid: grid, row: row, col: col, isMine: isMine, mult: mult };
    }
    
    const paid = result.mult > 0 ? r2(stake * result.mult) : 0;
    const tx = (cfg.type === "keno" ? "KN" : "TW") + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
    
    let balance = d.balance;
    if (paid > 0) {
      const w = await db.post(u.id, "WIN", paid, cfg.type + " win " + cfg.name + " " + tx);
      if (w.ok) balance = w.balance;
    }
    
    return NextResponse.json({ ok: true, result: result, paid: paid, tx: tx, rtp: rtp, balance: balance, stake: stake });
  } catch (e) {
    console.error("kb2 instant2", e);
    return bad("Server error", 500);
  }
}