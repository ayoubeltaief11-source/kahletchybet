"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { diceBySlug, diceProbability, diceMultiplier, limboProbability } from "@/lib/kb2/diceMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function DiceEngine({ slug }: { slug: string }) {
  const cfg = diceBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(50);
  const [over, setOver] = useState(true);
  const [targetMult, setTargetMult] = useState(2);
  const [busy, setBusy] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [win, setWin] = useState(false);
  const [mult, setMult] = useState(0);
  const [actualMult, setActualMult] = useState(0);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<{ roll: number; win: boolean; mult: number }[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const displayRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("kd_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const chance = cfg.type === "dice" ? diceProbability(target, over) : limboProbability(targetMult, 0.97);
  const currentMult = cfg.type === "dice" ? diceMultiplier(target, over, 0.97) : targetMult;
  const potentialWin = r2(stake * currentMult);

  const play = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    if (cfg.type === "dice" && (target < 2 || target > 98)) { setErr("Target must be 2-98"); getAudio().warn(); return; }
    if (cfg.type === "limbo" && targetMult < 1.01) { setErr("Multiplier must be >= 1.01"); getAudio().warn(); return; }
    setErr(""); setRoll(null); setWin(false); setMult(0); setActualMult(0); setLastPaid(0); setLastTx("");
    busyRef.current = true; setBusy(true);
    getAudio().dice();
    if (startBal.current === 0) startBal.current = me.balance;
    
    let rtp = 0.97;
    try { const rr = await fetch("/api/kb/rtp", { cache: "no-store" }); const dd = await rr.json(); if (dd.ok && dd.live) rtp = dd.live.instant || 0.97; } catch (e) { /* ignore */ }
    
    const body: Record<string, unknown> = { slug: cfg.slug, stake: stake };
    if (cfg.type === "dice") { body.target = target; body.over = over; }
    else { body.targetMult = targetMult; }
    
    try {
      const r = await fetch("/api/kb2/dice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Roll rejected"); getAudio().warn(); return; }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won + d.paid }; });
      
      if (displayRef.current) {
        const el = displayRef.current;
        gsap.fromTo(el, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
      }
      
      setRoll(d.roll);
      setWin(d.win);
      setMult(d.mult);
      setActualMult(d.actualMult);
      setLastPaid(d.paid);
      setLastTx(d.tx);
      setHistory(function (h) { return [{ roll: d.roll, win: d.win, mult: d.actualMult }].concat(h).slice(0, 20); });
      
      if (d.win) {
        if (d.actualMult >= 50) { getAudio().mega(); toast("MEGA WIN " + fmt(d.paid) + " at " + d.actualMult.toFixed(2) + "x", "j"); }
        else if (d.actualMult >= 5) { getAudio().big(); toast("BIG WIN " + fmt(d.paid) + " at " + d.actualMult.toFixed(2) + "x", "j"); }
        else { getAudio().win(); toast("WIN " + fmt(d.paid) + " at " + d.actualMult.toFixed(2) + "x", "j"); }
      } else {
        getAudio().lose();
        toast("Roll " + d.roll + " - no win", "e");
      }
      
      refresh();
      busyRef.current = false; setBusy(false);
      
      const a = autoRef.current;
      if (a.left > 0) {
        const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
        const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - stake + d.paid)) >= a.stopLoss;
        const next = a.left - 1;
        if (stopWin || stopLoss || next <= 0) {
          setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        } else {
          setAuto(function (o) { return Object.assign({}, o, { left: next }); });
          window.setTimeout(function () { void play(); }, 800);
        }
      }
    } catch (e) {
      busyRef.current = false; setBusy(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, cfg.type, stake, target, over, targetMult, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void play();
  }, [me, play]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("kd_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  return (
    <div className="kd" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="kd-top">
        <Link href="/casino" className="kd-back">Lobby</Link>
        <span className="kd-demo">DEMO - no real money</span>
        <b className="kd-title">{cfg.name}</b>
        <div className="kd-sp"/>
        <div className="kd-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"kd-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="kd-body">
        <div className="kd-stage" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="kd-rays"/>
          
          <div className="kd-display" ref={displayRef}>
            {roll !== null && (
              <>
                <div className={"kd-roll " + (win ? "win" : "lose")}>{roll.toFixed(2)}</div>
                {cfg.type === "limbo" && win && <div className="kd-actual">{actualMult.toFixed(2)}x</div>}
              </>
            )}
            {roll === null && <div className="kd-roll idle">0.00</div>}
          </div>

          {cfg.type === "dice" && (
            <div className="kd-bar">
              <div className="kd-zone lose" style={{ width: (over ? target : 100 - target) + "%" }}><span>{(over ? target : 100 - target).toFixed(0)}%</span></div>
              <div className="kd-zone win" style={{ width: (over ? 100 - target : target) + "%" }}><span>{(over ? 100 - target : target).toFixed(0)}%</span></div>
              <div className="kd-handle" style={{ left: target + "%" }}><b>{target}</b></div>
              {roll !== null && <div className={"kd-mark " + (win ? "win" : "lose")} style={{ left: Math.min(99.5, Math.max(0.5, roll)) + "%" }}><i/></div>}
            </div>
          )}

          {cfg.type === "dice" && (
            <input className="kd-slider" type="range" min={2} max={98} step={1} value={target} disabled={busy} onChange={function (e) { setTarget(Number(e.target.value)); getAudio().click(); }}/>
          )}

          {cfg.type === "dice" && (
            <div className="kd-switch">
              <button className={!over ? "on" : ""} disabled={busy} onClick={function () { setOver(false); getAudio().click(); }}>ROLL UNDER</button>
              <button className={over ? "on" : ""} disabled={busy} onClick={function () { setOver(true); getAudio().click(); }}>ROLL OVER</button>
            </div>
          )}

          <div className="kd-stats">
            <div><span>Multiplier</span><b>{currentMult.toFixed(2)}x</b></div>
            <div><span>Win chance</span><b>{(chance * 100).toFixed(2)}%</b></div>
            <div><span>Payout</span><b>{fmt(potentialWin)} TD</b></div>
          </div>

          {history.length > 0 && (
            <div className="kd-history">
              {history.slice(0, 12).map(function (h, i) { return <span key={i} className={h.win ? "up" : "dn"} title={h.mult.toFixed(2) + "x"}>{h.roll.toFixed(2)}</span>; })}
            </div>
          )}

          {lastPaid > 0 && <div className="kd-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
        </div>

        <aside className="kd-panel">
          {cfg.type === "limbo" && (
            <div className="kd-field">
              <label>TARGET MULTIPLIER</label>
              <div className="kd-stake">
                <button disabled={busy} onClick={function () { getAudio().click(); setTargetMult(function (v) { return Math.max(1.01, r2(v - 0.1)); }); }}>-</button>
                <input type="number" min={1.01} step={0.01} value={targetMult} disabled={busy} onChange={function (e) { setTargetMult(Math.max(1.01, Number(e.target.value) || 1.01)); }}/>
                <button disabled={busy} onClick={function () { getAudio().click(); setTargetMult(function (v) { return r2(v + 0.1); }); }}>+</button>
              </div>
            </div>
          )}

          <div className="kd-field">
            <label>BET (TD)</label>
            <div className="kd-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>

          <div className="kd-quick">{[5, 10, 25, 50, 100].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>

          {cfg.type === "dice" && (
            <div className="kd-quick-target">{[10, 25, 50, 75, 90].map(function (t) { return <button key={t} className={target === t ? "on" : ""} disabled={busy} onClick={function () { setTarget(t); getAudio().click(); }}>{t}</button>; })}</div>
          )}

          <button className="kd-roll" disabled={busy || !me} onClick={play}>{busy ? "ROLLING..." : cfg.type === "dice" ? "ROLL DICE" : "ROLL LIMBO"}</button>

          {auto.left > 0 ? <button className="kd-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="kd-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="kd-stats-small">
            <div><span>Rolls</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="kd-err">{err}</div>}
          <p className="kd-note">{cfg.type === "dice" ? "A 50/50 roll pays 1.94x, not 2x. The missing 0.06x is the house edge made visible." : "The higher your target multiplier, the lower your win probability. RTP stays constant at ~97%."} TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="kd-modal">
          <div className="kd-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="kd-introdisplay">
              <div className="kd-introroll">0.00</div>
            </div>
            <h2>{cfg.name}</h2>
            <p className="kd-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="kd-ivol">{cfg.type === "dice" ? "OVER/UNDER" : "TARGET MULTIPLIER"} - RTP 97%</span>
            <label className="kd-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="kd-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="kd-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="kd-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="kd-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} ROLLS</button>; })}</div>
            <label className="kd-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="kd-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="kd-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function r2(n: number): number { return Math.round(n * 100) / 100; }