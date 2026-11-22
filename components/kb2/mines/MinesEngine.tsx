"use client";
import { GameCharacter } from "@/lib/kb2/imageLoader";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { minesBySlug, minesMultiplier, GRID_SIZE } from "@/lib/kb2/minesMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function Cell({ revealed, isMine, onClick, disabled, size = 64 }: {
  revealed: boolean; isMine: boolean; onClick: () => void; disabled: boolean; size?: number;
}) {
  return (
    <button
      className={"mn-cell" + (revealed ? (isMine ? " mine" : " gem") : "")}
      style={{ width: size, height: size }}
      onClick={onClick}
      disabled={disabled}
    >
      {revealed ? (isMine ? <span className="mn-bomb">💣</span> : <span className="mn-gem">💎</span>) : <span className="mn-hidden"/>}
    </button>
  );
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function MinesEngine({ slug }: { slug: string }) {
  const cfg = minesBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [mines, setMines] = useState(cfg.defaultMines);
  const [stake, setStake] = useState(10);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentTx, setCurrentTx] = useState("");
  const [currentMult, setCurrentMult] = useState(1);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("km_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const safeRevealed = revealed.filter(function (i) { return minePositions.indexOf(i) < 0; }).length;
  const currentPayout = r2(stake * currentMult);

  const start = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setRevealed([]); setMinePositions([]); setCurrentMult(1); setLastPaid(0); setLastTx("");
    busyRef.current = true; setPlaying(true);
    getAudio().launch();
    if (startBal.current === 0) startBal.current = me.balance;
    
    try {
      const r = await fetch("/api/kb2/mines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, mines: mines, stake: stake }) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setPlaying(false); setErr(d.error || "Game rejected"); getAudio().warn(); return; }
      setCurrentTx(d.tx); busyRef.current = false; setMinePositions(d.positions || []); setMinePositions(d.positions || []);
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won }; });
    } catch (e) {
      busyRef.current = false; setPlaying(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, mines, stake, refresh]);

  const reveal = useCallback(async function (index: number) {
    if (!playing || busyRef.current) return;
    if (revealed.indexOf(index) >= 0) return;
    busyRef.current = true;
    getAudio().click();
    
    const newRevealed = [...revealed, index];
    setRevealed(newRevealed);
    
    const isMine = minePositions.length > 0 && minePositions.indexOf(index) >= 0;
    
    if (gridRef.current) {
      const cell = gridRef.current.querySelector('[data-cell="' + index + '"]');
      if (cell) {
        gsap.fromTo(cell, { scale: 0.3, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(1.7)" });
      }
    }
    
    if (isMine) {
      getAudio().bust();
      setRevealed(minePositions.concat(newRevealed.filter(function (i) { return minePositions.indexOf(i) < 0; })));
      toast("BOOM! Hit a mine at position " + (index + 1), "e");
      setPlaying(false);
      busyRef.current = false;
      refresh();
      const a = autoRef.current;
      if (a.left > 0) setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
      return;
    }
    
    const safeCount = newRevealed.filter(function (i) { return minePositions.length === 0 || minePositions.indexOf(i) < 0; }).length;
    let rtp = 0.97;
    try { const rr = await fetch("/api/kb/rtp", { cache: "no-store" }); const dd = await rr.json(); if (dd.ok && dd.live) rtp = dd.live.instant || 0.97; } catch (e) { /* ignore */ }
    const newMult = minesMultiplier(mines, safeCount, rtp);
    setCurrentMult(newMult);
    getAudio().safe();
    busyRef.current = false;
  }, [playing, revealed, minePositions, mines]);

  const cashout = useCallback(async function () {
    if (!playing || busyRef.current || revealed.length === 0) return;
    busyRef.current = true;
    getAudio().cash();
    
    const paid = currentPayout;
    setLastPaid(paid);
    setLastTx(currentTx);
    
    try {
      const r = await fetch("/api/kb2/mines/cash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tx: currentTx, mult: currentMult }) });
      const d = await r.json();
      if (d.ok) {
        refresh();
        setSession(function (s) { return { spins: s.spins, bet: s.bet, won: s.won + paid }; });
        toast("CASHED OUT +" + fmt(paid) + " at " + currentMult.toFixed(2) + "x", "j");
      }
    } catch (e) { /* ignore */ }
    
    setPlaying(false);
    busyRef.current = false;
    refresh();
    
    const a = autoRef.current;
    if (a.left > 0) {
      const stopWin = a.stopWin > 0 && paid >= a.stopWin;
      const next = a.left - 1;
      if (stopWin || next <= 0) {
        setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
      } else {
        setAuto(function (o) { return Object.assign({}, o, { left: next }); });
        window.setTimeout(function () { void start(); }, 1500);
      }
    }
  }, [playing, currentPayout, currentTx, currentMult, refresh, toast, start]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void start();
  }, [me, start]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("km_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  const cells = Array.from({ length: GRID_SIZE }, function (_, i) { return i; });

  return (
    <div className="mn" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="mn-top">
        <Link href="/casino" className="mn-back">Lobby</Link>
        <span className="mn-demo">DEMO - no real money</span>
        <img src={"/assets/" + slug + "/logo.png"} alt="" className="mn-logo" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
        <b className="mn-title">{cfg.name}</b>
        <div className="mn-sp"/>
        <div className="mn-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"mn-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="mn-body">
        <div className="mn-table" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="mn-rays"/>
          <div className="mn-mascot"><GameCharacter slug={slug} hue={cfg.accent} size={190} mood="idle"/></div>
          
          <div className="mn-grid" ref={gridRef}>
            {cells.map(function (i) {
              const isRevealed = revealed.indexOf(i) >= 0;
              const isMine = minePositions.indexOf(i) >= 0;
              return (
                <div key={i} data-cell={i}>
                  <Cell
                    revealed={isRevealed}
                    isMine={isMine}
                    onClick={function () { void reveal(i); }}
                    disabled={!playing}
                    size={72}
                  />
                </div>
              );
            })}
          </div>

          {playing && revealed.length > 0 && (
            <div className="mn-live">
              <span>MULTIPLIER</span>
              <b>{currentMult.toFixed(2)}x</b>
              <em>Cashout: {fmt(currentPayout)} TD</em>
            </div>
          )}

          {!playing && revealed.length === 0 && <span className="mn-msg">CHOOSE MINES AND BET</span>}
          {lastPaid > 0 && <div className="mn-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
        </div>

        <aside className="mn-panel">
          <div className="mn-field">
            <label>MINES</label>
            <div className="mn-mines">
              {[1, 3, 5, 10, 15, 20, 24].map(function (m) {
                return <button key={m} className={mines === m ? "on" : ""} disabled={playing} onClick={function () { getAudio().click(); setMines(m); }}>{m}</button>;
              })}
            </div>
          </div>

          <div className="mn-field">
            <label>BET (TD)</label>
            <div className="mn-stake">
              <button disabled={playing} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={playing} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={playing} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>

          <div className="mn-quick">{[5, 10, 25, 50, 100].map(function (v) { return <button key={v} disabled={playing} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>

          {playing ? (
            <button className="mn-cashout" disabled={!playing || revealed.length === 0} onClick={cashout}>
              <span>CASH OUT</span>
              <b>{fmt(currentPayout)} TD</b>
              <em>@ {currentMult.toFixed(2)}x</em>
            </button>
          ) : (
            <button className="mn-start" disabled={!me} onClick={start}>START GAME</button>
          )}

          {auto.left > 0 ? <button className="mn-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="mn-auto" disabled={!me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="mn-stats">
            <div><span>Games</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="mn-err">{err}</div>}
          <p className="mn-note">Each safe reveal increases the multiplier using C(25,k) / C(25-mines,k) × RTP. More mines = higher multipliers but greater bust risk. Cash out anytime to lock your profit. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="mn-modal">
          <div className="mn-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="mn-introgrid">
              {[0, 6, 12, 18, 24].map(function (i) { return <div key={i} className="mn-introcell"><span className="mn-gem">💎</span></div>; })}
            </div>
            <h2>{cfg.name}</h2>
            <p className="mn-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="mn-ivol">5x5 GRID - {mines} MINES</span>
            <label className="mn-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="mn-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="mn-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="mn-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="mn-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} GAMES</button>; })}</div>
            <label className="mn-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="mn-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="mn-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function r2(n: number): number { return Math.round(n * 100) / 100; }