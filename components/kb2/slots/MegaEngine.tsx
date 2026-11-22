"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { REELS, PAY, TIER_OF, megaBySlug } from "@/lib/kb2/megaMath";
import type { SpinResult, WayWin } from "@/lib/kb2/megaMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";
import { LineSym, LineMascot } from "./LineSym";

interface Auto { left: number; stopWin: number; stopLoss: number; onFeature: boolean; }

export default function MegaEngine({ slug }: { slug: string }) {
  const cfg = megaBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [heights, setHeights] = useState<number[]>([3, 4, 5, 4, 3, 4]);
  const [grid, setGrid] = useState<number[]>(function () { return Array.from({ length: 23 }, function (_, i) { return i % 8; }); });
  const [lit, setLit] = useState<number[]>([]);
  const [activeWin, setActiveWin] = useState(-1);
  const [ways, setWays] = useState(2880);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [pay, setPay] = useState(false);
  const [win, setWin] = useState<{ amt: number; mult: number; tx: string; tier: number } | null>(null);
  const [freeLeft, setFreeLeft] = useState(0);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freeMult, setFreeMult] = useState(1);
  const [lastWins, setLastWins] = useState<WayWin[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0, onFeature: true });
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
    try { if (window.localStorage.getItem("k7_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const playRound = useCallback(async function (r: SpinResult, turbo: boolean) {
    setLit([]); setActiveWin(-1);
    setHeights(r.heights.slice());
    setGrid(r.grid.slice());
    setWays(r.ways);
    setFreeMult(r.freeMult);
    getAudio().reel();
    const el = boardRef.current;
    if (el) {
      window.requestAnimationFrame(function () {
        const cells = el.querySelectorAll("[data-m]");
        gsap.fromTo(cells, { y: -46, opacity: 0.2 }, { y: 0, opacity: 1, duration: turbo ? 0.22 : 0.44, stagger: { each: 0.012, from: "start" }, ease: "back.out(1.5)" });
      });
    }
    await new Promise(function (res) { window.setTimeout(res, turbo ? 260 : 560); });
    if (r.scatters.length > 0) {
      setLit(r.scatters);
      getAudio().scatter();
      await new Promise(function (res) { window.setTimeout(res, 820); });
    }
    setLastWins(r.wins);
    if (r.wins.length > 0) {
      const all: number[] = [];
      r.wins.forEach(function (w) { w.cells.forEach(function (c) { if (all.indexOf(c) < 0) all.push(c); }); });
      setLit(all);
      getAudio().win();
      const cycle = Math.min(r.wins.length, turbo ? 2 : 4);
      for (let i = 0; i < cycle; i++) {
        setActiveWin(i);
        setLit(r.wins[i].cells);
        await new Promise(function (res) { window.setTimeout(res, turbo ? 180 : 400); });
      }
      setActiveWin(-1);
      setLit(all);
    }
  }, []);
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
      const r = await fetch("/api/kb2/mega", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: st }) });
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
      const tier = d.totalMult >= 100 ? 3 : d.totalMult >= 20 ? 2 : d.totalMult >= 3 ? 1 : 0;
      setWin({ amt: d.paid, mult: d.totalMult, tx: d.tx, tier: tier });
      if (tier >= 2) {
        getAudio().mega();
        setCoins(Array.from({ length: 34 }, function (_, i) { return i; }));
        window.setTimeout(function () { setCoins([]); }, 2600);
        const el = boardRef.current;
        if (el) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
      }
      toast("WIN " + fmt(d.paid) + "  " + d.totalMult.toFixed(2) + "x  " + d.tx, "j");
      window.setTimeout(function () { setWin(null); }, tier >= 2 ? 3300 : 1900);
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
    if (hideIntro) { try { window.localStorage.setItem("k7_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  let off = 0;
  const cols: number[][] = heights.map(function (h) { const s = off; off += h; return grid.slice(s, s + h); });

  return (
    <div className="k7" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="k7-top">
        <Link href="/casino" className="k7-back">Lobby</Link>
        <span className="k7-demo">DEMO - no real money</span>
        <b className="k7-title">{cfg.name}</b>
        <div className="k7-ways"><span>WAYS</span><b>{ways.toLocaleString("en-US")}</b></div>
        <div className="k7-sp"/>
        <div className="k7-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"k7-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"k7-ico" + (prefs.turbo ? " on" : "")} onClick={function () { update({ turbo: !prefs.turbo }); }}>TURBO</button>
        <button className="k7-ico" onClick={function () { setPay(true); }}>PAYS</button>
      </div>

      <div className="k7-body">
        <div className="k7-stage" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="k7-rays"/>
          <div className="k7-mascot"><LineMascot hue={cfg.accent} hue2={cfg.accent2}/></div>
          <div className="k7-frame" style={{ borderColor: cfg.frame }}>
            <span className="k7-cn tl"/><span className="k7-cn tr"/><span className="k7-cn bl"/><span className="k7-cn br"/>
            <div className="k7-banner">WIN UP TO {cfg.maxWin} YOUR BET</div>
            <div className="k7-heights">
              {heights.map(function (h, i) { return <span key={i} className={h === 7 ? "max" : ""}>{h}</span>; })}
            </div>
            {freeLeft > 0 && <div className="k7-free">FREE SPINS <b>{freeLeft}</b><em>x{freeMult}</em><span>won {freeTotal.toFixed(2)}x</span></div>}
            <div className="k7-board" ref={boardRef}>
              {cols.map(function (col, ci) {
                return (
                  <div key={ci} className="k7-reel" style={{ gridTemplateRows: "repeat(" + col.length + ",1fr)" }}>
                    {col.map(function (k, ri) {
                      let idx = 0;
                      for (let i = 0; i < ci; i++) idx += heights[i];
                      idx += ri;
                      const on = lit.indexOf(idx) >= 0;
                      return (
                        <div key={ri} data-m={idx} className={"k7-cell" + (on ? " lit" : "")}>
                          <LineSym k={k} set={cfg.set} size={44}/>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {lastWins.length > 0 && (
              <div className="k7-winlist">
                {lastWins.slice(0, 5).map(function (w, i) {
                  return <span key={i} className={activeWin === i ? "on" : ""}>{w.length} reels - {w.ways} ways <b>{w.mult.toFixed(2)}x</b></span>;
                })}
              </div>
            )}
            {coins.length > 0 && <div className="k7-coins">{coins.map(function (i) { return <i key={i} style={{ left: (i * 2.9 % 100) + "%", animationDelay: (i * 0.055) + "s" }}/>; })}</div>}
            {win && (
              <div className={"k7-big t" + win.tier}>
                <b>{win.tier >= 3 ? "MEGA WIN" : win.tier >= 2 ? "BIG WIN" : "WIN"}</b>
                <strong>{fmt(win.amt)}</strong>
                <span>{win.mult.toFixed(2)}x</span>
                <em>{win.tx}</em>
              </div>
            )}
          </div>
          <div className="k7-vol">
            <span>VOLATILITY</span>
            <div className="k7-vbar">{[0,1,2,3,4].map(function (i) { return <i key={i} className={i < (cfg.vol === "High" ? 5 : 3) ? "on" : ""}/>; })}</div>
            <em>{cfg.vol}</em>
          </div>
        </div>

        <aside className="k7-panel">
          <div className="k7-field">
            <label>BET (TD)</label>
            <div className="k7-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="k7-quick">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          <button className="k7-spin" disabled={busy || !me} onClick={function () { stopAuto(); void spin(); }}><span>{busy ? "..." : "SPIN"}</span></button>
          {auto.left > 0 ? <button className="k7-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="k7-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          <div className="k7-stats">
            <div><span>Spins</span><b>{session.spins}</b></div>
            <div><span>Staked</span><b>{fmt(session.bet)}</b></div>
            <div><span>Returned</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won)}</b></div>
            <div><span>Net</span><b className={session.won - session.bet >= 0 ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          {err && <div className="k7-err">{err}</div>}
          <p className="k7-note">Every reel holds between 2 and 7 symbols, so the number of ways changes each spin. Matching symbols on adjacent reels from the left pay across every way they cover. Four stars award {10} free spins where each consecutive win climbs the multiplier to x10. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="k7-modal">
          <div className="k7-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <LineMascot hue={cfg.accent} hue2={cfg.accent2} size={146}/>
            <h2>{cfg.name}</h2>
            <p className="k7-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="k7-ivol">{cfg.vol} VOLATILITY - UP TO 117,649 WAYS</span>
            <label className="k7-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="k7-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {pay && (
        <div className="k7-modal" onClick={function () { setPay(false); }}>
          <div className="k7-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Paytable</h3>
            <div className="k7-paytab">
              <div className="k7-payhead"><span>Symbol</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
              {[0,1,2,3,4,5,6,7].map(function (k) {
                const t = TIER_OF[k] ?? 0;
                return (
                  <div key={k} className="k7-payrow">
                    <span><LineSym k={k} set={cfg.set} size={28}/></span>
                    <b>{PAY[t][3].toFixed(2)}x</b>
                    <b>{PAY[t][4].toFixed(2)}x</b>
                    <b>{PAY[t][5].toFixed(2)}x</b>
                    <b>{PAY[t][6].toFixed(2)}x</b>
                  </div>
                );
              })}
            </div>
            <p>Each value is multiplied by the number of ways that symbol covers. Two matching symbols on reel one and three on reel two already give six ways. The golden shield is wild on reels two to six. Four stars award free spins with a multiplier climbing x1, x2, x3, x5 then x10 on consecutive wins.</p>
            <button className="k7-close" onClick={function () { setPay(false); }}>CLOSE</button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="k7-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="k7-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="k7-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="k7-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k7-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k7-check"><input type="checkbox" checked={auto.onFeature} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { onFeature: e.target.checked }); }); }}/><span>Stop when free spins trigger</span></label>
            <button className="k7-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}