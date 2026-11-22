"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { instant2BySlug, kenoMultiplier, TOWER_ROWS, TOWER_COLS } from "@/lib/kb2/instant2Math";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function Instant2Engine({ slug }: { slug: string }) {
  const cfg = instant2BySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [stake, setStake] = useState(10);
  const [busy, setBusy] = useState(false);
  const [picks, setPicks] = useState<number[]>([]);
  const [draw, setDraw] = useState<number[]>([]);
  const [hits, setHits] = useState(0);
  const [mult, setMult] = useState(0);
  const [towerGrid, setTowerGrid] = useState<number[][]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<{ win: boolean; mult: number }[]>([]);
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
    try { if (window.localStorage.getItem("k2_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
    if (cfg.type === "tower") setTowerGrid(Array.from({ length: TOWER_ROWS }, function () { return Array.from({ length: TOWER_COLS }, function () { return 0; }); }));
  }, [slug, cfg.type]);

  const togglePick = useCallback(function (n: number) {
    if (busy) return;
    if (picks.indexOf(n) >= 0) setPicks(picks.filter(function (x) { return x !== n; }));
    else if (picks.length < 10) setPicks(picks.concat([n]));
  }, [busy, picks]);

  const play = useCallback(async function (col?: number) {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    if (cfg.type === "keno" && picks.length === 0) { setErr("Pick at least 1 number"); getAudio().warn(); return; }
    setErr(""); setDraw([]); setHits(0); setMult(0); setLastPaid(0); setLastTx("");
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    
    const body: Record<string, unknown> = { slug: cfg.slug, stake: stake };
    if (cfg.type === "keno") body.picks = picks;
    else { body.row = currentRow; body.col = col !== undefined ? col : 0; }
    
    try {
      const r = await fetch("/api/kb2/instant2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Play rejected"); getAudio().warn(); return; }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won + d.paid }; });
      
      if (displayRef.current) {
        gsap.fromTo(displayRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
      }
      
      if (cfg.type === "keno") {
        setDraw(d.result.draw);
        setHits(d.result.hits);
        setMult(d.result.mult);
      } else {
        setTowerGrid(d.result.grid);
        if (d.result.isMine) {
          getAudio().bust();
          toast("BOOM! Hit a mine at row " + (d.result.row + 1), "e");
          setCurrentRow(0);
        } else {
          getAudio().safe();
          setCurrentRow(d.result.row + 1);
        }
      }
      
      setLastPaid(d.paid);
      setLastTx(d.tx);
      setHistory(function (h) { return [{ win: d.paid > 0, mult: d.result.mult }].concat(h).slice(0, 20); });
      
      if (d.paid > 0) {
        if (d.result.mult >= 100) { getAudio().mega(); toast("MEGA WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
        else if (d.result.mult >= 10) { getAudio().big(); toast("BIG WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
        else { getAudio().win(); toast("WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
      } else if (cfg.type === "tower" && !d.result.isMine) {
        toast("Safe! Continue to row " + (d.result.row + 2), "g");
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
          window.setTimeout(function () { void play(col); }, 1200);
        }
      }
    } catch (e) {
      busyRef.current = false; setBusy(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, cfg.type, stake, picks, currentRow, refresh, toast]);

  const cashout = useCallback(async function () {
    if (cfg.type !== "tower" || currentRow === 0) return;
    const mult = (TOWER_COLS - 8) / TOWER_COLS;
    const paid = r2(stake * (0.95 / Math.pow(mult, currentRow)));
    setLastPaid(paid);
    setLastTx("TW" + Date.now().toString().slice(-7));
    getAudio().cash();
    toast("CASHED OUT +" + fmt(paid) + " at row " + currentRow, "j");
    setCurrentRow(0);
    refresh();
  }, [cfg.type, currentRow, stake, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void play(0);
  }, [me, play]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("k2_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);

  return (
    <div className="k2" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="k2-top">
        <Link href="/casino" className="k2-back">Lobby</Link>
        <span className="k2-demo">DEMO - no real money</span>
        <b className="k2-title">{cfg.name}</b>
        <div className="k2-sp"/>
        <div className="k2-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"k2-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="k2-body">
        <div className="k2-stage" style={{ background: cfg.felt }}>
          <div className="k2-rays"/>
          
          <div className="k2-display" ref={displayRef}>
            {cfg.type === "keno" && (
              <div className="k2-keno">
                {Array.from({ length: 80 }, function (_, i) {
                  const n = i + 1;
                  const isPick = picks.indexOf(n) >= 0;
                  const isDraw = draw.indexOf(n) >= 0;
                  const isHit = isPick && isDraw;
                  return (
                    <button
                      key={n}
                      className={"k2-num" + (isHit ? " hit" : isDraw ? " draw" : isPick ? " pick" : "")}
                      onClick={function () { togglePick(n); }}
                      disabled={busy}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
            {cfg.type === "tower" && (
              <div className="k2-tower">
                {towerGrid.map(function (row, ri) {
                  return (
                    <div key={ri} className="k2-tower-row">
                      {row.map(function (cell, ci) {
                        const revealed = ri < currentRow;
                        const isMine = cell === 1;
                        return (
                          <button
                            key={ci}
                            className={"k2-cell" + (revealed ? (isMine ? " mine" : " safe") : "") + (ri === currentRow ? " active" : "")}
                            onClick={function () { if (ri === currentRow) void play(ci); }}
                            disabled={busy || ri !== currentRow}
                          >
                            {revealed ? (isMine ? "💣" : "💎") : ""}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cfg.type === "keno" && draw.length > 0 && (
            <div className="k2-keno-result">
              <b>{hits} HITS</b>
              <span>{mult.toFixed(2)}x</span>
            </div>
          )}

          {cfg.type === "tower" && currentRow > 0 && (
            <button className="k2-cashout" onClick={cashout}>CASH OUT</button>
          )}

          {lastPaid > 0 && <div className="k2-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
        </div>

        <aside className="k2-panel">
          <div className="k2-field">
            <label>BET (TD)</label>
            <div className="k2-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>

          <div className="k2-quick">{[5, 10, 25, 50, 100].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>

          {cfg.type === "keno" && (
            <button className="k2-play" disabled={busy || !me || picks.length === 0} onClick={function () { void play(); }}>DRAW 20 NUMBERS</button>
          )}

          {auto.left > 0 ? <button className="k2-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="k2-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="k2-stats">
            <div><span>Plays</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="k2-err">{err}</div>}
          <p className="k2-note">{cfg.type === "keno" ? "Pick 1-10 numbers. 20 are drawn. More hits = higher multiplier." : "Climb the tower row by row. Each safe cell increases your multiplier. One mine ends the game. Cash out anytime."} TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="k2-modal">
          <div className="k2-intro" style={{ background: cfg.felt }}>
            <div className="k2-introdisplay">
              {cfg.type === "keno" ? <div className="k2-introkeno">1-80</div> : <div className="k2-introtower">8×8</div>}
            </div>
            <h2>{cfg.name}</h2>
            <p className="k2-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="k2-ivol">{cfg.type === "keno" ? "PICK 1-10" : "CLIMB 8 ROWS"} - RTP 95%</span>
            <label className="k2-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="k2-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="k2-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="k2-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="k2-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} PLAYS</button>; })}</div>
            <label className="k2-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k2-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="k2-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

function r2(n: number): number { return Math.round(n * 100) / 100; }