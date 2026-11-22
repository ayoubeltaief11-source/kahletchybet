"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { COLS, ROWS, LINES, PAY, TIER_OF, NAMES, classicBySlug } from "@/lib/kb2/classicMath";
import type { ClassicResult, LineWin } from "@/lib/kb2/classicMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function Fruit({ k, size = 76 }: { k: number; size?: number }) {
  const uid = "fr" + k;
  const defs = (
    <defs>
      <linearGradient id={uid} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#fffdf6"/><stop offset="50%" stopColor={["#ef3b52","#f0b429","#e8b33c","#8290ad","#ff4757","#22d3ee"][k]}/><stop offset="100%" stopColor="#1a0a10"/></linearGradient>
      <radialGradient id={uid + "h"} cx="0.32" cy="0.26"><stop offset="0%" stopColor="#fff" stopOpacity="0.9"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
    </defs>
  );
  const F = "url(#" + uid + ")";
  const H = "url(#" + uid + "h)";
  if (k === 0) return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<path d="M32 10c6 8 14 12 18 22" stroke="#2fa85f" strokeWidth="3.4" fill="none" strokeLinecap="round"/><path d="M32 10c-6 8-14 12-18 22" stroke="#2fa85f" strokeWidth="3.4" fill="none" strokeLinecap="round"/><path d="M32 10c6-5 12-4 16-1-4 5-10 6-16 1Z" fill="#3fcf5f"/><circle cx="16" cy="44" r="13" fill={F} stroke="#5a0a14" strokeWidth="1.6"/><circle cx="48" cy="44" r="13" fill={F} stroke="#5a0a14" strokeWidth="1.6"/><circle cx="12" cy="39" r="4" fill={H}/><circle cx="44" cy="39" r="4" fill={H}/></svg>);
  if (k === 1) return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<ellipse cx="32" cy="34" rx="24" ry="18" fill={F} stroke="#7a6205" strokeWidth="1.7"/><path d="M56 34c4-2 6-5 6-8" stroke="#7a6205" strokeWidth="3.4" fill="none" strokeLinecap="round"/><ellipse cx="23" cy="27" rx="8" ry="4.6" fill={H}/><path d="M12 34h40" stroke="#7a6205" strokeWidth="1" opacity="0.35"/></svg>);
  if (k === 2) return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<path d="M32 8c-12 0-19 10-19 24 0 8-3 12-6 16h50c-3-4-6-8-6-16 0-14-7-24-19-24Z" fill={F} stroke="#7a5104" strokeWidth="1.8"/><circle cx="32" cy="53" r="6.5" fill="#7a5104"/><path d="M25 17c-5 5-8 11-8 19" stroke="#fff" strokeWidth="3.4" opacity="0.55" fill="none" strokeLinecap="round"/><rect x="28" y="3" width="8" height="6" rx="3" fill="#7a5104"/></svg>);
  if (k === 3) return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<rect x="5" y="17" width="54" height="30" rx="7" fill={F} stroke="#2a3050" strokeWidth="1.9"/><text x="32" y="39" textAnchor="middle" fontSize="17" fontWeight="900" fontFamily="Arial" fill="#fff" letterSpacing="1">BAR</text><rect x="9" y="21" width="46" height="8" rx="4" fill="#fff" opacity="0.24"/></svg>);
  if (k === 4) return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<rect x="5" y="5" width="54" height="54" rx="13" fill={F} stroke="#6e0000" strokeWidth="1.9"/><text x="32" y="47" textAnchor="middle" fontSize="40" fontWeight="900" fontFamily="Arial" fill="#fff" stroke="#6e0000" strokeWidth="1.4">7</text><path d="M11 14c4-4 9-6 14-6" stroke="#fff" strokeWidth="3" opacity="0.45" fill="none" strokeLinecap="round"/></svg>);
  return (<svg width={size} height={size} viewBox="0 0 64 64">{defs}<path d="M32 4 56 22 32 60 8 22Z" fill={F} stroke="#0a5a72" strokeWidth="1.8"/><path d="M32 4 56 22H8Z" fill="#fff" opacity="0.32"/><path d="M8 22h48L32 60Z" fill="#000" opacity="0.14"/><path d="M32 4 21 22l11 38 11-38Z" fill="#fff" opacity="0.2"/><circle cx="24" cy="17" r="5" fill={H}/></svg>);
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function ClassicEngine({ slug }: { slug: string }) {
  const cfg = classicBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [grid, setGrid] = useState<number[]>([0,1,2,3,4,5,2,3,1]);
  const [lit, setLit] = useState<number[]>([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [pay, setPay] = useState(false);
  const [wins, setWins] = useState<LineWin[]>([]);
  const [win, setWin] = useState<{ amt: number; mult: number; tx: string; tier: number; full: boolean } | null>(null);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [err, setErr] = useState("");
  const [coins, setCoins] = useState<number[]>([]);
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const stakeRef = useRef(stake);
  const startBal = useRef(0);
  autoRef.current = auto;
  stakeRef.current = stake;

  useEffect(function () {
    try { if (window.localStorage.getItem("ka_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const spin = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    const st = stakeRef.current;
    if (st < 1) { setErr("Minimum stake is 1 TD"); getAudio().warn(); return; }
    if (st > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); return; }
    setErr(""); setWin(null); setWins([]); setLit([]); setActiveLine(-1);
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    let d: { ok: boolean; error?: string; result: ClassicResult; paid: number; totalMult: number; tx: string };
    try {
      const r = await fetch("/api/kb2/classic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: st }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Spin rejected"); getAudio().warn(); return; }
    refresh();
    setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + st, won: s.won + d.paid }; });
    const el = boardRef.current;
    let f = 0;
    const roll = window.setInterval(function () {
      f++;
      getAudio().reel();
      setGrid(Array.from({ length: 9 }, function () { return Math.floor(Math.random() * 6); }));
      if (f >= (prefs.turbo ? 6 : 13)) {
        clearInterval(roll);
        setGrid(d.result.grid.slice());
        if (el) {
          const cells = el.querySelectorAll("[data-f]");
          gsap.fromTo(cells, { y: -30, opacity: 0.3 }, { y: 0, opacity: 1, duration: prefs.turbo ? 0.2 : 0.36, stagger: { each: 0.05, from: "start" }, ease: "back.out(2)" });
        }
        void finish(d);
      }
    }, prefs.turbo ? 60 : 90);
  }, [me, cfg.slug, refresh, prefs.turbo]);

  const finish = useCallback(async function (d: { result: ClassicResult; paid: number; totalMult: number; tx: string }) {
    const st = stakeRef.current;
    setWins(d.result.wins);
    if (d.result.wins.length > 0) {
      const all: number[] = [];
      d.result.wins.forEach(function (w) { w.cells.forEach(function (cc) { if (all.indexOf(cc) < 0) all.push(cc); }); });
      setLit(all);
      const cycle = Math.min(d.result.wins.length, prefs.turbo ? 2 : 5);
      for (let i = 0; i < cycle; i++) {
        setActiveLine(d.result.wins[i].line);
        getAudio().tick(2 + i);
        await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 190 : 420); });
      }
      setActiveLine(-1);
    }
    if (d.paid > 0) {
      const tier = d.result.full ? 3 : d.totalMult >= 15 ? 2 : d.totalMult >= 4 ? 1 : 0;
      setWin({ amt: d.paid, mult: d.totalMult, tx: d.tx, tier: tier, full: d.result.full });
      if (tier >= 2) {
        getAudio().mega();
        setCoins(Array.from({ length: 32 }, function (_, i) { return i; }));
        window.setTimeout(function () { setCoins([]); }, 2600);
        const el = boardRef.current;
        if (el) gsap.fromTo(el, { x: -9 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
      } else { getAudio().win(); }
      toast((d.result.full ? "FULL SCREEN " : "WIN ") + fmt(d.paid) + "  " + d.totalMult.toFixed(2) + "x  " + d.tx, "j");
      window.setTimeout(function () { setWin(null); }, tier >= 2 ? 3300 : 1900);
    } else { getAudio().lose(); }
    refresh();
    busyRef.current = false; setBusy(false);
    const a = autoRef.current;
    if (a.left > 0) {
      const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
      const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - st + d.paid)) >= a.stopLoss;
      const next = a.left - 1;
      if (stopWin || stopLoss || next <= 0) {
        setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        if (stopWin) toast("Autoplay stopped: win limit reached", "g");
        if (stopLoss) toast("Autoplay stopped: loss limit reached", "g");
      } else {
        setAuto(function (o) { return Object.assign({}, o, { left: next }); });
        window.setTimeout(function () { void spin(); }, prefs.turbo ? 320 : 780);
      }
    }
  }, [prefs.turbo, me, refresh, toast, spin]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void spin();
  }, [me, spin]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("ka_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);

  const cols: number[][] = [];
  for (let c = 0; c < COLS; c++) cols.push(grid.slice(c * ROWS, c * ROWS + ROWS));
  const path = activeLine >= 0 ? LINES[activeLine] : null;
  return (
    <div className="ka" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="ka-top">
        <Link href="/casino" className="ka-back">Lobby</Link>
        <span className="ka-demo">DEMO - no real money</span>
        <b className="ka-title">{cfg.name}</b>
        <span className="ka-lc">5 LINES</span>
        <div className="ka-sp"/>
        <div className="ka-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"ka-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"ka-ico" + (prefs.turbo ? " on" : "")} onClick={function () { update({ turbo: !prefs.turbo }); }}>TURBO</button>
        <button className="ka-ico" onClick={function () { setPay(true); }}>PAYS</button>
      </div>

      <div className="ka-body">
        <div className="ka-stage" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="ka-rays"/>
          <div className="ka-frame" style={{ borderColor: cfg.frame }}>
            <span className="ka-cn tl"/><span className="ka-cn tr"/><span className="ka-cn bl"/><span className="ka-cn br"/>
            <div className="ka-banner">WIN UP TO {cfg.maxWin} YOUR BET</div>
            <div className="ka-board" ref={boardRef}>
              {cols.map(function (col, ci) {
                return (
                  <div key={ci} className="ka-reel">
                    {col.map(function (k, ri) {
                      const i = ci * ROWS + ri;
                      return (
                        <div key={ri} data-f={i} className={"ka-cell" + (lit.indexOf(i) >= 0 ? " lit" : "")}>
                          <Fruit k={k} size={72}/>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {path && (
                <svg className="ka-pathsvg" viewBox="0 0 300 300" preserveAspectRatio="none">
                  <polyline points={path.map(function (r, c) { return (c * 100 + 50) + "," + (r * 100 + 50); }).join(" ")} fill="none" stroke={cfg.accent2} strokeWidth="6" strokeLinecap="round" opacity="0.92"/>
                </svg>
              )}
            </div>
            {wins.length > 0 && (
              <div className="ka-winlist">
                {wins.map(function (w, i) { return <span key={i} className={activeLine === w.line ? "on" : ""}>L{w.line + 1} {NAMES[w.symbol]} <b>{w.mult.toFixed(2)}x</b></span>; })}
              </div>
            )}
            {coins.length > 0 && <div className="ka-coins">{coins.map(function (i) { return <i key={i} style={{ left: (i * 3.1 % 100) + "%", animationDelay: (i * 0.055) + "s" }}/>; })}</div>}
            {win && (
              <div className={"ka-big t" + win.tier}>
                <b>{win.full ? "FULL SCREEN" : win.tier >= 2 ? "BIG WIN" : "WIN"}</b>
                <strong>{fmt(win.amt)}</strong>
                <span>{win.mult.toFixed(2)}x</span>
                <em>{win.tx}</em>
              </div>
            )}
          </div>
          <div className="ka-vol">
            <span>VOLATILITY</span>
            <div className="ka-vbar">{[0,1,2,3,4].map(function (i) { return <i key={i} className={i < (cfg.vol === "High" ? 5 : cfg.vol === "Medium" ? 3 : 2) ? "on" : ""}/>; })}</div>
            <em>{cfg.vol}</em>
          </div>
        </div>

        <aside className="ka-panel">
          <div className="ka-field">
            <label>BET (TD)</label>
            <div className="ka-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="ka-quick">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          <button className="ka-spin" disabled={busy || !me} onClick={function () { stopAuto(); void spin(); }}><span>{busy ? "..." : "SPIN"}</span></button>
          {auto.left > 0 ? <button className="ka-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="ka-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          <div className="ka-stats">
            <div><span>Spins</span><b>{session.spins}</b></div>
            <div><span>Staked</span><b>{fmt(session.bet)}</b></div>
            <div><span>Returned</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won)}</b></div>
            <div><span>Net</span><b className={session.won - session.bet >= 0 ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          {err && <div className="ka-err">{err}</div>}
          <p className="ka-note">Three matching symbols on any of the five lines pay. Fill all nine positions with the same symbol for the full screen award of 500x. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="ka-modal">
          <div className="ka-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="ka-introreels">{[4,2,5].map(function (k, i) { return <div key={i}><Fruit k={k} size={64}/></div>; })}</div>
            <h2>{cfg.name}</h2>
            <p className="ka-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="ka-ivol">{cfg.vol} VOLATILITY - 3 REELS - 5 LINES</span>
            <label className="ka-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="ka-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {pay && (
        <div className="ka-modal" onClick={function () { setPay(false); }}>
          <div className="ka-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Paytable</h3>
            <div className="ka-paytab">
              {[0,1,2,3,4,5].map(function (k) {
                const t = TIER_OF[k] ?? 0;
                return (
                  <div key={k} className="ka-payrow">
                    <span><Fruit k={k} size={34}/></span>
                    <em>{NAMES[k]}</em>
                    <b>{(PAY[t] / LINES.length).toFixed(2)}x per line</b>
                  </div>
                );
              })}
            </div>
            <p>Values are multiples of your total bet for one winning line. Five lines are active on every spin: three across and two diagonals. Nine identical symbols anywhere on the screen award the full screen prize of 500x instead of the line total.</p>
            <button className="ka-close" onClick={function () { setPay(false); }}>CLOSE</button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="ka-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="ka-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="ka-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="ka-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="ka-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="ka-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}