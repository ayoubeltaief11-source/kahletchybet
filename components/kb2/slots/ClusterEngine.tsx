"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { COLS, ROWS, CELLS, slotBySlug } from "@/lib/kb2/slotMath";
import type { SpinResult } from "@/lib/kb2/slotMath";
import { PAYTABLE } from "@/lib/kb2/slotMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";
import Sym, { Mascot } from "./Sym";

interface Props { slug: string; }
interface Auto { left: number; stopWin: number; stopLoss: number; onFeature: boolean; }

export default function ClusterEngine({ slug }: Props) {
  const cfg = slotBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [grid, setGrid] = useState<number[]>(function () { return Array.from({ length: CELLS }, function (_, i) { return i % 8; }); });
  const [hits, setHits] = useState<number[]>([]);
  const [bombs, setBombs] = useState<{ cell: number; value: number }[]>([]);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [pay, setPay] = useState(false);
  const [win, setWin] = useState<{ amt: number; mult: number; tx: string; tier: number } | null>(null);
  const [freeLeft, setFreeLeft] = useState(0);
  const [freeTotal, setFreeTotal] = useState(0);
  const [stepMult, setStepMult] = useState(0);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0, onFeature: true });
  const [autoPanel, setAutoPanel] = useState(false);
  const [err, setErr] = useState("");
  const [coins, setCoins] = useState<number[]>([]);
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef<Auto>(auto);
  const stakeRef = useRef(stake);
  const startBal = useRef(0);
  autoRef.current = auto;
  stakeRef.current = stake;

  useEffect(function () {
    try { if (window.localStorage.getItem("k5_hide_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const paint = useCallback(function (g: number[]) { setGrid(g.slice()); }, []);

  const animateStep = useCallback(async function (before: number[], cells: number[], after: number[], mult: number) {
    paint(before);
    setHits(cells);
    setStepMult(mult);
    getAudio().tumble();
    const el = boardRef.current;
    if (el) {
      const targets = cells.map(function (i) { return el.querySelector('[data-cell="' + i + '"]'); }).filter(Boolean);
      if (targets.length > 0) gsap.to(targets, { scale: 1.18, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 220 : 460); });
    setHits([]);
    paint(after);
    if (el) {
      const drop = cells.map(function (i) { return el.querySelector('[data-cell="' + i + '"]'); }).filter(Boolean);
      if (drop.length > 0) gsap.fromTo(drop, { y: -34, opacity: 0.2 }, { y: 0, opacity: 1, duration: prefs.turbo ? 0.18 : 0.34, stagger: 0.02, ease: "bounce.out" });
    }
    await new Promise(function (r) { window.setTimeout(r, prefs.turbo ? 130 : 260); });
  }, [paint, prefs.turbo]);

  const runRound = useCallback(async function (r: SpinResult) {
    if (r.steps.length === 0) { paint(r.grid); setStepMult(0); }
    for (const s of r.steps) { await animateStep(s.before, s.cells, s.after, s.mult); }
    if (r.bombs.length > 0) {
      setBombs(r.bombs);
      getAudio().scatter();
      await new Promise(function (res) { window.setTimeout(res, prefs.turbo ? 300 : 700); });
      setBombs([]);
    }
    if (r.scatters.length > 0) {
      setHits(r.scatters);
      getAudio().big();
      await new Promise(function (res) { window.setTimeout(res, 900); });
      setHits([]);
    }
    paint(r.grid);
  }, [animateStep, paint, prefs.turbo]);
  const spin = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    const st = stakeRef.current;
    if (st < 1) { setErr("Minimum stake is 1 TD"); getAudio().warn(); return; }
    if (st > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); return; }
    setErr(""); setWin(null); setStepMult(0); setBombs([]);
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    let d: { ok: boolean; error?: string; rounds: SpinResult[]; totalMult: number; paid: number; tx: string; freeSpins: number };
    try {
      const r = await fetch("/api/kb2/slot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: st }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Spin rejected"); getAudio().warn(); return; }
    refresh();
    setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + st, won: s.won + d.paid }; });
    const base = d.rounds[0];
    await runRound(base);
    if (d.freeSpins > 0) {
      setFreeTotal(0);
      toast("FREE SPINS AWARDED: " + d.freeSpins, "j");
      let acc = 0;
      for (let i = 1; i < d.rounds.length; i++) {
        setFreeLeft(d.rounds.length - i);
        const fr = d.rounds[i];
        await runRound(fr);
        acc += fr.totalMult;
        setFreeTotal(Math.round(acc * 100) / 100);
      }
      setFreeLeft(0);
    }
    if (d.paid > 0) {
      const tier = d.totalMult >= 50 ? 3 : d.totalMult >= 15 ? 2 : d.totalMult >= 3 ? 1 : 0;
      setWin({ amt: d.paid, mult: d.totalMult, tx: d.tx, tier: tier });
      if (tier >= 2) {
        getAudio().mega();
        setCoins(Array.from({ length: 34 }, function (_, i) { return i; }));
        window.setTimeout(function () { setCoins([]); }, 2600);
        const el = boardRef.current;
        if (el) gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
      } else { getAudio().win(); }
      toast("WIN " + fmt(d.paid) + "  " + d.totalMult.toFixed(2) + "x  " + d.tx, "j");
      window.setTimeout(function () { setWin(null); }, tier >= 2 ? 3200 : 2000);
    } else { getAudio().lose(); }
    refresh();
    busyRef.current = false; setBusy(false);
    const a = autoRef.current;
    if (a.left > 0) {
      const netWon = d.paid;
      const stopByWin = a.stopWin > 0 && netWon >= a.stopWin;
      const stopByLoss = a.stopLoss > 0 && (startBal.current - (me.balance - st + d.paid)) >= a.stopLoss;
      const stopByFeature = a.onFeature && d.freeSpins > 0;
      const next = a.left - 1;
      if (stopByWin || stopByLoss || stopByFeature || next <= 0) {
        setAuto(function (old) { return Object.assign({}, old, { left: 0 }); });
        if (stopByWin) toast("Autoplay stopped: win limit reached", "g");
        if (stopByLoss) toast("Autoplay stopped: loss limit reached", "g");
        if (stopByFeature) toast("Autoplay stopped: free spins triggered", "g");
      } else {
        setAuto(function (old) { return Object.assign({}, old, { left: next }); });
        window.setTimeout(function () { void spin(); }, prefs.turbo ? 320 : 780);
      }
    }
  }, [me, cfg.slug, refresh, toast, runRound, prefs.turbo]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void spin();
  }, [me, spin]);

  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);

  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("k5_hide_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false);
    getAudio().click();
  }, [hideIntro, slug]);
  const cols: number[][] = [];
  for (let c = 0; c < COLS; c++) cols.push(grid.slice(c * ROWS, c * ROWS + ROWS));

  return (
    <div className="k5" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="k5-top">
        <Link href="/casino" className="k5-back">Lobby</Link>
        <span className="k5-demo">DEMO - no real money</span>
        <b className="k5-title">{cfg.name}</b>
        <div className="k5-sp"/>
        <div className="k5-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"k5-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"k5-ico" + (prefs.turbo ? " on" : "")} onClick={function () { update({ turbo: !prefs.turbo }); }}>TURBO</button>
        <button className="k5-ico" onClick={function () { setPay(true); }}>PAYS</button>
      </div>

      <div className="k5-body">
        <div className="k5-stagewrap" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="k5-rays"/>
          <div className="k5-mascot"><Mascot hue={cfg.accent} slug={slug}/></div>
          <div className="k5-frame" style={{ borderColor: cfg.frame }}>
            <span className="k5-corner tl"/><span className="k5-corner tr"/><span className="k5-corner bl"/><span className="k5-corner br"/>
            <div className="k5-banner">WIN UP TO {cfg.maxWin} YOUR BET</div>
            {freeLeft > 0 && <div className="k5-freebar">FREE SPINS LEFT <b>{freeLeft}</b><em>won {freeTotal.toFixed(2)}x</em></div>}
            <div className="k5-board" ref={boardRef}>
              {cols.map(function (col, ci) {
                return (
                  <div key={ci} className="k5-col">
                    {col.map(function (k, ri) {
                      const idx = ci * ROWS + ri;
                      const bomb = bombs.find(function (b) { return b.cell === idx; });
                      return (
                        <div key={ri} data-cell={idx} className={"k5-cell" + (hits.indexOf(idx) >= 0 ? " hit" : "") + (bomb ? " bomb" : "")}>
                          <Sym k={bomb ? 9 : k} size={54}/>
                          {bomb && <span className="k5-bombval">{bomb.value}x</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {stepMult > 0 && <div className="k5-stepwin">+{stepMult.toFixed(2)}x</div>}
            {coins.length > 0 && <div className="k5-coins">{coins.map(function (i) { return <i key={i} style={{ left: (i * 2.9 % 100) + "%", animationDelay: (i * 0.055) + "s" }}/>; })}</div>}
            {win && (
              <div className={"k5-bigwin t" + win.tier}>
                <b>{win.tier >= 3 ? "MEGA WIN" : win.tier >= 2 ? "BIG WIN" : "WIN"}</b>
                <strong>{fmt(win.amt)}</strong>
                <span>{win.mult.toFixed(2)}x</span>
                <em>{win.tx}</em>
              </div>
            )}
          </div>
          <div className="k5-volmeter">
            <span>VOLATILITY</span>
            <div className="k5-vbar">{[0,1,2,3,4].map(function (i) { return <i key={i} className={i < (cfg.vol === "High" ? 5 : cfg.vol === "Medium" ? 3 : 2) ? "on" : ""}/>; })}</div>
            <em>{cfg.vol}</em>
          </div>
        </div>

        <aside className="k5-panel">
          <div className="k5-field">
            <label>BET (TD)</label>
            <div className="k5-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="k5-quick">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          <button className="k5-spinbtn" disabled={busy || !me} onClick={function () { stopAuto(); void spin(); }}>
            <span className="k5-spinring">{busy ? "..." : "SPIN"}</span>
          </button>
          {auto.left > 0
            ? <button className="k5-autostop" onClick={stopAuto}>STOP AUTO ({auto.left})</button>
            : <button className="k5-autobtn" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          <div className="k5-stats">
            <div><span>Spins</span><b>{session.spins}</b></div>
            <div><span>Staked</span><b>{fmt(session.bet)}</b></div>
            <div><span>Returned</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won)}</b></div>
            <div><span>Net</span><b className={session.won - session.bet >= 0 ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          {err && <div className="k5-err">{err}</div>}
          <p className="k5-note">Cluster of {8} or more matching symbols pays. Winning symbols tumble away and new ones fall in. Four stars award {10} free spins where multiplier bombs can land. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="k5-modal">
          <div className="k5-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <Mascot hue={cfg.accent} slug={slug} size={150}/>
            <h2>{cfg.name}</h2>
            <p className="k5-intromax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="k5-introvol">{cfg.vol} VOLATILITY</span>
            <label className="k5-introcheck"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="k5-introgo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {pay && (
        <div className="k5-modal" onClick={function () { setPay(false); }}>
          <div className="k5-paybox" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Paytable</h3>
            <div className="k5-paygrid">
              {PAYTABLE.map(function (p, i) {
                return <div key={i} className="k5-payrow"><span>{p.size}+ cluster</span><b>{p.m.toFixed(2)}x</b></div>;
              })}
            </div>
            <p>Four or more star symbols award 10 free spins. During free spins a bomb can land carrying 2x to 100x, added to that spin total. Three or more stars during free spins add 5 extra spins.</p>
            <button className="k5-payclose" onClick={function () { setPay(false); }}>CLOSE</button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="k5-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="k5-paybox" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="k5-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="k5-autofield"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k5-autofield"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k5-introcheck"><input type="checkbox" checked={auto.onFeature} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { onFeature: e.target.checked }); }); }}/><span>Stop when free spins trigger</span></label>
            <button className="k5-payclose" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}