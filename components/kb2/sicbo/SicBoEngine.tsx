"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { sicboBySlug, PAYOUTS } from "@/lib/kb2/sicboMath";
import type { SicBoResult } from "@/lib/kb2/sicboMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function Die({ value, rolling, size = 64 }: { value: number; rolling: boolean; size?: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
  };
  
  return (
    <div className={"sb-die" + (rolling ? " rolling" : "")} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <rect x="5" y="5" width="90" height="90" rx="12" fill="#fffdf6" stroke="#2a1c04" strokeWidth="3"/>
        {dots[value]?.map(function (pos, i) {
          return <circle key={i} cx={pos[0]} cy={pos[1]} r="8" fill="#1a1a1a"/>;
        })}
      </svg>
    </div>
  );
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function SicBoEngine({ slug }: { slug: string }) {
  const cfg = sicboBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [dice, setDice] = useState<[number, number, number]>([1, 2, 3]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<SicBoResult | null>(null);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [selectedChip, setSelectedChip] = useState(10);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<{ total: number; big: boolean }[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const tableRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("ks_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const totalBet = Object.keys(bets).reduce(function (a, k) { return a + bets[k]; }, 0);

  const placeBet = useCallback(function (type: string) {
    if (rolling) return;
    getAudio().chip();
    setBets(function (b) {
      const next = Object.assign({}, b);
      next[type] = (next[type] || 0) + selectedChip;
      return next;
    });
  }, [rolling, selectedChip]);

  const clearBets = useCallback(function () {
    if (rolling) return;
    getAudio().click();
    setBets({});
  }, [rolling]);

  const roll = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (totalBet < 1) { setErr("Place at least one bet"); getAudio().warn(); return; }
    if (totalBet > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setResult(null); setLastPaid(0); setLastTx("");
    busyRef.current = true; setRolling(true);
    getAudio().dice();
    if (startBal.current === 0) startBal.current = me.balance;
    
    if (tableRef.current) {
      const dice = tableRef.current.querySelectorAll(".sb-die");
      gsap.to(dice, { rotation: 720, y: -60, duration: 0.6, ease: "power2.out", stagger: 0.1 });
    }
    
    await new Promise(function (res) { window.setTimeout(res, 1200); });
    
    try {
      const r = await fetch("/api/kb2/sicbo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, bets: bets }) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setRolling(false); setErr(d.error || "Roll rejected"); getAudio().warn(); return; }
      
      setDice(d.result.dice);
      setResult(d.result);
      setLastPaid(d.paid);
      setLastTx(d.tx);
      setHistory(function (h) { return [{ total: d.result.total, big: d.result.isBig }].concat(h).slice(0, 20); });
      
      if (tableRef.current) {
        const dice = tableRef.current.querySelectorAll(".sb-die");
        gsap.to(dice, { rotation: 0, y: 0, duration: 0.5, ease: "back.out(1.5)", stagger: 0.08 });
      }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + totalBet, won: s.won + d.paid }; });
      
      if (d.paid > 0) {
        getAudio().win();
        toast("WIN " + fmt(d.paid) + " - " + d.result.dice.join("-"), "j");
      } else {
        getAudio().lose();
        toast(d.result.dice.join("-") + " = " + d.result.total, "e");
      }
      
      setBets({});
      refresh();
      busyRef.current = false; setRolling(false);
      
      const a = autoRef.current;
      if (a.left > 0) {
        const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
        const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - totalBet + d.paid)) >= a.stopLoss;
        const next = a.left - 1;
        if (stopWin || stopLoss || next <= 0) {
          setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        } else {
          setAuto(function (o) { return Object.assign({}, o, { left: next }); });
          window.setTimeout(function () { void roll(); }, 1500);
        }
      }
    } catch (e) {
      busyRef.current = false; setRolling(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, bets, totalBet, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void roll();
  }, [me, roll]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("ks_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  const betTypes = [
    { key: "big", label: "BIG (11-17)", mult: "1:1" },
    { key: "small", label: "SMALL (4-10)", mult: "1:1" },
    { key: "anytriple", label: "ANY TRIPLE", mult: "30:1" },
    { key: "triple:1", label: "TRIPLE 1", mult: "180:1" },
    { key: "triple:2", label: "TRIPLE 2", mult: "180:1" },
    { key: "triple:3", label: "TRIPLE 3", mult: "180:1" },
    { key: "triple:4", label: "TRIPLE 4", mult: "180:1" },
    { key: "triple:5", label: "TRIPLE 5", mult: "180:1" },
    { key: "triple:6", label: "TRIPLE 6", mult: "180:1" },
    { key: "double:1", label: "DOUBLE 1", mult: "10:1" },
    { key: "double:2", label: "DOUBLE 2", mult: "10:1" },
    { key: "double:3", label: "DOUBLE 3", mult: "10:1" },
    { key: "double:4", label: "DOUBLE 4", mult: "10:1" },
    { key: "double:5", label: "DOUBLE 5", mult: "10:1" },
    { key: "double:6", label: "DOUBLE 6", mult: "10:1" }
  ];

  const sumBets = Array.from({ length: 14 }, function (_, i) {
    const s = i + 4;
    return { key: "sum:" + s, label: String(s), mult: PAYOUTS.sum[s as keyof typeof PAYOUTS.sum] + ":1" };
  });

  return (
    <div className="sb" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="sb-top">
        <Link href="/casino" className="sb-back">Lobby</Link>
        <span className="sb-demo">DEMO - no real money</span>
        <b className="sb-title">{cfg.name}</b>
        <div className="sb-sp"/>
        <div className="sb-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"sb-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="sb-body">
        <div className="sb-table" ref={tableRef} style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="sb-rays"/>
          
          <div className="sb-dicearea">
            <Die value={dice[0]} rolling={rolling} size={80}/>
            <Die value={dice[1]} rolling={rolling} size={80}/>
            <Die value={dice[2]} rolling={rolling} size={80}/>
          </div>

          {result && (
            <div className="sb-result">
              <b>{result.dice.join(" - ")} = {result.total}</b>
              <span>{result.isBig ? "BIG" : result.isSmall ? "SMALL" : "TRIPLE"}</span>
            </div>
          )}
          {!result && !rolling && <span className="sb-msg">PLACE YOUR BETS</span>}
          {rolling && <span className="sb-msg rolling">ROLLING...</span>}

          {lastPaid > 0 && <div className="sb-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}

          <div className="sb-betgrid">
            <div className="sb-section">
              <h4>OUTSIDE BETS</h4>
              <div className="sb-bets">
                {betTypes.slice(0, 3).map(function (bt) {
                  return (
                    <button key={bt.key} className={"sb-bet" + (bets[bt.key] ? " on" : "")} disabled={rolling} onClick={function () { placeBet(bt.key); }}>
                      <span>{bt.label}</span>
                      <em>{bt.mult}</em>
                      {bets[bt.key] ? <b>{bets[bt.key]}</b> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sb-section">
              <h4>TRIPLES</h4>
              <div className="sb-bets">
                {betTypes.slice(3, 9).map(function (bt) {
                  return (
                    <button key={bt.key} className={"sb-bet" + (bets[bt.key] ? " on" : "")} disabled={rolling} onClick={function () { placeBet(bt.key); }}>
                      <span>{bt.label}</span>
                      <em>{bt.mult}</em>
                      {bets[bt.key] ? <b>{bets[bt.key]}</b> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sb-section">
              <h4>DOUBLES</h4>
              <div className="sb-bets">
                {betTypes.slice(9, 15).map(function (bt) {
                  return (
                    <button key={bt.key} className={"sb-bet" + (bets[bt.key] ? " on" : "")} disabled={rolling} onClick={function () { placeBet(bt.key); }}>
                      <span>{bt.label}</span>
                      <em>{bt.mult}</em>
                      {bets[bt.key] ? <b>{bets[bt.key]}</b> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sb-section">
              <h4>SUM BETS</h4>
              <div className="sb-sums">
                {sumBets.map(function (sb) {
                  return (
                    <button key={sb.key} className={"sb-sum" + (bets[sb.key] ? " on" : "")} disabled={rolling} onClick={function () { placeBet(sb.key); }}>
                      <span>{sb.label}</span>
                      <em>{sb.mult}</em>
                      {bets[sb.key] ? <b>{bets[sb.key]}</b> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sb-history">
            <span>HISTORY</span>
            {history.map(function (h, i) { return <b key={i} className={h.big ? "big" : "small"}>{h.total}</b>; })}
          </div>
        </div>

        <aside className="sb-panel">
          <div className="sb-chips">
            {[5, 10, 25, 50, 100].map(function (v) {
              return <button key={v} className={"sb-chip" + (selectedChip === v ? " on" : "")} onClick={function () { getAudio().click(); setSelectedChip(v); }}>{v}</button>;
            })}
          </div>
          
          <div className="sb-field">
            <label>Total Bet</label>
            <b>{fmt(totalBet)} TD</b>
          </div>

          <div className="sb-actions">
            <button className="sb-clear" disabled={rolling || totalBet === 0} onClick={clearBets}>CLEAR</button>
            <button className="sb-roll" disabled={rolling || !me || totalBet === 0} onClick={roll}>{rolling ? "ROLLING" : "ROLL"}</button>
          </div>

          {auto.left > 0 ? <button className="sb-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="sb-auto" disabled={rolling || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="sb-stats">
            <div><span>Rolls</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="sb-err">{err}</div>}
          <p className="sb-note">Big/Small pays 1:1 but loses on triples. Any Triple pays 30:1 (probability 1/36). Specific Triple pays 180:1 (probability 1/216). The house edge varies by bet type from 2.8% to 30%. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="sb-modal">
          <div className="sb-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="sb-introdice">
              <Die value={1} rolling={false} size={56}/>
              <Die value={2} rolling={false} size={56}/>
              <Die value={3} rolling={false} size={56}/>
            </div>
            <h2>{cfg.name}</h2>
            <p className="sb-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="sb-ivol">3 DICE - 11 BET TYPES</span>
            <label className="sb-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="sb-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="sb-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="sb-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="sb-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} ROLLS</button>; })}</div>
            <label className="sb-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="sb-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="sb-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}