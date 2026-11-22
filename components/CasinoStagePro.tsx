"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./Shell";
import SlotSymbol, { Rocket } from "./SlotSymbols";
import { fmt } from "@/lib/catalog";
const WHEEL_US = ["0","28","9","26","30","11","7","20","32","17","5","22","34","15","3","24","36","13","1","00","27","10","25","29","12","8","19","31","18","6","21","33","16","4","23","35","14","2"]; const fiatRef = (n: number) => "~$" + (n * 0.1).toFixed(2);
const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export default function CasinoStagePro({ title }: { title: any }) {
  const { me, refresh, toast } = useApp();
  const [stake, setStake] = useState("5");
  const [choice, setChoice] = useState("red");
  const [target, setTarget] = useState("2.00");
  const [busy, setBusy] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [rowsPer, setRowsPer] = useState<number[]>([3,3,3,3,3]);
  const [hits, setHits] = useState<number[]>([]);
  const [pocket, setPocket] = useState<string>("0");
  const [pcolor, setPcolor] = useState<string>("green");
  const [spin, setSpin] = useState(false);
  const [wheelDeg, setWheelDeg] = useState(0);
  const [live, setLive] = useState(1);
  const [crashed, setCrashed] = useState(false);
  const [msg, setMsg] = useState("");
  const [winAmt, setWinAmt] = useState(0);
  const [hist, setHist] = useState<{ m: number; w: boolean }[]>([]);
  const timers = useRef<any[]>([]);

  useEffect(() => {
    if (title.engine === "slots") {
      const rp = title.mechanic === "megaways" ? [3,4,3,4,3,2] : [3,3,3,3,3];
      setRowsPer(rp); setGrid(rp.map(n => Array.from({ length: n }, (_, i) => title.symbols[i % title.symbols.length])));
    }
    return () => { timers.current.forEach(clearTimeout); timers.current.forEach(clearInterval); };
  }, [title.slug]);

  const later = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.current.push(id); };

  const play = async () => {
    if (!me) return toast("Sign in to play", "e");
    const s = Number(stake);
    if (!isFinite(s) || s < 1) return toast("Minimum stake is 1 TD", "e");
    if (s > me.balance) return toast("Insufficient TD balance", "e");
    setBusy(true); setMsg(""); setWinAmt(0); setHits([]); setCrashed(false);
    try {
      const r = await fetch("/api/casino/play", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: title.slug, stake: s, choice, target: Number(target) || 2 }) });
      const d = await r.json();
      if (!d.ok) { setBusy(false); return toast(d.error ?? "Round failed", "e"); }
      run(d);
    } catch { setBusy(false); toast("Network error", "e"); }
  };

  const run = (d: any) => {
    if (title.engine === "slots") {
      setSpin(true);
      const rp: number[] = d.view.rowsPer ?? [3,3,3,3,3];
      const iv = setInterval(() => { setGrid(rp.map(n => Array.from({ length: n }, () => title.symbols[Math.floor(Math.random() * title.symbols.length)]))); }, 70);
      timers.current.push(iv);
      later(() => {
        clearInterval(iv); setSpin(false); setRowsPer(rp); setGrid(d.view.grid);
        if (d.view.steps && d.view.steps.length > 1) {
          let i = 0; const seq = d.view.steps;
          const step = () => { setGrid(seq[i].grid); setHits(seq[i].hits); setWinAmt(Math.round(Number(stake) * seq.slice(0, i + 1).reduce((a: number, x: any) => a + x.pay, 0) * 100) / 100); i++; if (i < seq.length) later(step, 620); else finish(d); };
          step();
        } else { setHits(d.view.hits ?? []); finish(d); }
      }, 1150);
      return;
    }
    if (title.engine === "roulette") {
      setSpin(true);
      const idx = Number(d.view.index ?? 0);
      setWheelDeg(v => v + 1800 + (360 - idx * (360 / 38)));
      const iv = setInterval(() => { const r = WHEEL_US[Math.floor(Math.random() * WHEEL_US.length)]; setPocket(r); setPcolor(r === "0" || r === "00" ? "green" : REDS.includes(Number(r)) ? "red" : "black"); }, 70);
      timers.current.push(iv);
      later(() => { clearInterval(iv); setSpin(false); setPocket(d.view.pocket); setPcolor(d.view.color); finish(d); }, 3400);
      return;
    }
    const curve: number[] = d.view.curve ?? [1];
    let i = 0;
    const iv = setInterval(() => { i++; setLive(curve[Math.min(i, curve.length - 1)]); if (i >= curve.length - 1) { clearInterval(iv); setCrashed(true); finish(d); } }, 85);
    timers.current.push(iv);
  };

  const finish = (d: any) => {
    setBusy(false); setWinAmt(d.payout);
    setHist(h => [{ m: d.mult, w: d.win }, ...h].slice(0, 16));
    setMsg(d.win ? "WIN " + fmt(d.payout) + "   " + d.mult.toFixed(2) + "x" : "No win this round");
    refresh();
  };

  return (
    <div className="pro-split">
      <div className="pro-stage" style={{ background: `radial-gradient(80% 100% at 50% 0%, ${title.hue}26, #05070C 72%)` }}>
        <div className="pro-top">
          <span className="kb-demobadge">Demo</span>
          <span className="pro-chip">{title.label}</span>
          <span className="pro-chip">RTP {title.rtp}%</span>
        </div>
        {title.engine === "slots" && (
          <div className={"pro-reels" + (spin ? " spinning" : "")} style={{ gridTemplateColumns: `repeat(${grid.length || 5}, 1fr)` }}>
            {grid.map((col, c) => (<div key={c} className="pro-col">{col.map((s, r) => { let idx = 0; for (let i = 0; i < c; i++) idx += grid[i].length; idx += r; const hit = hits.includes(idx); return (<div key={r} className={"pro-cell" + (hit ? " hit" : "")} style={hit ? { borderColor: title.hue, boxShadow: `0 0 0 2px ${title.hue}, 0 0 22px ${title.hue}88` } : undefined}><SlotSymbol k={s} size={54} /></div>); })}</div>))}
          </div>
        )}
        {title.engine === "roulette" && (
          <div className="pro-wheelwrap">
            <svg viewBox="0 0 200 200" className="pro-wheel" style={{ transform: `rotate(${wheelDeg}deg)` }}>
              <defs><radialGradient id="hub"><stop offset="0%" stopColor="#2A3446" /><stop offset="100%" stopColor="#0B0F14" /></radialGradient></defs>
              {WHEEL_US.map((n, i) => {
                const a0 = (i * 360) / 38 - 90, a1 = ((i + 1) * 360) / 38 - 90;
                const r0 = 62, r1 = 96;
                const p = (ang: number, rad: number) => [100 + rad * Math.cos((ang * Math.PI) / 180), 100 + rad * Math.sin((ang * Math.PI) / 180)];
                const [x0, y0] = p(a0, r1), [x1, y1] = p(a1, r1), [x2, y2] = p(a1, r0), [x3, y3] = p(a0, r0);
                const fill = n === "0" || n === "00" ? "#0C7A4E" : REDS.includes(Number(n)) ? "#C42B3C" : "#141C2C";
                const [tx, ty] = p((a0 + a1) / 2, 80);
                return (<g key={i}><path d={`M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z`} fill={fill} stroke="#E8B33C" strokeWidth="0.5" /><text x={tx} y={ty} fill="#fff" fontSize="7" fontWeight="700" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(a0 + a1) / 2 + 90} ${tx} ${ty})`}>{n}</text></g>);
              })}
              <circle cx="100" cy="100" r="62" fill="url(#hub)" stroke="#E8B33C" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="26" fill="#0B0F14" stroke="#E8B33C" strokeWidth="1" />
            </svg>
            <div className="pro-pointer" />
            <div className={"pro-pocket " + pcolor + (spin ? " spinning" : "")}>{pocket}</div>
          </div>
        )}
        {title.engine === "crash" && (
          <div className="pro-crash">
            <svg viewBox="0 0 320 170" className="pro-graph">
              <defs><linearGradient id="cg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#12D18E" /><stop offset="100%" stopColor={title.hue} /></linearGradient></defs>
              {[0,1,2,3,4].map(i => <line key={i} x1="0" y1={20 + i * 32} x2="320" y2={20 + i * 32} stroke="#1E293B" strokeWidth="0.6" />)}
              {[0,1,2,3,4,5,6].map(i => <line key={"v"+i} x1={i * 52} y1="0" x2={i * 52} y2="170" stroke="#1E293B" strokeWidth="0.4" />)}
              <polyline points={Array.from({ length: 31 }, (_, i) => { const t = i / 30; const v = 1 + (live - 1) * Math.pow(t, 1.35); return `${t * 300 + 10},${160 - Math.min(150, (v - 1) * 26)}`; }).join(" ")} fill="none" stroke={crashed && !msg.startsWith("WIN") ? "#FF4757" : "url(#cg2)"} strokeWidth="2.6" strokeLinejoin="round" />
            </svg>
            <div className="pro-rocket" style={{ left: `${Math.min(88, 8 + (live - 1) * 12)}%`, bottom: `${Math.min(74, 10 + (live - 1) * 11)}%` }}><Rocket size={44} /></div>
            <div className="pro-mult" style={{ color: crashed && !msg.startsWith("WIN") ? "#FF4757" : title.hue }}>{live.toFixed(2)}x</div>
            <div className="pro-target">Cash-out target {Number(target).toFixed(2)}x</div>
          </div>
        )}
        <div className="pro-result" style={{ color: msg.startsWith("WIN") ? "var(--gold-hi)" : "var(--dim)" }}>{msg || "Set your demo stake and press PLAY"}</div>
        {winAmt > 0 && <div className="pro-winbar"><span>Round return</span><b>{fmt(winAmt)}</b><i>{fiatRef(winAmt)} ref</i></div>}
        <div className="pro-hist">{hist.map((h, i) => <span key={i} className={"pro-hpill " + (h.w ? "up" : "down")}>{h.w ? h.m.toFixed(2) + "x" : "-"}</span>)}</div>
      </div>
      <div className="pro-panel">
        <div className="bt mb"><h3 className="h3" style={{ margin: 0 }}>Round controls</h3><span className="kb-demobadge">Demo</span></div>
        <label className="f"><span>Stake (TD)</span><input className="in mono" type="number" min={1} step={1} value={stake} disabled={busy} onChange={e => setStake(e.target.value)} /></label>
        <div className="chipline mb">
          {[1,5,10,20].map(v => <button key={v} className="btn o s" disabled={busy} onClick={() => setStake(String(v))}>{v}</button>)}
          {me && <button className="btn o s" disabled={busy} onClick={() => setStake(String(Math.floor(me.balance)))}>MAX</button>}
        </div>
        {title.engine === "roulette" && (
          <div className="pro-choices">
            {[["red","Red 2x"],["black","Black 2x"],["odd","Odd 2x"],["even","Even 2x"],["low","1-18 2x"],["high","19-36 2x"],["d1","1st 12 3x"],["d2","2nd 12 3x"],["d3","3rd 12 3x"],["zero","0 / 00 18x"]].map(([k,l]) => (<button key={k} className={"pro-choice" + (choice === k ? " on" : "")} disabled={busy} onClick={() => setChoice(k)}>{l}</button>))}
          </div>
        )}
        {title.engine === "crash" && (<label className="f"><span>Auto cash-out (x)</span><input className="in mono" type="number" step="0.1" min="1.1" max="20" value={target} disabled={busy} onChange={e => setTarget(e.target.value)} /></label>)}
        {title.engine === "slots" && (
          <div className="pro-pay">
            <div className="xxs faint mb">{title.mechanic === "cluster" || title.mechanic === "tumble" ? "8+ matching symbols anywhere" : title.mechanic === "megaways" ? "Matching symbols on adjacent reels" : "3+ on a payline from the left"}</div>
            <div className="pro-paygrid">{title.symbols.slice(0, 6).map((s: string, i: number) => (<div key={i} className="pro-paycell"><SlotSymbol k={s} size={30} /><b>{[60,40,25,18,14,12][i] ?? 8}x</b></div>))}</div>
          </div>
        )}
        <button className="btn g w pro-play" disabled={busy} onClick={play}>{busy ? "PLAYING..." : "PLAY"}</button>
        <div className="bt xs mt"><span className="dim">Balance</span><b className="mono" style={{ color: "var(--gold-hi)" }}>{fmt(me?.balance ?? 0)}</b></div>
        <div className="xxs faint ctr">{fiatRef(me?.balance ?? 0)} reference only</div>
        <div className="note g mt">Demo simulation. TD has no monetary value. Results are generated and settled on the server.</div>
      </div>
    </div>
  );
}