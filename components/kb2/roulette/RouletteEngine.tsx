"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { WHEEL, REDS, rouletteBySlug } from "@/lib/kb2/rouletteMath";
import type { RouletteResult } from "@/lib/kb2/rouletteMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

const CHIPS = [
  { v: 1, c: "#e8e8e8", t: "#1a1a1a" },
  { v: 5, c: "#e02020", t: "#fff" },
  { v: 10, c: "#2f7fd6", t: "#fff" },
  { v: 25, c: "#12a85f", t: "#fff" },
  { v: 50, c: "#7a2ea0", t: "#fff" },
  { v: 100, c: "#1a1a1a", t: "#ffd97a" }
];

const ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
];

const OUTSIDE = [
  { k: "d1", l: "1st 12" },
  { k: "d2", l: "2nd 12" },
  { k: "d3", l: "3rd 12" },
  { k: "low", l: "1-18" },
  { k: "even", l: "EVEN" },
  { k: "red", l: "RED", r: true },
  { k: "black", l: "BLACK", b: true },
  { k: "odd", l: "ODD" },
  { k: "high", l: "19-36" }
];

function WheelSVG({ number, spinning, hue, onLand }: { number: number; spinning: boolean; hue: string; onLand?: () => void }) {
  const ringRef = useRef<SVGGElement>(null);
  const ballRef = useRef<SVGCircleElement>(null);
  const prevSpinning = useRef(false);

  useEffect(function () {
    if (spinning && !prevSpinning.current && ringRef.current && ballRef.current) {
      const rotations = 4 + Math.floor(Math.random() * 3);
      const idx = WHEEL.indexOf(number);
      const finalAngle = idx >= 0 ? (idx / 37) * 360 : 0;
      const totalAngle = rotations * 360 + finalAngle;
      ringRef.current.style.transition = "transform 4.2s cubic-bezier(0.17, 0.67, 0.21, 1)";
      ringRef.current.style.transform = "rotate(" + totalAngle + "deg)";
      ringRef.current.style.transformOrigin = "100px 100px";
      ballRef.current.style.transition = "transform 4.5s cubic-bezier(0.17, 0.67, 0.1, 1)";
      ballRef.current.style.transform = "rotate(" + (-totalAngle * 1.4) + "deg)";
      ballRef.current.style.transformOrigin = "100px 100px";
      window.setTimeout(function () { if (onLand) onLand(); }, 4600);
    } else if (!spinning && prevSpinning.current && ringRef.current && ballRef.current) {
      ringRef.current.style.transition = "none";
      ringRef.current.style.transform = "rotate(0deg)";
      ballRef.current.style.transition = "none";
      ballRef.current.style.transform = "rotate(0deg)";
    }
    prevSpinning.current = spinning;
  }, [spinning, number, onLand]);

  return (
    <svg viewBox="0 0 200 200" className="kr-wheel-svg" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="kr-wood" cx="0.5" cy="0.5"><stop offset="0%" stopColor="#8b6f47"/><stop offset="50%" stopColor="#6b4423"/><stop offset="100%" stopColor="#3e2723"/></radialGradient>
        <radialGradient id="kr-center" cx="0.5" cy="0.5"><stop offset="0%" stopColor={hue}/><stop offset="100%" stopColor="#2a1c04"/></radialGradient>
      </defs>
      {/* Outer wood ring - STATIC */}
      <circle cx="100" cy="100" r="96" fill="url(#kr-wood)" stroke="#2a1c04" strokeWidth="3"/>
      {/* Numbered ring - ROTATES as one unit */}
      <g ref={ringRef} style={{ transformOrigin: "100px 100px" }}>
        {WHEEL.map(function (n, i) {
          const angle = (i / 37) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const color = n === 0 ? "#0c7a4e" : REDS.indexOf(n) >= 0 ? "#c4202f" : "#1a1a1a";
          const nextAngle = ((i + 1) / 37) * 360 - 90;
          const nextRad = (nextAngle * Math.PI) / 180;
          const x1o = 100 + 88 * Math.cos(rad), y1o = 100 + 88 * Math.sin(rad);
          const x2o = 100 + 88 * Math.cos(nextRad), y2o = 100 + 88 * Math.sin(nextRad);
          const x1i = 100 + 62 * Math.cos(nextRad), y1i = 100 + 62 * Math.sin(nextRad);
          const x2i = 100 + 62 * Math.cos(rad), y2i = 100 + 62 * Math.sin(rad);
          const midRad = ((angle + nextAngle) / 2 * Math.PI) / 180;
          const tx = 100 + 75 * Math.cos(midRad);
          const ty = 100 + 75 * Math.sin(midRad);
          return (
            <g key={n}>
              <path d={"M"+x1o.toFixed(2)+","+y1o.toFixed(2)+" A88,88 0 0,1 "+x2o.toFixed(2)+","+y2o.toFixed(2)+" L"+x1i.toFixed(2)+","+y1i.toFixed(2)+" A62,62 0 0,0 "+x2i.toFixed(2)+","+y2i.toFixed(2)+" Z"} fill={color} stroke="#ffd97a" strokeWidth="0.4"/>
              <text x={tx.toFixed(2)} y={ty.toFixed(2)} fill="#fff" fontSize="7.5" fontWeight="900" textAnchor="middle" dominantBaseline="central" transform={"rotate(" + ((angle + nextAngle) / 2 + 90).toFixed(2) + "," + tx.toFixed(2) + "," + ty.toFixed(2) + ")"}>{n}</text>
            </g>
          );
        })}
      </g>
      {/* Inner wood - STATIC */}
      <circle cx="100" cy="100" r="62" fill="url(#kr-center)" stroke={hue} strokeWidth="2"/>
      {Array.from({ length: 8 }).map(function (_, i) { const a = (i * 45 * Math.PI) / 180; return <line key={i} x1={100+14*Math.cos(a)} y1={100+14*Math.sin(a)} x2={100+58*Math.cos(a)} y2={100+58*Math.sin(a)} stroke={hue} strokeWidth="1" opacity="0.5"/>; })}
      <circle cx="100" cy="100" r="14" fill={hue} opacity="0.9"/>
      <circle cx="100" cy="100" r="7" fill="#2a1c04"/>
      {/* Ball - COUNTER ROTATES */}
      <circle ref={ballRef} cx="100" cy="28" r="5" fill="#fff" stroke="#ccc" strokeWidth="1" style={{ transformOrigin: "100px 100px" }}/>
    </svg>
  );
}
function ChipIcon({ v, c, t, size = 36, on = false }: { v: number; c: string; t: string; size?: number; on?: boolean }) {
  return (
    <div className={"kr-chip" + (on ? " on" : "")} style={{ ["--cc" as string]: c, ["--ct" as string]: t, width: size, height: size }}>
      <span>{v}</span>
    </div>
  );
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function RouletteEngine({ slug }: { slug: string }) {
  const cfg = rouletteBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [chip, setChip] = useState(10);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [spinning, setSpinning] = useState(false);
  const [number, setNumber] = useState(0);
  const [lastResult, setLastResult] = useState<RouletteResult | null>(null);
  const [history, setHistory] = useState<number[]>([14, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25, 17]);
  const [hot, setHot] = useState<number[]>([17, 32, 7, 19, 23]);
  const [cold, setCold] = useState<number[]>([13, 28, 4, 22, 35]);
  const [lucky, setLucky] = useState<number[]>([7, 17, 23, 32, 11]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("kr_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const totalBet = Object.keys(bets).reduce(function (a, k) { return a + bets[k]; }, 0);

  const placeBet = useCallback(function (type: string) {
    if (spinning) return;
    getAudio().chip();
    setBets(function (b) {
      const n: Record<string, number> = {};
      Object.keys(b).forEach(function (k) { n[k] = b[k]; });
      n[type] = (n[type] || 0) + chip;
      return n;
    });
  }, [spinning, chip]);

  const clearBets = useCallback(function () {
    if (spinning) return;
    getAudio().click();
    setBets({});
  }, [spinning]);

  const doubleBets = useCallback(function () {
    if (spinning) return;
    getAudio().click();
    setBets(function (b) {
      const n: Record<string, number> = {};
      Object.keys(b).forEach(function (k) { n[k] = b[k] * 2; });
      return n;
    });
  }, [spinning]);

  const spin = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (totalBet < 1) { setErr("Place at least one chip"); getAudio().warn(); return; }
    if (totalBet > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setLastResult(null);
    busyRef.current = true; setSpinning(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;

    const tempNumber = Math.floor(Math.random() * 37);
    setNumber(tempNumber);

    try {
      const r = await fetch("/api/kb2/roulette", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, bets: bets }) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setSpinning(false); setErr(d.error || "Spin rejected"); getAudio().warn(); return; }

      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + totalBet, won: s.won + d.paid }; });

      await new Promise(function (res) { window.setTimeout(res, 4600); });

      setNumber(d.result.number);
      setHistory(function (h) { return [d.result.number].concat(h).slice(0, 15); });
      setHot(d.result.hot.slice(0, 6));
      setCold(d.result.cold.slice(0, 6));
      if (d.result.lucky && d.result.lucky.length > 0) setLucky(d.result.lucky);
      setLastResult(d.result);

      if (d.paid > 0) {
        if (d.result.lucky && d.result.lucky.indexOf(d.result.number) >= 0) { getAudio().mega(); toast("LUCKY HIT! +" + fmt(d.paid), "j"); }
        else { getAudio().win(); toast(d.result.number + " - WIN +" + fmt(d.paid), "j"); }
      } else {
        getAudio().lose();
        toast(d.result.number + " - no win", "e");
      }

      setBets({});
      refresh();
      busyRef.current = false; setSpinning(false);

      const a = autoRef.current;
      if (a.left > 0) {
        const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
        const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - totalBet + d.paid)) >= a.stopLoss;
        const next = a.left - 1;
        if (stopWin || stopLoss || next <= 0) {
          setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        } else {
          setAuto(function (o) { return Object.assign({}, o, { left: next }); });
          window.setTimeout(function () { void spin(); }, 1500);
        }
      }
    } catch (e) {
      busyRef.current = false; setSpinning(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, bets, totalBet, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void spin();
  }, [me, spin]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("kr_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);

  const getBet = function (type: string): number { return bets[type] || 0; };

  return (
    <div className="kr" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="kr-top">
        <Link href="/casino" className="kr-back">Lobby</Link>
        <span className="kr-demo">DEMO - no real money</span>
        <b className="kr-title">{cfg.name}</b>
        <div className="kr-sp"/>
        <div className="kr-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"kr-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      {cfg.type === "lightning" && lucky.length > 0 && (
        <div className="kr-lucky">
          <span>LUCKY NUMBERS</span>
          {lucky.map(function (n) { return <b key={n} className={n === 0 ? "g" : REDS.indexOf(n) >= 0 ? "r" : "k"}>{n}</b>; })}
        </div>
      )}

      <div className="kr-body">
        <div className="kr-left">
          <div className="kr-wheelbox" style={{ background: "radial-gradient(80% 80% at 50% 30%," + cfg.felt.replace("linear-gradient", "rgba").replace(/.*?,/,"").replace(")",",0.3)") + ", #0a1018)" }}>
            <div className="kr-readout">
              {lastResult ? <b className={lastResult.color === "red" ? "r" : lastResult.color === "green" ? "g" : "b"}>{lastResult.number} {lastResult.color.toUpperCase()}</b> : <b className="wait">{spinning ? "SPINNING" : "PLACE BETS"}</b>}
            </div>
            <div className="kr-pointer" style={{ borderTopColor: cfg.accent2 }}/>
            <WheelSVG number={number} spinning={spinning} hue={cfg.accent}/>
            {lastResult && (
              <div className={"kr-result " + (lastResult.color)}>
                <b>{lastResult.number}</b>
                <span>{lastResult.color.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="kr-history">
            <span>HISTORY</span>
            {history.map(function (n, i) { return <b key={i} className={n === 0 ? "g" : REDS.indexOf(n) >= 0 ? "r" : "k"}>{n}</b>; })}
          </div>
        </div>

        <div className="kr-right">
          <div className="kr-table">
            <button className="kr-zero" onClick={function () { placeBet("n0"); }} disabled={spinning}>
              0
              {getBet("n0") > 0 && <i>{getBet("n0")}</i>}
            </button>
            <div className="kr-nums">
              {ROWS.map(function (row, ri) {
                return (
                  <div key={ri} className="kr-row">
                    {row.map(function (n) {
                      const k = "n" + n;
                      return (
                        <button key={n} className={"kr-n " + (REDS.indexOf(n) >= 0 ? "r" : "b")} disabled={spinning} onClick={function () { placeBet(k); }}>
                          {n}
                          {getBet(k) > 0 && <i>{getBet(k)}</i>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="kr-outside">
              {OUTSIDE.map(function (o) {
                const cls = "kr-o" + (o.r ? " r" : o.b ? " b" : "");
                return (
                  <button key={o.k} className={cls + (getBet(o.k) > 0 ? " on" : "")} disabled={spinning} onClick={function () { placeBet(o.k); }}>
                    {o.l}
                    {getBet(o.k) > 0 && <i>{getBet(o.k)}</i>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="kr-chips-row">
            {CHIPS.map(function (ch) {
              return <button key={ch.v} onClick={function () { getAudio().click(); setChip(ch.v); }}><ChipIcon v={ch.v} c={ch.c} t={ch.t} size={42} on={chip === ch.v}/></button>;
            })}
          </div>

          <div className="kr-stats-row">
            <div className="kr-stat"><span>Total Bet</span><b>{fmt(totalBet)} TD</b></div>
            <div className="kr-stat"><span>Balance</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
          </div>

          <div className="kr-actions">
            <button className="kr-clear" disabled={spinning || totalBet === 0} onClick={clearBets}>CLEAR</button>
            <button className="kr-double" disabled={spinning || totalBet === 0} onClick={doubleBets}>DOUBLE</button>
            <button className="kr-spinbtn" disabled={spinning || !me || totalBet === 0} onClick={spin}>{spinning ? "SPINNING" : "SPIN"}</button>
          </div>

          <div className="kr-hotcold">
            <div><span>HOT</span>{hot.map(function (n) { return <b key={n} className={n === 0 ? "g" : REDS.indexOf(n) >= 0 ? "r" : "k"}>{n}</b>; })}</div>
            <div><span>COLD</span>{cold.map(function (n) { return <b key={n} className={n === 0 ? "g" : REDS.indexOf(n) >= 0 ? "r" : "k"}>{n}</b>; })}</div>
          </div>

          {err && <div className="kr-err">{err}</div>}

          <button className="kr-auto-btn" disabled={spinning || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>
          {auto.left > 0 && <div className="kr-autostatus">Auto: {auto.left} spins left</div>}

          <p className="kr-note">European roulette has 37 pockets (0-36). The single zero gives the house a 2.7% edge. TD has no monetary value.</p>
        </div>
      </div>

      {intro && (
        <div className="kr-modal">
          <div className="kr-intro" style={{ background: cfg.felt }}>
            <WheelSVG number={0} spinning={false} hue={cfg.accent}/>
            <h2>{cfg.name}</h2>
            <p className="kr-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="kr-ivol">{cfg.type.toUpperCase()} - {cfg.pockets || 37} POCKETS</span>
            <label className="kr-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="kr-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="kr-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="kr-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="kr-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="kr-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="kr-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="kr-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}