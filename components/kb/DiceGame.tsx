"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf, PACE_NAME } from "@/lib/kb/sig";
import { useKbAudio } from "./audio";

interface Log { v: number; win: boolean; m: number; id: string; }
export default function DiceGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const sg = sigOf(g.id);
  const [stake, setStake] = useState(5);
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [busy, setBusy] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const [res, setRes] = useState<{ win: boolean; paid: number; tx: string; m: number } | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const [auto, setAuto] = useState(0);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const iv = useRef<number>(0);
  const autoRef = useRef(0);
  const busyRef = useRef(false);
  useEffect(function () { return function () { if (iv.current) clearInterval(iv.current); autoRef.current = 0; }; }, []);

  const chance = over ? (100 - target) / 100 : target / 100;
  const mult = chance > 0.0001 ? Math.round((rtp / chance) * 100) / 100 : 0;

  const play = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    if (!isFinite(stake) || stake < 1) { setErr("Minimum stake is 1 TD"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    setErr(""); busyRef.current = true; setBusy(true); setRes(null); au.dice();
    let d: { ok: boolean; error?: string; roll: number; paid: number; mult: number; tx: string };
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "dice", stake: stake, target: target, over: over }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); autoRef.current = 0; setAuto(0); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Round rejected"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    refresh();
    const fast = sg.pace === 2;
    let n = 0;
    iv.current = window.setInterval(function () {
      n++; const rv = Math.round(Math.random() * 10000) / 100;
      setShown(rv); setRoll(rv); au.reel();
      if (n > (fast ? 7 : 14)) {
        clearInterval(iv.current); iv.current = 0;
        setShown(d.roll); setRoll(d.roll);
        const win = d.paid > 0;
        setRes({ win: win, paid: d.paid, tx: d.tx, m: d.mult });
        setLog(function (l) { return [{ v: d.roll, win: win, m: d.mult, id: d.tx }].concat(l).slice(0, 14); });
        busyRef.current = false; setBusy(false);
        if (win) { if (d.mult >= 8) au.big(); else au.win(); toast(d.roll.toFixed(2) + " - WIN " + fmt(d.paid) + "  ID " + d.tx, "j"); }
        else { au.lose(); setShake(true); setTimeout(function () { setShake(false); }, 320); toast(d.roll.toFixed(2) + " - no win  ID " + d.tx, "e"); }
        refresh();
        if (autoRef.current > 0) {
          autoRef.current -= 1; setAuto(autoRef.current);
          if (autoRef.current > 0) setTimeout(function () { void play(); }, fast ? 260 : 620);
        }
      }
    }, fast ? 42 : 62);
  }, [me, stake, target, over, g.id, sg.pace, au, toast, refresh]);

  const startAuto = useCallback(function (n: number) { if (busyRef.current) return; autoRef.current = n; setAuto(n); void play(); }, [play]);
  const stopAuto = useCallback(function () { autoRef.current = 0; setAuto(0); }, []);

  const winW = over ? 100 - target : target;
  return (
    <div className={"kbd" + (shake ? " kb-shake" : "")} style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - {PACE_NAME[sg.pace]} - multiplier = RTP / chance</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbd-body">
        <div className="kbd-stage" style={{ background: "radial-gradient(95% 85% at 50% 0%," + g.sky[1] + "70, transparent 66%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbx-stars"/>
          <div className={"kbd-roll" + (res ? (res.win ? " win" : " lose") : "")}>{shown.toFixed(2)}</div>
          {res && <div className={"kbd-verdict " + (res.win ? "win" : "lose")}>{res.win ? "WIN " + res.m.toFixed(2) + "x" : "MISS"}<em>{res.win ? "+" + fmt(res.paid) : "-" + fmt(stake)} - ID {res.tx}</em></div>}
          <div className="kbd-track">
            <div className="kbd-zone lose" style={{ width: (100 - winW) + "%" }}><span>{(100 - winW).toFixed(0)}%</span></div>
            <div className="kbd-zone win" style={{ width: winW + "%" }}><span>{winW.toFixed(0)}%</span></div>
            <div className="kbd-handle" style={{ left: target + "%" }}><b>{target}</b></div>
            {roll !== null && <div className={"kbd-mark" + (res && res.win ? " win" : " lose")} style={{ left: Math.min(99.5, Math.max(0.5, roll)) + "%" }}><i/></div>}
          </div>
          <input className="kbd-slider" type="range" min={2} max={98} step={1} value={target} disabled={busy} onChange={function (e) { setTarget(Number(e.target.value)); au.click(); }}/>
          <div className="kbd-switch">
            <button className={!over ? "on" : ""} disabled={busy} onClick={function () { au.click(); setOver(false); }}>ROLL UNDER</button>
            <button className={over ? "on" : ""} disabled={busy} onClick={function () { au.click(); setOver(true); }}>ROLL OVER</button>
          </div>
          <div className="kbd-stats">
            <div><span>Multiplier</span><b>{mult.toFixed(2)}x</b></div>
            <div><span>Win chance</span><b>{(chance * 100).toFixed(2)}%</b></div>
            <div><span>Payout</span><b>{fmt(stake * mult)}</b></div>
          </div>
          {log.length > 0 && <div className="kbd-hist">{log.map(function (h, i) { return <span key={i} className={h.win ? "up" : "dn"} title={h.id}>{h.v.toFixed(2)}</span>; })}</div>}
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}<button disabled={busy} onClick={function () { au.chip(); setStake(Math.max(1, Math.floor(me ? me.balance : 1))); }}>MAX</button></div>
          <div className="kbd-quick">{[10,25,50,75,90].map(function (t) { return <button key={t} className={target === t ? "on" : ""} disabled={busy} onClick={function () { au.click(); setTarget(t); }}>{t}</button>; })}</div>
          <button className="kbx-play" disabled={busy || !me} onClick={function () { stopAuto(); void play(); }}>{busy ? "ROLLING" : "ROLL DICE"}</button>
          <div className="kbs-auto">{auto > 0 ? <button className="kbs-stop" onClick={stopAuto}>STOP AUTO ({auto})</button> : [10,25,50].map(function (x) { return <button key={x} disabled={busy || !me} onClick={function () { startAuto(x); }}>AUTO {x}</button>; })}</div>
          {err && <div className="kbx-err">{err}</div>}
          <p className="kbx-note">A 50/50 roll pays 1.94x, not 2x. The missing 0.06x is the house edge made visible.</p>
        </aside>
      </div>
    </div>
  );
}
