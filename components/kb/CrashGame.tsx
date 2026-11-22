"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf, PATH_NAME, ENV_NAME, PACE_NAME, PACE_SPEED } from "@/lib/kb/sig";
import { Jet, Rocket, Zeppelin, Heli } from "./Sym";
import { useKbAudio } from "./audio";

type Phase = "idle" | "arming" | "flying" | "busted" | "cashed";
interface Hist { m: number; win: boolean; }
interface Spark { id: number; x: number; y: number; a: number; c: string; }
export default function CrashGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const sg = sigOf(g.id);
  const [stake, setStake] = useState(5);
  const [autoCash, setAutoCash] = useState(false);
  const [autoAt, setAutoAt] = useState(2);
  const [turbo, setTurbo] = useState(sg.pace === 2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mult, setMult] = useState(1);
  const [count, setCount] = useState(3);
  const [rid, setRid] = useState("");
  const [cid, setCid] = useState("");
  const [paid, setPaid] = useState(0);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [err, setErr] = useState("");
  const [hist, setHist] = useState<Hist[]>([{m:1.42,win:false},{m:3.18,win:true},{m:1.05,win:false},{m:8.24,win:true},{m:2.07,win:true},{m:1.19,win:false},{m:4.56,win:true},{m:1.88,win:false}]);
  const raf = useRef<number>(0);
  const tim = useRef<number>(0);
  const bust = useRef<number>(1);
  const live = useRef<number>(1);
  const flying = useRef<boolean>(false);
  const autoRef = useRef<{ on: boolean; at: number }>({ on: false, at: 2 });
  const sid = useRef<number>(0);

  useEffect(function () { autoRef.current = { on: autoCash, at: autoAt }; }, [autoCash, autoAt]);
  const stop = useCallback(function () {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (tim.current) clearInterval(tim.current);
    raf.current = 0; tim.current = 0; flying.current = false;
  }, []);
  useEffect(function () { return stop; }, [stop]);

  const burst = useCallback(function (n: number, col: string) {
    const arr: Spark[] = [];
    for (let i = 0; i < n; i++) { sid.current += 1; arr.push({ id: sid.current, x: 50 + (Math.random() - 0.5) * 26, y: 46 + (Math.random() - 0.5) * 22, a: Math.random() * 360, c: col }); }
    setSparks(arr);
    setTimeout(function () { setSparks([]); }, 1100);
  }, []);

  const settle = useCallback(async function (m: number, win: boolean, round: string) {
    stop(); live.current = m;
    setHist(function (h) { return [{ m: m, win: win }].concat(h).slice(0, 14); });
    if (win) {
      const amount = Math.round(stake * m * 100) / 100;
      const tx = "C" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
      setPaid(amount); setCid(tx); setPhase("cashed"); setFlash(true);
      setTimeout(function () { setFlash(false); }, 1500);
      if (m >= 5) { au.big(); burst(26, "#ffd97a"); } else { au.cash(); burst(14, "#12d18e"); }
      try {
        const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "crash-cash", roundId: round, mult: m }) });
        const d = await r.json();
        if (d.ok) { refresh(); toast("CASHED " + m.toFixed(2) + "x  +" + fmt(d.paid) + "  ID " + tx, "j"); }
        else { setErr(d.error || "Settlement failed"); au.warn(); }
      } catch (e) { setErr("Network error on settlement"); }
    } else {
      setPaid(0); setCid(""); setPhase("busted"); au.bust(); burst(22, "#ff4757");
      setShake(true); setTimeout(function () { setShake(false); }, 420);
      try { await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "crash-bust", roundId: round }) }); } catch (e) { /* settled locally */ }
      refresh();
      toast("BUSTED at " + m.toFixed(2) + "x  -" + fmt(stake) + "  ID " + round, "e");
    }
  }, [stake, g.id, refresh, toast, au, stop, burst]);

  const fly = useCallback(async function (round: string, target: number) {
    bust.current = target; flying.current = true;
    setPhase("flying"); setMult(1); live.current = 1; au.launch();
    const speed = (turbo ? PACE_SPEED[2] : PACE_SPEED[sg.pace]);
    const t0 = performance.now();
    const loop = function () {
      if (!flying.current) return;
      const el = (performance.now() - t0) / 1000;
      const m = Math.pow(Math.E, speed * el);
      live.current = m; setMult(Math.round(m * 100) / 100);
      if (Math.floor(m * 20) % 4 === 0) au.tick(m);
      const a = autoRef.current;
      if (a.on && m >= a.at && m < bust.current) { void settle(a.at, true, round); return; }
      if (m >= bust.current) { void settle(bust.current, false, round); return; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [turbo, sg.pace, au, settle]);

  const begin = useCallback(async function () {
    if (!me) { setErr("Sign in to play"); au.warn(); return; }
    if (!isFinite(stake) || stake < 1) { setErr("Minimum stake is 1 TD"); au.warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); au.warn(); return; }
    if (flying.current) return;
    setErr(""); au.click(); setPaid(0); setCid(""); setPhase("arming"); setCount(3);
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "crash-start", stake: stake }) });
      const d = await r.json();
      if (!d.ok) { setPhase("idle"); setErr(d.error || "Bet rejected"); au.warn(); return; }
      refresh(); setRid(d.roundId);
      let c = 3;
      au.count(3);
      tim.current = window.setInterval(function () {
        c -= 1; setCount(c); if (c > 0) au.count(c);
        if (c <= 0) { clearInterval(tim.current); tim.current = 0; void fly(d.roundId, d.crashAt); }
      }, 620);
    } catch (e) { setPhase("idle"); setErr("Network error - try again"); }
  }, [me, stake, g.id, refresh, au, fly]);

  const manual = useCallback(function () {
    if (phase !== "flying" || !flying.current) return;
    void settle(Math.round(live.current * 100) / 100, true, rid);
  }, [phase, settle, rid]);

  const prog = Math.min(1, (mult - 1) / 6);
  let cx = 8 + prog * 74, cy = 84 - prog * 66;
  if (sg.path === 1) { cx = 8 + prog * 76; cy = 84 - Math.pow(prog, 1.6) * 68; }
  else if (sg.path === 2) { cx = 8 + prog * 66 + Math.sin(prog * 9) * 7; cy = 84 - prog * 64 + Math.cos(prog * 9) * 4; }
  else if (sg.path === 3) { cx = 8 + Math.floor(prog * 8) * 9.4; cy = 84 - Math.floor(prog * 8) * 8.2; }
  const curve = sg.path === 3
    ? "M8,88 " + Array.from({ length: 9 }).map(function (_, i) { return "L" + (8 + i * 9.4) + "," + (88 - i * 8.2); }).join(" ")
    : sg.path === 2
      ? "M8,88 " + Array.from({ length: 25 }).map(function (_, i) { const p = (i / 24) * prog; return "L" + (8 + p * 66 + Math.sin(p * 9) * 7) + "," + (84 - p * 64 + Math.cos(p * 9) * 4); }).join(" ")
      : "M8,88 Q" + (8 + prog * 42) + "," + (88 - Math.pow(prog, 1.6) * 14) + " " + cx + "," + cy;
  const busy = phase === "arming" || phase === "flying";
  const Craft = g.variant === "rocket" ? Rocket : g.variant === "zeppelin" ? Zeppelin : g.variant === "heli" ? Heli : Jet;
  const rot = g.variant === "rocket" ? 0 : -18 - prog * 12;

  return (
    <div className={"kbx e" + sg.env + (flash ? " kb-flash" : "") + (shake ? " kb-shake" : "")} style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - {PATH_NAME[sg.path]} - {ENV_NAME[sg.env]} - {PACE_NAME[sg.pace]} - RTP {(rtp * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbx-hist">
        {hist.map(function (h, i) { return <span key={i} className={"kb-pill " + (h.m >= 5 ? "mega" : h.win ? "hi" : h.m < 1.5 ? "lo" : "mid")}>{h.m.toFixed(2)}x</span>; })}
      </div>
      <div className="kbx-body">
        <div className="kbx-stage" style={{ background: "radial-gradient(120% 100% at 20% 100%," + g.sky[1] + "60, transparent 60%), linear-gradient(165deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbx-stars"/>
          {sg.env === 1 && <div className="kbx-clouds"><i/><i/><i/></div>}
          {sg.env === 2 && <div className="kbx-city"/>}
          {sg.env === 3 && <div className="kbx-aurora"/>}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="kbx-svg">
            <defs>
              <linearGradient id={"tr" + g.id} x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor={g.hue} stopOpacity="0.12"/><stop offset="100%" stopColor={g.hue}/></linearGradient>
              <linearGradient id={"ar" + g.id} x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor={g.hue} stopOpacity="0.02"/><stop offset="100%" stopColor={g.hue} stopOpacity="0.3"/></linearGradient>
            </defs>
            {[20,40,60,80].map(function (y) { return <line key={y} x1="6" y1={y} x2="98" y2={y} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="0.3"/>; })}
            <path d={curve + " L" + cx + ",92 L8,92 Z"} fill={"url(#ar" + g.id + ")"}/>
            <path d={curve} fill="none" stroke={"url(#tr" + g.id + ")"} strokeWidth="1.5" strokeLinecap="round"/>
            {phase === "flying" && <circle cx={cx} cy={cy} r="2.6" fill={g.hue} opacity="0.5"/>}
          </svg>
          <div className={"kbx-craft" + (phase === "flying" ? " alive" : "")} style={{ left: cx + "%", top: cy + "%", opacity: phase === "idle" ? 0.32 : 1, transform: "translate(-50%,-50%) rotate(" + rot + "deg)" }}>
            <Craft size={98} hue={g.hue}/>
          </div>
          <div className={"kbx-mult" + (phase === "busted" ? " bust" : phase === "cashed" ? " cash" : "")}>{mult.toFixed(2)}<i>x</i></div>
          {phase === "flying" && <div className="kbx-live">POTENTIAL {fmt(stake * mult)}</div>}
          {phase === "arming" && <div className="kbx-count"><b>{count}</b><span>LAUNCHING</span></div>}
          {phase === "busted" && <div className="kbx-tag bust">BUSTED @ {mult.toFixed(2)}x<em>Round {rid}</em></div>}
          {phase === "cashed" && <div className="kbx-tag cash"><b>+{fmt(paid)}</b><span>CASHOUT ID {cid}</span><em>Round {rid} @ {mult.toFixed(2)}x</em></div>}
          {phase === "idle" && <div className="kbx-tag idle">Place a stake to launch</div>}
          <div className="kbx-sparks">{sparks.map(function (s) { return <i key={s.id} style={{ left: s.x + "%", top: s.y + "%", background: s.c, ["--a" as string]: s.a + "deg" }}/>; })}</div>
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return Math.max(1, Math.round((v - 1) * 100) / 100); }); }}>-</button>
              <input type="number" min={1} step={1} value={stake} disabled={busy} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return Math.round((v + 1) * 100) / 100; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">
            {[1,5,20,50,100].map(function (v) { return <button key={v} disabled={busy} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}
            <button disabled={busy} onClick={function () { au.chip(); setStake(Math.max(1, Math.floor(me ? me.balance : 1))); }}>MAX</button>
          </div>
          <div className="kbx-toggle">
            <label><input type="checkbox" checked={autoCash} onChange={function (e) { setAutoCash(e.target.checked); au.click(); }}/><span>Auto cashout</span></label>
            <input className="kbx-mini" type="number" min={1.1} step={0.1} value={autoAt} disabled={!autoCash} onChange={function (e) { setAutoAt(Math.max(1.1, Number(e.target.value) || 1.1)); }}/>
            <span className="kbx-x">x</span>
          </div>
          <div className="kbx-toggle"><label><input type="checkbox" checked={turbo} onChange={function (e) { setTurbo(e.target.checked); au.click(); }}/><span>Turbo climb</span></label></div>
          {phase === "flying"
            ? <button className="kbx-cashbtn" onClick={manual}>CASH OUT<b>{fmt(stake * mult)}</b><i>@ {mult.toFixed(2)}x</i></button>
            : <button className="kbx-play" disabled={phase === "arming" || !me} onClick={begin}>{phase === "arming" ? "ARMING..." : "PLACE BET"}</button>}
          {err && <div className="kbx-err">{err}</div>}
          <p className="kbx-note">Educational simulation. TD carries no monetary value. Waiting longer increases both payout and bust probability.</p>
        </aside>
      </div>
    </div>
  );
}
