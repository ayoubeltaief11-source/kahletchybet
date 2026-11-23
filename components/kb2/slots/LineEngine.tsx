"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { REELS, LINES3, LINES4, PAY, TIER_OF, lineBySlug } from "@/lib/kb2/lineMath";
import type { SpinResult, LineWin } from "@/lib/kb2/lineMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";
import { LineSym, LineMascot } from "./LineSym";
import { ReelStrip } from "@/src/kb3/slots/ReelStrip";
import type { ReelStripHandle } from "@/src/kb3/slots/ReelStrip";
import { sfx } from "@/src/kb3/audio/sfx";

interface Auto { left: number; stopWin: number; stopLoss: number; onFeature: boolean; }

export default function LineEngine({ slug }: { slug: string }) {
  const cfg = lineBySlug(slug);
  const rows = cfg.rows;
  const lines = rows === 4 ? LINES4 : LINES3;
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [grid, setGrid] = useState<number[]>(function () { return Array.from({ length: REELS * rows }, function (_, i) { return i % 8; }); });
  const [lit, setLit] = useState<number[]>([]);
  const [activeLine, setActiveLine] = useState(-1);
  const [expand, setExpand] = useState(-1);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [pay, setPay] = useState(false);
  const [win, setWin] = useState<{ amt: number; mult: number; tx: string; tier: number } | null>(null);
  const [freeLeft, setFreeLeft] = useState(0);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freeMult, setFreeMult] = useState(1);
  const [lastWins, setLastWins] = useState<LineWin[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0, onFeature: true });
  const [autoPanel, setAutoPanel] = useState(false);
  const [err, setErr] = useState("");
  const [coins, setCoins] = useState<number[]>([]);
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(ReelStripHandle | null)[]>([]);
  const [reelDone, setReelDone] = useState(0);
  const useStrip = slug === "neon-cherry-rush";
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const stakeRef = useRef(stake);
  const startBal = useRef(0);
  autoRef.current = auto;
  stakeRef.current = stake;

  useEffect(function () {
    try { if (window.localStorage.getItem("k6_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const showWins = useCallback(async function (wins: LineWin[], turbo: boolean) {
    if (wins.length === 0) { setLit([]); setActiveLine(-1); return; }
    const all: number[] = [];
    wins.forEach(function (w) { w.cells.forEach(function (c) { if (all.indexOf(c) < 0) all.push(c); }); });
    setLit(all);
    getAudio().win();
    const el = boardRef.current;
    if (el) {
      const t = all.map(function (i) { return el.querySelector('[data-c="' + i + '"]'); }).filter(Boolean);
      if (t.length > 0) gsap.to(t, { scale: 1.14, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    const cycle = Math.min(wins.length, turbo ? 2 : 5);
    for (let i = 0; i < cycle; i++) {
      setActiveLine(wins[i].line);
      await new Promise(function (r) { window.setTimeout(r, turbo ? 170 : 380); });
    }
    setActiveLine(-1);
  }, []);

  const playRound = useCallback(async function (r: SpinResult, turbo: boolean) {
    setLit([]); setActiveLine(-1); setExpand(-1);
    setGrid(r.grid.slice());
    const el = boardRef.current;
    if (el) {
      const cells = el.querySelectorAll("[data-c]");
      gsap.fromTo(cells, { y: -40, opacity: 0.25 }, { y: 0, opacity: 1, duration: turbo ? 0.2 : 0.4, stagger: { each: 0.014, from: "start" }, ease: "back.out(1.4)" });
    }
    if (useStrip) {
      sfx.spinStart();
      setReelDone(0);
      const colsArr = [];
      for (let c = 0; c < REELS; c++) colsArr.push(r.grid.slice(c * rows, c * rows + rows));
      const anticipate = (r.scatters || []).some(function (idx) { return idx < rows * 2; });
      await Promise.all(colsArr.map(function (col, ci) {
        const h = reelRefs.current[ci];
        if (!h) return Promise.resolve();
        return new Promise(function (res) { window.setTimeout(function () { h.spin(col, ci, { turbo: turbo, anticipate: anticipate && ci >= 2 }).then(res); }, ci * (turbo ? 60 : 150)); });
      }));
      sfx.spinStop();
    } else {
      getAudio().reel();
      const el = boardRef.current;
      if (el) { const cells = el.querySelectorAll("[data-c]"); gsap.fromTo(cells, { y: -40, opacity: 0.25 }, { y: 0, opacity: 1, duration: turbo ? 0.2 : 0.4, stagger: { each: 0.014, from: "start" }, ease: "back.out(1.4)" }); }
      await new Promise(function (res) { window.setTimeout(res, turbo ? 240 : 520); });
    }
    if (r.expandCol >= 0) {
      setExpand(r.expandCol);
      getAudio().scatter();
      await new Promise(function (res) { window.setTimeout(res, turbo ? 260 : 620); });
    }
    if (r.scatters.length > 0) {
      setLit(r.scatters);
      getAudio().big();
      await new Promise(function (res) { window.setTimeout(res, 800); });
    }
    setLastWins(r.wins);
    setFreeMult(r.freeMult);
    await showWins(r.wins, turbo);
  }, [showWins]);
  const spin = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    const st = stakeRef.current;
    if (st < 1) { setErr("Minimum stake is 1 TD"); getAudio().warn(); return; }
    if (st > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); return; }
    setErr(""); setWin(null); setLastWins([]); setFreeMult(1);
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    let d: { ok: boolean; error?: string; rounds: SpinResult[]; totalMult: number; paid: number; tx: string; freeSpins: number };
    try {
      const r = await fetch("/api/kb2/lines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: st }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Spin rejected"); getAudio().warn(); return; }
    refresh();
    setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + st, won: s.won + d.paid }; });
    await playRound(d.rounds[0], prefs.turbo);
    if (d.freeSpins > 0) {
      setFreeTotal(0);
      toast("FREE SPINS AWARDED: " + d.freeSpins, "j");
      let acc = 0;
      for (let i = 1; i < d.rounds.length; i++) {
        setFreeLeft(d.rounds.length - i);
        await playRound(d.rounds[i], prefs.turbo);
        acc += d.rounds[i].totalMult;
        setFreeTotal(Math.round(acc * 100) / 100);
      }
      setFreeLeft(0);
    }
    if (d.paid > 0) {
      const tier = d.totalMult >= 50 ? 3 : d.totalMult >= 15 ? 2 : d.totalMult >= 3 ? 1 : 0;
      setWin({ amt: d.paid, mult: d.totalMult, tx: d.tx, tier: tier });
      if (tier >= 2) {
        getAudio().mega();
        setCoins(Array.from({ length: 32 }, function (_, i) { return i; }));
        window.setTimeout(function () { setCoins([]); }, 2600);
        const el = boardRef.current;
        if (el) gsap.fromTo(el, { x: -7 }, { x: 0, duration: 0.55, ease: "elastic.out(1,0.3)" });
      }
      toast("WIN " + fmt(d.paid) + "  " + d.totalMult.toFixed(2) + "x  " + d.tx, "j");
      window.setTimeout(function () { setWin(null); }, tier >= 2 ? 3200 : 1900);
    } else { getAudio().lose(); }
    refresh();
    busyRef.current = false; setBusy(false);
    const a = autoRef.current;
    if (a.left > 0) {
      const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
      const stopLoss = a.stopLoss > 0 && (startBal.current - (me.balance - st + d.paid)) >= a.stopLoss;
      const stopFeat = a.onFeature && d.freeSpins > 0;
      const next = a.left - 1;
      if (stopWin || stopLoss || stopFeat || next <= 0) {
        setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        if (stopWin) toast("Autoplay stopped: win limit reached", "g");
        if (stopLoss) toast("Autoplay stopped: loss limit reached", "g");
        if (stopFeat) toast("Autoplay stopped: free spins triggered", "g");
      } else {
        setAuto(function (o) { return Object.assign({}, o, { left: next }); });
        window.setTimeout(function () { void spin(); }, prefs.turbo ? 300 : 760);
      }
    }
  }, [me, cfg.slug, refresh, toast, playRound, prefs.turbo]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void spin();
  }, [me, spin]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("k6_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  const cols: number[][] = [];
  for (let c = 0; c < REELS; c++) cols.push(grid.slice(c * rows, c * rows + rows));
  const path = activeLine >= 0 ? lines[activeLine] : null;

  return (
    <div className="k6" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="k6-top">
        <Link href="/casino" className="k6-back">Lobby</Link>
        <span className="k6-demo">DEMO - no real money</span>
        <b className="k6-title">{cfg.name}</b>
        <span className="k6-linecount">{lines.length} LINES</span>
        <div className="k6-sp"/>
        <div className="k6-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"k6-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"k6-ico" + (prefs.turbo ? " on" : "")} onClick={function () { update({ turbo: !prefs.turbo }); }}>TURBO</button>
        <button className="k6-ico" onClick={function () { setPay(true); }}>PAYS</button>
      </div>

      <div className="k6-body">
        <div className="k6-stage" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="k6-rays"/>
          <div className="k6-mascot"><LineMascot hue={cfg.accent} hue2={cfg.accent2}/></div>
          <div className="k6-frame" style={{ borderColor: cfg.frame }}>
            <span className="k6-cn tl"/><span className="k6-cn tr"/><span className="k6-cn bl"/><span className="k6-cn br"/>
            <div className="k6-banner">WIN UP TO {cfg.maxWin} YOUR BET</div>
            {freeLeft > 0 && <div className="k6-free">FREE SPINS <b>{freeLeft}</b><em>x{freeMult} multiplier</em><span>won {freeTotal.toFixed(2)}x</span></div>}
            <div className="k6-board" ref={boardRef}>
              {cols.map(function (col, ci) {
                return (
                  useStrip ? (
                    <ReelStrip key={ci} ref={function (h) { reelRefs.current[ci] = h; }} gameId={slug} rows={rows} initial={col} />
                  ) : (
                  <div key={ci} className={"k6-reel" + (expand === ci ? " expanding" : "")}>
                    {col.map(function (k, ri) {
                      const i = ci * rows + ri;
                      const on = lit.indexOf(i) >= 0;
                      const onPath = path ? path[ci] === ri : false;
                      return (
                        <div key={ri} data-c={i} className={"k6-cell" + (on ? " lit" : "") + (onPath ? " path" : "")}>
                          <LineSym k={k} set={cfg.set} size={54}/>
                        </div>
                      );
                    })}
                  </div>
                  )
                );
              })}
              {path && (
                <svg className="k6-pathsvg" viewBox={"0 0 " + (REELS * 100) + " " + (rows * 100)} preserveAspectRatio="none">
                  <polyline points={path.map(function (r, c) { return (c * 100 + 50) + "," + (r * 100 + 50); }).join(" ")} fill="none" stroke={cfg.accent2} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                </svg>
              )}
            </div>
            {lastWins.length > 0 && (
              <div className="k6-winlist">
                {lastWins.slice(0, 5).map(function (w, i) {
                  return <span key={i} className={activeLine === w.line ? "on" : ""}>L{w.line + 1} - {w.count}x <b>{w.mult.toFixed(2)}x</b></span>;
                })}
              </div>
            )}
            {coins.length > 0 && <div className="k6-coins">{coins.map(function (i) { return <i key={i} style={{ left: (i * 3.1 % 100) + "%", animationDelay: (i * 0.055) + "s" }}/>; })}</div>}
            {win && (
              <div className={"k6-big t" + win.tier}>
                <b>{win.tier >= 3 ? "MEGA WIN" : win.tier >= 2 ? "BIG WIN" : "WIN"}</b>
                <strong>{fmt(win.amt)}</strong>
                <span>{win.mult.toFixed(2)}x</span>
                <em>{win.tx}</em>
              </div>
            )}
          </div>
          <div className="k6-vol">
            <span>VOLATILITY</span>
            <div className="k6-vbar">{[0,1,2,3,4].map(function (i) { return <i key={i} className={i < (cfg.vol === "High" ? 5 : cfg.vol === "Medium" ? 3 : 2) ? "on" : ""}/>; })}</div>
            <em>{cfg.vol}</em>
          </div>
        </div>

        <aside className="k6-panel">
          <div className="k6-field">
            <label>BET (TD)</label>
            <div className="k6-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="k6-quick">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          <button className="k6-spin" disabled={busy || !me} onClick={function () { stopAuto(); void spin(); }}><span>{busy ? "..." : "SPIN"}</span></button>
          {auto.left > 0 ? <button className="k6-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="k6-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          <div className="k6-stats">
            <div><span>Spins</span><b>{session.spins}</b></div>
            <div><span>Staked</span><b>{fmt(session.bet)}</b></div>
            <div><span>Returned</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won)}</b></div>
            <div><span>Net</span><b className={session.won - session.bet >= 0 ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          {err && <div className="k6-err">{err}</div>}
          <p className="k6-note">Three or more matching symbols from the left on any of {lines.length} lines pay. The golden shield is wild and substitutes for every symbol except the star. Three stars award {10} free spins with a rising multiplier and expanding reels. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="k6-modal">
          <div className="k6-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <LineMascot hue={cfg.accent} hue2={cfg.accent2} size={148}/>
            <h2>{cfg.name}</h2>
            <p className="k6-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="k6-ivol">{cfg.vol} VOLATILITY - {lines.length} LINES</span>
            <label className="k6-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="k6-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {pay && (
        <div className="k6-modal" onClick={function () { setPay(false); }}>
          <div className="k6-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Paytable</h3>
            <div className="k6-paytab">
              <div className="k6-payhead"><span>Symbol</span><span>3</span><span>4</span><span>5</span></div>
              {[0,1,2,3,4,5,6,7].map(function (k) {
                const t = TIER_OF[k] ?? 0;
                return (
                  <div key={k} className="k6-payrow">
                    <span><LineSym k={k} set={cfg.set} size={30}/></span>
                    <b>{(PAY[t][3] / lines.length).toFixed(2)}x</b>
                    <b>{(PAY[t][4] / lines.length).toFixed(2)}x</b>
                    <b>{(PAY[t][5] / lines.length).toFixed(2)}x</b>
                  </div>
                );
              })}
            </div>
            <p>Values shown are multiples of your total bet per winning line. Wild substitutes for all symbols except the star scatter. During free spins each consecutive win raises the multiplier through x1, x2, x3 and x5, and a high symbol can expand to fill its whole reel.</p>
            <button className="k6-close" onClick={function () { setPay(false); }}>CLOSE</button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="k6-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="k6-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="k6-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="k6-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k6-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k6-check"><input type="checkbox" checked={auto.onFeature} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { onFeature: e.target.checked }); }); }}/><span>Stop when free spins trigger</span></label>
            <button className="k6-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}