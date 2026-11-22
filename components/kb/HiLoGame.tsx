"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf, FRAME_NAME } from "@/lib/kb/sig";
import { useKbAudio } from "./audio";

const label = (v: number): string => v === 14 ? "A" : v === 13 ? "K" : v === 12 ? "Q" : v === 11 ? "J" : String(v);
const SUITS = ["S","H","D","C"];
const glyph = (s: string): string => s === "S" ? "\u2660" : s === "H" ? "\u2665" : s === "D" ? "\u2666" : "\u2663";
interface Odds { m: number; p: number; }
export default function HiLoGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const sg = sigOf(g.id);
  const [stake, setStake] = useState(5);
  const [live, setLive] = useState(false);
  const [rid, setRid] = useState("");
  const [cur, setCur] = useState(8);
  const [suit, setSuit] = useState("S");
  const [chain, setChain] = useState<{ v: number; s: string; ok: boolean }[]>([]);
  const [mult, setMult] = useState(1);
  const [hi, setHi] = useState<Odds>({ m: 1, p: 0 });
  const [lo, setLo] = useState<Odds>({ m: 1, p: 0 });
  const [dead, setDead] = useState(false);
  const [cashed, setCashed] = useState<{ paid: number; tx: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [flip, setFlip] = useState(false);
  const [shake, setShake] = useState(false);
  const [glow, setGlow] = useState(false);
  const busyRef = useRef(false);
  useEffect(function () { busyRef.current = busy; }, [busy]);

  const start = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); au.warn(); return; }
    if (!isFinite(stake) || stake < 1) { setErr("Minimum stake is 1 TD"); au.warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); au.warn(); return; }
    setErr(""); setBusy(true); setDead(false); setCashed(null); setChain([]); setMult(1); au.card();
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "hilo-start", stake: stake }) });
      const d = await r.json();
      setBusy(false);
      if (!d.ok) { setErr(d.error || "Round rejected"); au.warn(); return; }
      setRid(d.roundId); setCur(d.card); setSuit(SUITS[d.card % 4]); setHi(d.hi); setLo(d.lo); setLive(true); refresh();
    } catch (e) { setBusy(false); setErr("Network error - try again"); }
  }, [me, stake, g.id, au, refresh]);

  const guess = useCallback(async function (higher: boolean) {
    if (!live || busyRef.current) return;
    setBusy(true); setErr(""); au.card();
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "hilo-step", roundId: rid, higher: higher }) });
      const d = await r.json();
      if (!d.ok) { setBusy(false); setErr(d.error || "Step rejected"); au.warn(); return; }
      setFlip(true);
      setTimeout(function () {
        setCur(d.card); setSuit(SUITS[d.card % 4]); setFlip(false);
        if (d.boom) {
          setChain(function (c) { return c.concat([{ v: d.card, s: SUITS[d.card % 4], ok: false }]); });
          setDead(true); setLive(false); setBusy(false); au.bust();
          setShake(true); setTimeout(function () { setShake(false); }, 340);
          toast("Wrong call - lost " + fmt(stake) + "  ID " + rid, "e"); refresh(); return;
        }
        setChain(function (c) { return c.concat([{ v: d.card, s: SUITS[d.card % 4], ok: true }]); });
        setMult(d.mult); setHi(d.hi); setLo(d.lo); setBusy(false);
        au.chain(chain.length + 1);
        setGlow(true); setTimeout(function () { setGlow(false); }, 620);
      }, 240);
    } catch (e) { setBusy(false); setErr("Network error - try again"); }
  }, [live, g.id, rid, stake, chain.length, au, toast, refresh]);

  const cash = useCallback(async function () {
    if (!live || busyRef.current || chain.length === 0) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "hilo-cash", roundId: rid }) });
      const d = await r.json(); setBusy(false);
      if (!d.ok) { setErr(d.error || "Cashout rejected"); au.warn(); return; }
      setCashed({ paid: d.paid, tx: d.tx }); setLive(false); au.cash();
      setGlow(true); setTimeout(function () { setGlow(false); }, 900);
      toast("CASHED " + mult.toFixed(2) + "x  +" + fmt(d.paid) + "  ID " + d.tx, "j"); refresh();
    } catch (e) { setBusy(false); setErr("Network error - try again"); }
  }, [live, chain.length, g.id, rid, mult, au, toast, refresh]);

  const red = suit === "H" || suit === "D";
  const steps = chain.filter(function (c) { return c.ok; }).length;
  return (
    <div className={"kbh f" + sg.frame + (shake ? " kb-shake" : "") + (glow ? " kb-glow" : "")} style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - {FRAME_NAME[sg.frame]} - step odds = RTP / probability</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbh-body">
        <div className="kbh-stage" style={{ background: "radial-gradient(95% 85% at 50% 0%," + g.sky[1] + "70, transparent 66%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbx-stars"/>
          <div className="kbh-ladder">
            {Array.from({ length: 8 }).map(function (_, i) {
              const c = chain[i];
              return <div key={i} className={"kbh-rung" + (c ? (c.ok ? " ok" : " bad") : "") + (i === steps && live ? " next" : "")}>{c ? label(c.v) : i + 1}</div>;
            })}
          </div>
          <div className="kbh-table">
            <div className={"kbh-card" + (flip ? " flip" : "") + (dead ? " dead" : "") + (red ? " red" : "")}>
              <b>{label(cur)}</b><i>{glyph(suit)}</i><u>{label(cur)}</u>
            </div>
            <div className="kbh-side">
              <div className="kbh-mult">{mult.toFixed(2)}<i>x</i></div>
              <div className="kbh-pot">{fmt(stake * mult)}</div>
              <div className="kbh-odds">
                <div className="up"><span>HIGHER</span><b>{hi.m.toFixed(2)}x</b><em>{(hi.p * 100).toFixed(1)}%</em></div>
                <div className="dn"><span>LOWER</span><b>{lo.m.toFixed(2)}x</b><em>{(lo.p * 100).toFixed(1)}%</em></div>
              </div>
            </div>
          </div>
          {dead && <div className="kbh-tag lose">WRONG CALL - Round {rid}</div>}
          {cashed && <div className="kbh-tag win"><b>+{fmt(cashed.paid)}</b><span>{mult.toFixed(2)}x - {steps} steps</span><em>CASHOUT ID {cashed.tx}</em></div>}
          {!live && !dead && !cashed && <div className="kbh-tag idle">Stake and start the ladder</div>}
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={live || busy} onClick={function () { au.click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={live || busy} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={live || busy} onClick={function () { au.click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={live || busy} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}</div>
          {live && (
            <div className="kbh-guess">
              <button className="up" disabled={busy || hi.p <= 0} onClick={function () { void guess(true); }}>HIGHER<i>{hi.m.toFixed(2)}x</i></button>
              <button className="dn" disabled={busy || lo.p <= 0} onClick={function () { void guess(false); }}>LOWER<i>{lo.m.toFixed(2)}x</i></button>
            </div>
          )}
          {!live
            ? <button className="kbx-play" disabled={busy || !me} onClick={start}>{busy ? "DEALING" : "START LADDER"}</button>
            : <button className="kbx-cashbtn" disabled={busy || chain.length === 0} onClick={cash}>CASH OUT<b>{fmt(stake * mult)}</b><i>@ {mult.toFixed(2)}x</i></button>}
          {err && <div className="kbx-err">{err}</div>}
          <p className="kbx-note">Each correct call multiplies the ladder by RTP / chance. An ace cannot go higher, a two cannot go lower.</p>
        </aside>
      </div>
    </div>
  );
}
