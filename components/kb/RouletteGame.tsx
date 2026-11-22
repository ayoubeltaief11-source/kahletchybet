"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { WHEEL, isRed } from "@/lib/kb/wheel";
import { sigOf, LAYOUT_NAME, FRAME_NAME } from "@/lib/kb/sig";
import { useKbAudio } from "./audio";

interface Bets { [k: string]: number; }
const CHIPS = [1, 5, 10, 25, 50];
const CHIP_C = ["#22a85f", "#2f7fd6", "#c9a227", "#a855f7", "#e02020"];
const OUT: [string, string][] = [["d1","1st 12"],["d2","2nd 12"],["d3","3rd 12"],["low","1-18"],["even","EVEN"],["red","RED"],["black","BLACK"],["odd","ODD"],["high","19-36"]];
export default function RouletteGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const sg = sigOf(g.id);
  const [chip, setChip] = useState(5);
  const [bets, setBets] = useState<Bets>({});
  const [spin, setSpin] = useState(false);
  const [deg, setDeg] = useState(0);
  const [ballDeg, setBallDeg] = useState(0);
  const [out, setOut] = useState<{ n: number; paid: number; tx: string; lucky: boolean } | null>(null);
  const [hist, setHist] = useState<number[]>([14,3,26,0,32,15,19,4,21]);
  const [err, setErr] = useState("");
  const [glow, setGlow] = useState(false);
  const [shake, setShake] = useState(false);
  const tm = useRef<number>(0);
  const ball = useRef<number>(0);
  useEffect(function () { return function () { if (tm.current) clearTimeout(tm.current); if (ball.current) clearInterval(ball.current); }; }, []);

  const total = Object.keys(bets).reduce(function (a, k) { return a + bets[k]; }, 0);
  const place = useCallback(function (s: string) {
    if (spin) return; au.chip();
    setBets(function (b) { const n: Bets = {}; Object.keys(b).forEach(function (k) { n[k] = b[k]; }); n[s] = (n[s] || 0) + chip; return n; });
  }, [chip, spin, au]);
  const clear = useCallback(function () { if (spin) return; au.click(); setBets({}); }, [spin, au]);
  const dbl = useCallback(function () {
    if (spin) return; au.click();
    setBets(function (b) { const n: Bets = {}; Object.keys(b).forEach(function (k) { n[k] = b[k] * 2; }); return n; });
  }, [spin, au]);

  const launch = useCallback(async function () {
    if (spin) return;
    if (!me) { setErr("Sign in to play"); au.warn(); return; }
    if (total < 1) { setErr("Place at least one chip"); au.warn(); return; }
    if (total > me.balance) { setErr("Insufficient TD balance"); au.warn(); return; }
    setErr(""); setSpin(true); setOut(null); au.spin();
    let d: { ok: boolean; error?: string; number: number; paid: number; tx: string };
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "roulette", stake: total, bets: bets }) });
      d = await r.json();
    } catch (e) { setSpin(false); setErr("Network error - try again"); return; }
    if (!d.ok) { setSpin(false); setErr(d.error || "Spin rejected"); au.warn(); return; }
    refresh();
    const n = d.number, i = WHEEL.indexOf(n);
    setDeg(function (v) { return v + 1800 + (360 - i * (360 / 37)); });
    setBallDeg(function (v) { return v - 2160 - i * (360 / 37); });
    ball.current = window.setInterval(function () { au.ball(); }, 190);
    tm.current = window.setTimeout(function () {
      clearInterval(ball.current); ball.current = 0;
      const lucky = sg.lucky.indexOf(n) >= 0;
      setOut({ n: n, paid: d.paid, tx: d.tx, lucky: lucky });
      setHist(function (h) { return [n].concat(h).slice(0, 14); });
      setSpin(false);
      if (d.paid > 0) {
        if (lucky) { au.big(); setGlow(true); setTimeout(function () { setGlow(false); }, 1400); } else au.win();
        toast(n + (lucky ? " LUCKY" : "") + " - WIN " + fmt(d.paid) + "  ID " + d.tx, "j");
      } else { au.lose(); setShake(true); setTimeout(function () { setShake(false); }, 300); toast(n + " - no win  ID " + d.tx, "e"); }
      refresh();
    }, 3400);
  }, [spin, me, total, bets, g.id, sg.lucky, refresh, au, toast]);

  const wood = g.variant === "wood", vip = g.variant === "vip";
  const rim = wood ? "#8d6e63" : vip ? "#e8b33c" : g.hue;
  const hub = wood ? "#3e2723" : vip ? "#1a1a12" : "#0b0f16";
  const nums = Array.from({ length: 12 }, function (_, i) { return i * 3 + 3; });
  const mids = Array.from({ length: 12 }, function (_, i) { return i * 3 + 2; });
  const lows = Array.from({ length: 12 }, function (_, i) { return i * 3 + 1; });
  const hot = hist.slice(0, 6).filter(function (n) { return isRed(n); }).length >= 4 ? "RED STREAK" : hist.slice(0, 6).filter(function (n) { return n !== 0 && !isRed(n); }).length >= 4 ? "BLACK STREAK" : "BALANCED";

  return (
    <div className={"kbr L" + sg.layout + " f" + sg.frame + (glow ? " kb-glow" : "") + (shake ? " kb-shake" : "")} style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - {LAYOUT_NAME[sg.layout]} - {FRAME_NAME[sg.frame]} - RTP {(rtp * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbr-lucky">
        <span>LUCKY NUMBERS</span>
        {sg.lucky.map(function (n) { return <b key={n} className={n === 0 ? "g" : isRed(n) ? "r" : "k"}>{n}</b>; })}
        <em>{hot}</em>
      </div>
      <div className="kbr-body">
        <div className="kbr-left">
          <div className="kbr-wheelbox" style={{ background: "radial-gradient(80% 80% at 50% 30%," + g.sky[1] + "60, transparent 70%), linear-gradient(165deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
            <div className="kbr-read">{out ? <b className={isRed(out.n) ? "r" : out.n === 0 ? "g" : "b"}>{out.n} {out.n === 0 ? "ZERO" : isRed(out.n) ? "RED" : "BLACK"}</b> : <b className="wait">{spin ? "SPINNING" : "PLACE BETS"}</b>}</div>
            <div className="kbr-pointer" style={{ borderTopColor: rim }}/>
            <svg viewBox="0 0 200 200" className="kbr-wheel" style={{ transform: "rotate(" + deg + "deg)" }}>
              <defs>
                <radialGradient id={"wr" + g.id} cx="0.5" cy="0.4"><stop offset="0%" stopColor={hub}/><stop offset="100%" stopColor="#05070b"/></radialGradient>
                <linearGradient id={"wg" + g.id} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={rim}/><stop offset="45%" stopColor="#fff8e0"/><stop offset="100%" stopColor={rim}/></linearGradient>
              </defs>
              <circle cx="100" cy="100" r="99" fill={"url(#wg" + g.id + ")"}/>
              <circle cx="100" cy="100" r="93" fill={hub}/>
              {WHEEL.map(function (p, i) {
                const a0 = i * 360 / 37 - 90 - 360 / 74, a1 = a0 + 360 / 37;
                const pt = function (a: number, r: number): [number, number] { return [100 + r * Math.cos(a * Math.PI / 180), 100 + r * Math.sin(a * Math.PI / 180)]; };
                const A = pt(a0, 90), B = pt(a1, 90), C = pt(a1, 58), D = pt(a0, 58);
                const fill = p === 0 ? "#0c7a4e" : isRed(p) ? "#c4202f" : "#12161f";
                const T = pt((a0 + a1) / 2, 75);
                const lk = sg.lucky.indexOf(p) >= 0;
                return (<g key={i}>
                  <path d={"M" + A[0] + " " + A[1] + " A90 90 0 0 1 " + B[0] + " " + B[1] + " L" + C[0] + " " + C[1] + " A58 58 0 0 0 " + D[0] + " " + D[1] + " Z"} fill={fill} stroke={lk ? "#ffd97a" : rim} strokeWidth={lk ? "1.4" : "0.5"}/>
                  <text x={T[0]} y={T[1]} fill={lk ? "#ffd97a" : "#fff"} fontSize="7.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={"rotate(" + ((a0 + a1) / 2 + 90) + " " + T[0] + " " + T[1] + ")"}>{p}</text>
                </g>);
              })}
              <circle cx="100" cy="100" r="58" fill={"url(#wr" + g.id + ")"} stroke={rim} strokeWidth="1.6"/>
              {Array.from({ length: 8 }).map(function (_, i) { const a = i * 45 * Math.PI / 180; return <line key={i} x1={100 + 16 * Math.cos(a)} y1={100 + 16 * Math.sin(a)} x2={100 + 54 * Math.cos(a)} y2={100 + 54 * Math.sin(a)} stroke={rim} strokeWidth="1.1" opacity="0.55"/>; })}
              <circle cx="100" cy="100" r="17" fill={rim} opacity="0.9"/>
              <circle cx="100" cy="100" r="9" fill={hub}/>
            </svg>
            <div className="kbr-balltrack" style={{ transform: "rotate(" + ballDeg + "deg)" }}><i/></div>
            {out && <div className={"kbr-out " + (out.paid > 0 ? "win" : "lose") + (out.lucky ? " lucky" : "")}>{out.lucky ? "LUCKY HIT " : ""}{out.paid > 0 ? "+" + fmt(out.paid) : "-" + fmt(total)}<em>ID {out.tx}</em></div>}
          </div>
          <div className="kbr-hist"><span>HISTORY</span>{hist.map(function (n, i) { return <b key={i} className={(n === 0 ? "g" : isRed(n) ? "r" : "b") + (sg.lucky.indexOf(n) >= 0 ? " lk" : "")}>{n}</b>; })}</div>
        </div>
        <div className="kbr-right">
          <div className="kbr-table">
            <button className="kbr-zero" onClick={function () { place("n0"); }} disabled={spin}>0{bets["n0"] ? <i>{bets["n0"]}</i> : null}</button>
            <div className="kbr-nums">
              {[nums, mids, lows].map(function (row, ri) {
                return (<div key={ri} className="kbr-row">{row.map(function (n) {
                  const k = "n" + n;
                  return <button key={n} className={"kbr-n " + (isRed(n) ? "r" : "b") + (sg.lucky.indexOf(n) >= 0 ? " lk" : "")} disabled={spin} onClick={function () { place(k); }}>{n}{bets[k] ? <i>{bets[k]}</i> : null}</button>;
                })}</div>);
              })}
            </div>
            <div className="kbr-out-grid">
              {OUT.map(function (o) { const k = o[0]; return <button key={k} className={"kbr-o " + (k === "red" ? "r" : k === "black" ? "b" : "") + (bets[k] ? " on" : "")} disabled={spin} onClick={function () { place(k); }}>{o[1]}{bets[k] ? <i>{bets[k]}</i> : null}</button>; })}
            </div>
          </div>
          <div className="kbr-chips">{CHIPS.map(function (c, i) { return <button key={c} className={"kbr-chip" + (chip === c ? " on" : "")} style={{ ["--cc" as string]: CHIP_C[i] }} onClick={function () { au.chip(); setChip(c); }}>{c}</button>; })}</div>
          <div className="kbx-bal"><span>Total stake</span><b>{fmt(total)}</b></div>
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbr-acts">
            <button className="kbr-clear" disabled={spin || total === 0} onClick={clear}>CLEAR</button>
            <button className="kbr-dbl" disabled={spin || total === 0} onClick={dbl}>DOUBLE</button>
            <button className="kbr-spin" disabled={spin || !me || total === 0} onClick={launch}>{spin ? "SPINNING" : "SPIN"}</button>
          </div>
          {err && <div className="kbx-err">{err}</div>}
          <p className="kbx-note">Lucky numbers are a visual highlight only - payouts stay at true 37-pocket odds. The single zero is the house edge.</p>
        </div>
      </div>
    </div>
  );
}
