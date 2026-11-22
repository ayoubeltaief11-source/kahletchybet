import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { resolveRtp } from "@/lib/kb/rtp";
import { stateAt, seedHash, roundHash, SLOT_MS, EPOCH } from "@/lib/kb2/crashLoop";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEM = new Map<string, string>();
const bad = (m: string, c?: number) => NextResponse.json({ ok: false, error: m }, { status: c || 400 });
const r2 = (n: number) => Math.round(n * 100) / 100;

interface Entry { uid: string; index: number; stake: number; auto: number; done: number; paid: number; }

async function put(key: string, v: Entry) {
  const raw = JSON.stringify(v);
  MEM.set(key, raw);
  if (MEM.size > 6000) { const f = MEM.keys().next().value; if (f) MEM.delete(f); }
  try { await td.kbRoundPut(key, raw); } catch (e) { /* memory fallback */ }
}
async function get(key: string): Promise<Entry | null> {
  let raw: string | null = MEM.get(key) || null;
  try { const p = await td.kbRoundGet(key); if (p) raw = p; } catch (e) { /* memory fallback */ }
  return raw ? JSON.parse(raw) as Entry : null;
}

async function rtpNow(): Promise<number> {
  try { return resolveRtp("crash", await td.kbRtp()); } catch (e) { return 0.97; }
}

export async function GET() {
  const rtp = await rtpNow();
  const now = Date.now();
  const s = stateAt(now, rtp);
  return NextResponse.json({
    ok: true, now: now, rtp: rtp, slotMs: SLOT_MS, epoch: EPOCH,
    seedHash: seedHash(), roundHash: roundHash(s.index),
    index: s.index, phase: s.phase, crashAt: s.phase === "crashed" ? s.crashAt : null
  });
}

export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) return bad("Sign in to play", 401);
    const b = await req.json();
    const mode = String(b.mode || "");
    const rtp = await rtpNow();
    const now = Date.now();
    const s = stateAt(now, rtp);
    const panel = Math.max(0, Math.min(1, Math.floor(Number(b.panel) || 0)));

    if (mode === "bet") {
      const stake = r2(Number(b.stake));
      if (!isFinite(stake) || stake < 1) return bad("Minimum stake is 1 TD");
      if (stake > u.balance) return bad("Insufficient TD balance");
      const queued = s.phase !== "betting";
      const target = queued ? s.index + 1 : s.index;
      const key = "kbc_" + u.id + "_" + target + "_" + panel;
      const exist = await get(key);
      if (exist) return bad("This panel already has a bet on that round");
      const d = await db.post(u.id, "BET", stake, "Crash live bet R" + target + " P" + (panel + 1));
      if (!d.ok) return bad(d.msg);
      const auto = Number(b.auto);
      await put(key, { uid: u.id, index: target, stake: stake, auto: isFinite(auto) && auto >= 1.01 ? r2(auto) : 0, done: 0, paid: 0 });
      return NextResponse.json({ ok: true, queued: queued, index: target, balance: d.balance });
    }

    if (mode === "cash") {
      const target = s.index;
      const key = "kbc_" + u.id + "_" + target + "_" + panel;
      const e = await get(key);
      if (!e) return bad("No active bet in this round", 404);
      if (e.uid !== u.id) return bad("Bet owner mismatch", 403);
      if (e.done === 1) return bad("Already settled", 409);
      if (s.phase !== "flying") return bad("Round is not flying");
      const claimed = r2(Number(b.mult));
      if (!isFinite(claimed) || claimed < 1) return bad("Invalid multiplier");
      if (claimed > s.crashAt) return bad("Cashout above crash point");
      const paid = r2(e.stake * claimed);
      e.done = 1; e.paid = paid;
      await put(key, e);
      const w = await db.post(u.id, "WIN", paid, "Crash live cashout " + claimed.toFixed(2) + "x R" + target + " P" + (panel + 1));
      if (!w.ok) return bad(w.msg);
      return NextResponse.json({ ok: true, paid: paid, mult: claimed, tx: "CL" + target + "P" + panel + Date.now().toString().slice(-5), balance: w.balance });
    }

    if (mode === "status") {
      const cur = await get("kbc_" + u.id + "_" + s.index + "_" + panel);
      const nxt = await get("kbc_" + u.id + "_" + (s.index + 1) + "_" + panel);
      if (cur && cur.done === 0 && s.phase === "crashed") { cur.done = 1; cur.paid = 0; await put("kbc_" + u.id + "_" + s.index + "_" + panel, cur); }
      return NextResponse.json({ ok: true, current: cur, next: nxt });
    }

    return bad("Unknown mode");
  } catch (e) {
    console.error("kb2 crash", e);
    return bad("Server error", 500);
  }
}
