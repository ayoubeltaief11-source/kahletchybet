import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { td } from "@/lib/td-store";
import { kbById } from "@/lib/kb/catalog";
import { resolveRtp } from "@/lib/kb/rtp";
import * as E from "@/lib/kb/engine";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const rid = (p: string): string => p + Date.now().toString().slice(-7) + Math.floor(Math.random() * 900 + 100);
const bad = (m: string, c?: number) => NextResponse.json({ ok: false, error: m }, { status: c || 400 });
const r2 = (n: number): number => Math.round(n * 100) / 100;
interface Store { uid: string; gid: string; stake: number; cp?: number; mines?: number; bombs?: number[]; opened?: number[]; cur?: number; mult?: number; done: number; }
const MEM = new Map<string, string>();
async function load(id: string): Promise<Store | null> {
  let raw: string | null = MEM.get(id) || null;
  try { const p = await td.kbRoundGet("kb_" + id); if (p) raw = p; } catch (e) { /* memory fallback */ }
  return raw ? JSON.parse(raw) as Store : null;
}
async function save(id: string, s: Store) {
  const raw = JSON.stringify(s);
  MEM.set(id, raw);
  if (MEM.size > 4000) { const first = MEM.keys().next().value; if (first) MEM.delete(first); }
  try { await td.kbRoundPut("kb_" + id, raw); } catch (e) { /* memory fallback */ }
}
export async function POST(req: Request) {
  try {
    const u = await currentUser();
    if (!u) return bad("Sign in to play", 401);
    const b = await req.json();
    const g = kbById(String(b.gameId || ""));
    if (!g) return bad("Unknown game", 404);
    const ov = await td.kbRtp();
    const rtp = resolveRtp(g.family, ov);
    const mode = String(b.mode || "");
    const stake = r2(Number(b.stake));
    const tag = g.name + " [" + g.variant + "] rtp" + (rtp * 100).toFixed(1);
    const debit = async (label: string) => {
      if (!isFinite(stake) || stake < 1) return { err: "Minimum stake is 1 TD" };
      if (stake > u.balance) return { err: "Insufficient TD balance" };
      const d = await db.post(u.id, "BET", stake, label + " - " + tag);
      if (!d.ok) return { err: d.msg };
      return { bal: d.balance };
    };
    const credit = async (amt: number, label: string) => {
      if (amt <= 0) return null;
      const w = await db.post(u.id, "WIN", r2(amt), label + " - " + tag);
      return w.ok ? w.balance : null;
    };
    if (mode === "crash-start") {
      const d = await debit("Crash stake"); if (d.err) return bad(d.err);
      const round = rid("R"), cp = E.crashPoint(rtp);
      await save(round, { uid: u.id, gid: g.id, stake: stake, cp: cp, done: 0 });
      return NextResponse.json({ ok: true, roundId: round, crashAt: cp, balance: d.bal });
    }
    if (mode === "crash-cash" || mode === "crash-bust") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round already settled", 409);
      st.done = 1; await save(round, st);
      if (mode === "crash-bust") return NextResponse.json({ ok: true, paid: 0, bust: true });
      const m = r2(Number(b.mult));
      if (!isFinite(m) || m < 1 || m > (st.cp || 1)) return bad("Cashout above crash point");
      const paid = r2(st.stake * m);
      const bal = await credit(paid, "Crash cashout " + m.toFixed(2) + "x " + round);
      return NextResponse.json({ ok: true, paid: paid, mult: m, balance: bal });
    }
    if (mode === "spin") {
      const d = await debit("Spin stake"); if (d.err) return bad(d.err);
      const o = E.spin(g, rtp);
      const paid = r2(stake * o.mult), tx = rid("S");
      const bal = paid > 0 ? await credit(paid, "Spin " + o.mult.toFixed(2) + "x " + tx) : null;
      return NextResponse.json({ ok: true, grid: o.grid, rows: o.rows, hits: o.hits, mult: o.mult, ways: o.ways, tier: o.tier, paid: paid, tx: tx, balance: bal === null ? d.bal : bal });
    }
    if (mode === "roulette") {
      const d = await debit("Roulette stake"); if (d.err) return bad(d.err);
      const bets = (b.bets || {}) as Record<string, number>;
      const sum = Object.keys(bets).reduce((a, k) => a + (Number(bets[k]) || 0), 0);
      if (Math.abs(sum - stake) > 0.01) return bad("Stake mismatch");
      const n = E.wheelPick(), paid = E.roulette(bets, n), tx = rid("W");
      const bal = paid > 0 ? await credit(paid, "Roulette " + n + " " + tx) : null;
      return NextResponse.json({ ok: true, number: n, paid: paid, tx: tx, balance: bal === null ? d.bal : bal });
    }
    if (mode === "mines-start") {
      const d = await debit("Mines stake"); if (d.err) return bad(d.err);
      const m = Math.max(1, Math.min(24, Math.floor(Number(b.mines) || 3)));
      const round = rid("M");
      await save(round, { uid: u.id, gid: g.id, stake: stake, mines: m, bombs: E.minesLayout(m), opened: [], done: 0 });
      return NextResponse.json({ ok: true, roundId: round, next: E.minesMultiplier(m, 1, rtp), balance: d.bal });
    }
    if (mode === "mines-pick") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round finished", 409);
      const cell = Math.floor(Number(b.cell));
      const opened = st.opened || [], bombs = st.bombs || [], mines = st.mines || 3;
      if (cell < 0 || cell > 24 || opened.indexOf(cell) >= 0) return bad("Invalid cell");
      if (bombs.indexOf(cell) >= 0) {
        st.done = 1; await save(round, st);
        return NextResponse.json({ ok: true, boom: true, bombs: bombs });
      }
      opened.push(cell); st.opened = opened;
      const mult = E.minesMultiplier(mines, opened.length, rtp);
      const next = E.minesMultiplier(mines, opened.length + 1, rtp);
      await save(round, st);
      return NextResponse.json({ ok: true, boom: false, mult: mult, next: next, opened: opened.length });
    }
    if (mode === "mines-cash") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round finished", 409);
      const opened = (st.opened || []).length;
      if (opened === 0) return bad("Open at least one cell");
      st.done = 1; await save(round, st);
      const mult = E.minesMultiplier(st.mines || 3, opened, rtp);
      const paid = r2(st.stake * mult), tx = rid("MC");
      const bal = await credit(paid, "Mines cashout " + mult.toFixed(2) + "x " + tx);
      return NextResponse.json({ ok: true, paid: paid, mult: mult, tx: tx, bombs: st.bombs, balance: bal });
    }
    if (mode === "dice") {
      const d = await debit("Dice stake"); if (d.err) return bad(d.err);
      const target = Math.max(2, Math.min(98, Number(b.target) || 50));
      const over = Boolean(b.over);
      const roll = E.diceRoll();
      const win = over ? roll > target : roll < target;
      const mult = E.diceMultiplier(target, over, rtp);
      const paid = win ? r2(stake * mult) : 0, tx = rid("D");
      const bal = paid > 0 ? await credit(paid, "Dice " + mult.toFixed(2) + "x " + tx) : null;
      return NextResponse.json({ ok: true, roll: roll, mult: mult, paid: paid, tx: tx, balance: bal === null ? d.bal : bal });
    }
    if (mode === "plinko-table") {
      const risk = String(b.risk || "medium");
      return NextResponse.json({ ok: true, table: E.plinkoTable(risk, rtp) });
    }
    if (mode === "plinko") {
      const d = await debit("Plinko stake"); if (d.err) return bad(d.err);
      const risk = String(b.risk || "medium");
      const table = E.plinkoTable(risk, rtp);
      const drop = E.plinkoDrop();
      const mult = table[drop.bucket] || 0;
      const paid = r2(stake * mult), tx = rid("P");
      const bal = paid > 0 ? await credit(paid, "Plinko " + mult.toFixed(2) + "x " + tx) : null;
      return NextResponse.json({ ok: true, bucket: drop.bucket, path: drop.path, mult: mult, paid: paid, tx: tx, balance: bal === null ? d.bal : bal });
    }
    if (mode === "hilo-start") {
      const d = await debit("HiLo stake"); if (d.err) return bad(d.err);
      const card = E.hiloCard(), round = rid("H");
      await save(round, { uid: u.id, gid: g.id, stake: stake, cur: card, mult: 1, done: 0 });
      return NextResponse.json({ ok: true, roundId: round, card: card, hi: { m: E.hiloMultiplier(card, true, rtp), p: E.hiloChance(card, true) }, lo: { m: E.hiloMultiplier(card, false, rtp), p: E.hiloChance(card, false) }, balance: d.bal });
    }
    if (mode === "hilo-step") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round finished", 409);
      const higher = Boolean(b.higher);
      const cur = st.cur || 8;
      const p = E.hiloChance(cur, higher);
      if (p <= 0) return bad("No possible outcome that direction");
      const next = E.hiloCard();
      const ok2 = higher ? next > cur : next < cur;
      if (!ok2) { st.done = 1; st.cur = next; await save(round, st); return NextResponse.json({ ok: true, boom: true, card: next }); }
      const mult = r2((st.mult || 1) * E.hiloMultiplier(cur, higher, rtp));
      st.cur = next; st.mult = mult; await save(round, st);
      return NextResponse.json({ ok: true, boom: false, card: next, mult: mult, hi: { m: E.hiloMultiplier(next, true, rtp), p: E.hiloChance(next, true) }, lo: { m: E.hiloMultiplier(next, false, rtp), p: E.hiloChance(next, false) } });
    }
    if (mode === "hilo-cash") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round finished", 409);
      const mult = st.mult || 1;
      if (mult <= 1) return bad("Make at least one call");
      st.done = 1; await save(round, st);
      const paid = r2(st.stake * mult), tx = rid("HC");
      const bal = await credit(paid, "HiLo cashout " + mult.toFixed(2) + "x " + tx);
      return NextResponse.json({ ok: true, paid: paid, mult: mult, tx: tx, balance: bal });
    }
    if (mode === "table-deal") {
      const d = await debit("Table stake"); if (d.err) return bad(d.err);
      const round = rid("T");
      if (g.variant === "blackjack") {
        const deal = E.blackjackDeal();
        await save(round, { uid: u.id, gid: g.id, stake: stake, opened: deal.p, bombs: deal.d, done: 0 });
        return NextResponse.json({ ok: true, roundId: round, forceDone: false, balance: d.bal });
      }
      const side = String(b.side || "player");
      let paid = 0, msg = "", a = 0, bb = 0; const dice: number[] = [];
      if (g.variant === "baccarat") {
        const rr = E.baccarat(); a = rr.a; bb = rr.b;
        const winner = a > bb ? "player" : bb > a ? "banker" : "tie";
        msg = winner === "tie" ? "Tie " + a + "-" + bb : (winner === "player" ? "Player" : "Banker") + " wins " + a + "-" + bb;
        if (side === winner) paid = side === "tie" ? r2(stake * 9) : side === "banker" ? r2(stake * 1.95) : r2(stake * 2);
        else if (winner === "tie" && side !== "tie") paid = stake;
      } else {
        const dd = E.sicboRoll(); dice.push(dd[0], dd[1], dd[2]);
        a = dd[0] + dd[1] + dd[2];
        const triple = dd[0] === dd[1] && dd[1] === dd[2];
        const big = a >= 11 && a <= 17, small = a >= 4 && a <= 10;
        msg = "Total " + a + (triple ? " - triple" : big ? " - BIG" : small ? " - SMALL" : "");
        if (!triple && ((side === "big" && big) || (side === "small" && small))) paid = r2(stake * 2 * rtp / 0.9722);
      }
      const tx = rid("T");
      const bal = paid > 0 ? await credit(paid, msg + " " + tx) : null;
      return NextResponse.json({ ok: true, paid: paid, msg: msg, a: a, b: bb, dice: dice, tx: tx, roundId: round, balance: bal === null ? d.bal : bal });
    }
    if (mode === "table-settle") {
      const round = String(b.roundId || ""); const st = await load(round);
      if (!st || st.uid !== u.id) return bad("Round not found", 404);
      if (st.done === 1) return bad("Round already settled", 409);
      st.done = 1; await save(round, st);
      const req2 = r2(Number(b.paid));
      const cap = r2(st.stake * 2.5);
      const paid = Math.max(0, Math.min(cap, isFinite(req2) ? req2 : 0));
      const tx = rid("B");
      const bal = paid > 0 ? await credit(paid, "Blackjack " + tx) : null;
      return NextResponse.json({ ok: true, paid: paid, tx: tx, balance: bal });
    }
    return bad("Unknown mode");
  } catch (e) { console.error("kb round", e); return bad("Server error", 500); }
}
