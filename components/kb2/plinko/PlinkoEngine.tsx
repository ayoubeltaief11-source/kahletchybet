"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { plinkoBySlug, generateMultipliers, ROWS, BUCKETS } from "@/lib/kb2/plinkoMath";
import type { PlinkoResult } from "@/lib/kb2/plinkoMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function PlinkoEngine({ slug }: { slug: string }) {
  const cfg = plinkoBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [stake, setStake] = useState(10);
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState<PlinkoResult | null>(null);
  const [multipliers, setMultipliers] = useState<number[]>([]);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<{ mult: number; bucket: number }[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    let rtp = 0.97;
    try { fetch("/api/kb/rtp", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) { if (d.ok && d.live) rtp = d.live.instant || 0.97; }).catch(function () { /* ignore */ }); } catch (e) { /* ignore */ }
    setMultipliers(generateMultipliers(cfg.risk, rtp));
    try { if (window.localStorage.getItem("kp_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug, cfg.risk]);

  const drawBoard = useCallback(function () {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    const pegSpacing = w / (ROWS + 2);
    const pegRadius = 4;
    
    ctx.clearRect(0, 0, w, h);
    
    for (let row = 0; row < ROWS; row++) {
      const y = 60 + row * ((h - 140) / ROWS);
      const pegsInRow = row + 3;
      const startX = (w - (pegsInRow - 1) * pegSpacing) / 2;
      for (let i = 0; i < pegsInRow; i++) {
        const x = startX + i * pegSpacing;
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();
      }
    }
  }, []);

  useEffect(function () {
    drawBoard();
    window.addEventListener("resize", drawBoard);
    return function () { window.removeEventListener("resize", drawBoard); };
  }, [drawBoard]);

  const drop = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setResult(null); setLastPaid(0); setLastTx("");
    busyRef.current = true; setDropping(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    
    try {
      const r = await fetch("/api/kb2/plinko", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: stake }) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setDropping(false); setErr(d.error || "Drop rejected"); getAudio().warn(); return; }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won + d.result.paid }; });
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const ballRadius = 8;
          let x = w / 2;
          let y = 30;
          
          const path = d.result.path || [];
          const pegSpacing = w / (16 + 2);
          const rowHeight = (h - 140) / 16;
          const waypoints = [{ x: x, y: 30 }];
          let cx = x;
          for (let r = 0; r < 16; r++) {
            const dir = r < path.length ? path[r] : (Math.random() < 0.5 ? 0 : 1);
            cx += (dir === 0 ? -1 : 1) * pegSpacing * 0.5;
            cx = Math.max(30, Math.min(w - 30, cx));
            waypoints.push({ x: cx, y: 60 + r * rowHeight + rowHeight * 0.5 });
          }
          const bucketWidth = w / 17;
          const finalX = 15 + d.result.bucket * bucketWidth + bucketWidth / 2;
          waypoints.push({ x: finalX, y: h - 80 });

          let step = 0;
          const anim = { x: waypoints[0].x, y: waypoints[0].y };
          const stepDuration = 0.14;
          const tl = gsap.timeline({
            onComplete: function () {
              setResult(d.result);
              setLastPaid(d.result.paid);
              setLastTx(d.tx);
              setHistory(function (h) { return [{ mult: d.result.multiplier, bucket: d.result.bucket }].concat(h).slice(0, 20); });
              if (d.result.paid > 0) {
                if (d.result.multiplier >= 10) { getAudio().mega(); toast("MEGA WIN " + fmt(d.result.paid) + " at " + d.result.multiplier.toFixed(2) + "x", "j"); }
                else if (d.result.multiplier >= 2) { getAudio().big(); toast("WIN " + fmt(d.result.paid) + " at " + d.result.multiplier.toFixed(2) + "x", "j"); }
                else { getAudio().win(); toast("WIN " + fmt(d.result.paid) + " at " + d.result.multiplier.toFixed(2) + "x", "j"); }
              } else {
                getAudio().lose();
                toast("Landed on " + d.result.multiplier.toFixed(2) + "x", "e");
              }
              refresh();
              busyRef.current = false;
              setDropping(false);
              const a = autoRef.current;
              if (a.left > 0) {
                const stopWin = a.stopWin > 0 && d.result.paid >= a.stopWin;
                const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - stake + d.result.paid)) >= a.stopLoss;
                const next = a.left - 1;
                if (stopWin || stopLoss || next <= 0) { setAuto(function (o) { return Object.assign({}, o, { left: 0 }); }); }
                else { setAuto(function (o) { return Object.assign({}, o, { left: next }); }); window.setTimeout(function () { void drop(); }, 1500); }
              }
            }
          });
          for (let i = 1; i < waypoints.length; i++) {
            tl.to(anim, { x: waypoints[i].x, y: waypoints[i].y, duration: stepDuration, ease: i === waypoints.length - 1 ? "power2.out" : "power1.inOut",
              onUpdate: function () {
                drawBoard();
                ctx.beginPath();
                ctx.arc(anim.x, anim.y, ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = cfg.accent;
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }, i * stepDuration);
          }
        }
      }
    } catch (e) {
      busyRef.current = false; setDropping(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, stake, refresh, toast, drawBoard]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void drop();
  }, [me, drop]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("kp_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  return (
    <div className="kp" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="kp-top">
        <Link href="/casino" className="kp-back">Lobby</Link>
        <span className="kp-demo">DEMO - no real money</span>
        <b className="kp-title">{cfg.name}</b>
        <div className="kp-sp"/>
        <div className="kp-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"kp-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="kp-body">
        <div className="kp-table" style={{ background: cfg.felt }}>
          <div className="kp-rays"/>
          
          <canvas ref={canvasRef} width={600} height={500} className="kp-canvas"/>

          <div className="kp-buckets">
            {multipliers.map(function (m, i) {
              const intensity = Math.abs(i - BUCKETS / 2) / (BUCKETS / 2);
              const hue = cfg.risk === "high" ? 0 : cfg.risk === "medium" ? 45 : 120;
              const lightness = 30 + intensity * 40;
              return (
                <div
                  key={i}
                  className={"kp-bucket" + (result && result.bucket === i ? " hit" : "")}
                  style={{ background: "hsl(" + hue + ", 70%, " + lightness + "%)" }}
                >
                  <span>{m.toFixed(1)}x</span>
                </div>
              );
            })}
          </div>

          {result && (
            <div className="kp-result">
              <b>{result.multiplier.toFixed(2)}x</b>
              <span>Bucket {result.bucket}</span>
            </div>
          )}
          {!result && !dropping && <span className="kp-msg">DROP THE BALL</span>}
          {dropping && <span className="kp-msg dropping">DROPPING...</span>}
          {lastPaid > 0 && <div className="kp-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
        </div>

        <aside className="kp-panel">
          <div className="kp-field">
            <label>BET (TD)</label>
            <div className="kp-stake">
              <button disabled={dropping} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={dropping} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={dropping} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>

          <div className="kp-quick">{[5, 10, 25, 50, 100].map(function (v) { return <button key={v} disabled={dropping} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>

          <button className="kp-drop" disabled={dropping || !me} onClick={drop}>{dropping ? "DROPPING..." : "DROP BALL"}</button>

          {auto.left > 0 ? <button className="kp-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="kp-auto" disabled={dropping || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="kp-history">
            <span>LAST DROPS</span>
            {history.slice(0, 8).map(function (h, i) { return <b key={i} className={h.mult >= 2 ? "win" : "lose"}>{h.mult.toFixed(1)}x</b>; })}
          </div>

          <div className="kp-stats">
            <div><span>Drops</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="kp-err">{err}</div>}
          <p className="kp-note">The ball follows a binomial distribution: middle buckets are most likely but pay less, edge buckets are rare but pay big. Risk level changes the multiplier spread. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="kp-modal">
          <div className="kp-intro" style={{ background: cfg.felt }}>
            <div className="kp-introboard">
              <div className="kp-intropeg"/>
              <div className="kp-intropeg"/>
              <div className="kp-intropeg"/>
            </div>
            <h2>{cfg.name}</h2>
            <p className="kp-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="kp-ivol">16 ROWS - {BUCKETS} BUCKETS - {cfg.risk.toUpperCase()} RISK</span>
            <label className="kp-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="kp-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="kp-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="kp-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="kp-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} DROPS</button>; })}</div>
            <label className="kp-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="kp-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="kp-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}