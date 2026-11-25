"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { getGame, asset } from "../../registry";
import { COLS, ROWS, computeSteps, makeGrid, mulberry32, NORMAL_WEIGHTS, PAYS } from "./engine";
import type { Cell, SymId } from "./engine";
import "./atlas.css";
import { atlasSfx } from "./sfx";

const GLYPH: Record<string, string> = { s1:"✶", s2:"☾", s3:"☀", s4:"✧", s5:"⌛", s6:"◉", s7:"♛", s8:"⚔", s9:"◍" };
const SYMCOL: Record<string, string> = { s1:"#2DD4D4", s2:"#9ad7ff", s3:"#ffd97a", s4:"#ff9a3d", s5:"#C98A3C", s6:"#7ce38b", s7:"#ff4fa3", s8:"#ff5a5a", s9:"#c07aff" };

function SymIcon({ sym, mult }: { sym: SymId; mult?: number }) {
  const [err, setErr] = useState(false);
  if (sym === "mult") return <span className="at-multball">x{mult || 2}</span>;
  if (!err) return <img className="at-symimg" src={"/assets/atlas-skyfall/symbols/" + sym + ".png"} alt="" onError={function () { setErr(true); }}/>;
  return <span className="at-glyph" style={{ color: SYMCOL[sym] || "#fff" }}>{GLYPH[sym] || "?"}</span>;
}

export default function AtlasGame() {
  const g = (function () { try { return getGame("atlas-skyfall"); } catch (e) { return { id: "atlas-skyfall", title: "Atlas Skyfall", type: "cluster", pack: "myth", assetDir: "atlas-skyfall", color: "#2DD4D4", color2: "#C98A3C" }; } })();
  const { me, refresh } = useApp();
  const [bal, setBal] = useState(0);
  const [bet, setBet] = useState(20);
  const [grid, setGrid] = useState<Cell[][]>(function () { return makeGrid(mulberry32(7), NORMAL_WEIGHTS); });
  const [msg, setMsg] = useState("PLACE YOUR BET");
  const [cascade, setCascade] = useState(0);
  const [mult, setMult] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [ante, setAnte] = useState(false);
  const [inFree, setInFree] = useState(false);
  const [fsLeft, setFsLeft] = useState(0);
  const [fsMult, setFsMult] = useState(0);
  const [fsTotal, setFsTotal] = useState(0);
  const [bigWin, setBigWin] = useState<{ amt: number; mult: number } | null>(null);
  const [intro, setIntro] = useState(true);
  const [introHide, setIntroHide] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const multRef = useRef<HTMLSpanElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const skipFns = useRef<(() => void)[]>([]);
  const spinRef = useRef(false);
  const turboRef = useRef(turbo); turboRef.current = turbo;
  const anteRef = useRef(ante); anteRef.current = ante;
  const inFreeRef = useRef(inFree); inFreeRef.current = inFree;
  const fsLeftRef = useRef(fsLeft); fsLeftRef.current = fsLeft;
  const fsMultRef = useRef(fsMult); fsMultRef.current = fsMult;
  const betRef = useRef(bet); betRef.current = bet;
  const runRef = useRef<(free: boolean) => void>(function () {});

  useEffect(function () { if (me) setBal(me.balance); }, [me]);
  useEffect(function () { try { if (window.localStorage.getItem("atlas_intro_hide") === "1") setIntro(false); } catch (e) { /* ignore */ } }, []);
  useEffect(function () {
    function onVis() { if (document.hidden) gsap.globalTimeline.pause(); else gsap.globalTimeline.resume(); }
    document.addEventListener("visibilitychange", onVis);
    return function () {
      document.removeEventListener("visibilitychange", onVis);
      const host = hostRef.current;
      if (host) { gsap.killTweensOf(Array.from(host.querySelectorAll("*"))); host.querySelectorAll(".at-spark,.at-coin,.at-flyball").forEach(function (n) { n.remove(); }); }
      skipFns.current.forEach(function (fn) { fn(); }); skipFns.current = [];
    };
  }, []);

  const div = useCallback(function (ms: number) {
    const d = turboRef.current ? ms / 2.5 : ms;
    return new Promise<void>(function (res) { const t = window.setTimeout(res, d); skipFns.current.push(function () { window.clearTimeout(t); res(); }); });
  }, []);
  const cells = useCallback(function () { return gridRef.current ? Array.from(gridRef.current.querySelectorAll(".at-cell")) as HTMLElement[] : []; }, []);
  const colCells = useCallback(function (c: number) { return gridRef.current ? Array.from(gridRef.current.querySelectorAll('.at-cell[data-c="' + c + '"]')) as HTMLElement[] : []; }, []);

  const dropIn = useCallback(async function (stagger: number) {
    const dur = (turboRef.current ? 380 / 2.5 : 380) / 1000;
    const st = (turboRef.current ? stagger / 2.5 : stagger) / 1000;
    const proms: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      const cc = colCells(c);
      proms.push(new Promise(function (res) {
        gsap.fromTo(cc, { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: dur, ease: "power2.in", delay: c * st, onComplete: function () {
          gsap.to(cc, { scale: 1.06, duration: 0.08, yoyo: true, repeat: 1, ease: "back.out(1.4)", onComplete: function () { gsap.set(cc, { scale: 1 }); atlasSfx.tick(c); res(); } });
        } });
      }));
    }
    await Promise.all(proms);
  }, [colCells]);

  const spawnSparks = useCallback(function (els: HTMLElement[]) {
    const host = hostRef.current; if (!host) return;
    els.forEach(function (el) {
      const r = el.getBoundingClientRect(); const hr = host.getBoundingClientRect();
      for (let i = 0; i < 6; i++) {
        const s = document.createElement("div"); s.className = "at-spark";
        s.style.left = (r.left - hr.left + r.width / 2) + "px"; s.style.top = (r.top - hr.top + r.height / 2) + "px";
        host.appendChild(s);
        const a = Math.random() * 6.283; const d = 30 + Math.random() * 50;
        gsap.to(s, { x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.3, duration: 0.6, ease: "power2.out", onComplete: function () { s.remove(); } });
      }
    });
  }, []);

  const coinRain = useCallback(function () {
    const host = hostRef.current; if (!host) return;
    const hr = host.getBoundingClientRect();
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("div"); c.className = "at-coin"; c.textContent = "●";
      c.style.left = (Math.random() * hr.width) + "px"; c.style.top = "-30px";
      host.appendChild(c);
      gsap.to(c, { y: hr.height + 60, rotation: Math.random() * 720 - 360, duration: 1.4 + Math.random() * 1.2, delay: Math.random() * 0.8, ease: "power1.in", onComplete: function () { c.remove(); } });
    }
  }, []);

  const flyMult = useCallback(function (positions: [number, number][], value: number) {
    const host = hostRef.current; const target = multRef.current; if (!host || !target || positions.length === 0) return;
    const hr = host.getBoundingClientRect(); const tr = target.getBoundingClientRect();
    positions.forEach(function (p, i) {
      const el = gridRef.current ? gridRef.current.querySelector('.at-cell[data-c="' + p[0] + '"][data-r="' + p[1] + '"]') as HTMLElement : null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const b = document.createElement("div"); b.className = "at-flyball"; b.textContent = "x" + value;
      const sx = r.left - hr.left + r.width / 2, sy = r.top - hr.top + r.height / 2;
      const ex = tr.left - hr.left + tr.width / 2, ey = tr.top - hr.top + tr.height / 2;
      b.style.left = sx + "px"; b.style.top = sy + "px";
      host.appendChild(b);
      const cx = (sx + ex) / 2 + (Math.random() * 120 - 60), cy = Math.min(sy, ey) - 120;
      const proxy = { t: 0 };
      gsap.to(proxy, { t: 1, duration: 0.6, delay: i * 0.08, ease: "power1.inOut", onUpdate: function () {
        const t = proxy.t; const u = 1 - t;
        b.style.left = (u * u * sx + 2 * u * t * cx + t * t * ex) + "px";
        b.style.top = (u * u * sy + 2 * u * t * cy + t * t * ey) + "px";
      }, onComplete: function () { b.remove(); atlasSfx.chime(); gsap.fromTo(target, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }); } });
    });
  }, []);

  const finish = useCallback(function (res: ReturnType<typeof computeSteps>, acc: number, isFree: boolean) {
    let m: number; let total: number;
    if (isFree) {
      const nm = fsMultRef.current + res.multSum;
      setFsMult(nm); setMult(nm);
      m = nm > 0 ? nm : 1;
      total = Math.round(acc * m * 100) / 100;
    } else {
      m = res.multSum > 0 && acc > 0 ? res.multSum : 1;
      setMult(res.multSum);
      total = Math.round(acc * m * 100) / 100;
    }
    if (total > 25000) total = 25000;
    if (res.multSum > 0 && acc > 0) flyMult(res.multPositions, res.multSum);
    setLastWin(total);
    setBal(function (b) { return Math.round((b + total) * 100) / 100; });
    if (total >= betRef.current * 15) { setBigWin({ amt: total, mult: total / betRef.current }); coinRain(); atlasSfx.fanfare(); }
    if (isFree) {
      let left = fsLeftRef.current - 1;
      if (res.scatterCount >= 3) left += 5;
      setFsLeft(left);
      setFsTotal(function (v) { return Math.round((v + total) * 100) / 100; });
      if (left <= 0) { setInFree(false); setMsg("FREE SPINS COMPLETE"); }
      else setMsg("FREE SPIN " + left + " LEFT");
    } else {
      if (res.scatterCount >= 4) { setInFree(true); setFsLeft(15); setFsMult(0); setFsTotal(0); setMsg("15 FREE SPINS WON"); atlasSfx.free(); }
      else setMsg(total > 0 ? "WIN " + total.toFixed(2) : "SYMBOLS PAY ANYWHERE");
    }
    spinRef.current = false; setSpinning(false); abortRef.current = false; skipFns.current = [];
    refresh();
  }, [flyMult, coinRain, refresh]);

  const runSpin = useCallback(async function (isFree: boolean) {
    if (spinRef.current) { abortRef.current = true; skipFns.current.forEach(function (f) { f(); }); skipFns.current = []; return; }
    const cost = isFree ? 0 : (anteRef.current ? Math.round(betRef.current * 1.25 * 100) / 100 : betRef.current);
    if (!isFree && cost > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    spinRef.current = true; setSpinning(true); abortRef.current = false;
    if (!isFree) setBal(function (b) { return Math.round((b - cost) * 100) / 100; });
    setCascade(0); if (!isFree) setMult(0); setLastWin(0); setMsg(isFree ? "FREE SPIN" : "GOOD LUCK"); atlasSfx.spin();
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    const res = computeSteps(seed, isFree ? false : anteRef.current);
    const all = cells();
    await new Promise<void>(function (r) { gsap.to(all, { y: -8, duration: 0.12, ease: "power1.out", onComplete: function () { gsap.to(all, { y: 320, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: function () { r(); } }); } }); });
    if (abortRef.current) { finish(res, 0, isFree); return; }
    let acc = 0;
    for (let i = 0; i < res.steps.length; i++) {
      const st = res.steps[i]!;
      setGrid(st.grid);
      await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
      await dropIn(i === 0 ? 70 : 40);
      if (abortRef.current) break;
      const winSet = new Set<string>();
      st.wins.forEach(function (w) { w.positions.forEach(function (p) { winSet.add(p[0] + "," + p[1]); }); });
      cells().forEach(function (el) { const k = el.getAttribute("data-c") + "," + el.getAttribute("data-r"); if (winSet.has(k)) el.classList.add("at-win"); else el.classList.add("at-dim"); });
      await div(500);
      if (abortRef.current) break;
      const winEls = cells().filter(function (el) { return el.classList.contains("at-win"); });
      spawnSparks(winEls); atlasSfx.pop(i);
      await new Promise<void>(function (r) { gsap.to(winEls, { scale: 0, opacity: 0, duration: 0.4, ease: "power2.in", onComplete: function () { r(); } }); });
      let sw = 0; st.wins.forEach(function (w) { sw += w.pay; });
      acc += sw; setCascade(acc); setMsg("CASCADE WIN " + acc.toFixed(2));
      cells().forEach(function (el) { el.classList.remove("at-win", "at-dim"); });
      if (abortRef.current) break;
    }
    setGrid(res.finalGrid);
    await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
    await dropIn(40);
    finish(res, acc, isFree);
  }, [bal, cells, dropIn, div, spawnSparks, finish]);
  runRef.current = runSpin;

  useEffect(function () {
    if (!inFree || fsLeft <= 0 || spinning) return;
    const t = window.setTimeout(function () { runRef.current(true); }, 900);
    return function () { window.clearTimeout(t); };
  }, [inFree, fsLeft, spinning]);

  useEffect(function () {
    if (autoLeft <= 0 || spinning || inFree || bigWin) return;
    if (bal < bet) { setAutoLeft(0); return; }
    const t = window.setTimeout(function () { setAutoLeft(function (a) { return a - 1; }); runRef.current(false); }, 600);
    return function () { window.clearTimeout(t); };
  }, [autoLeft, spinning, inFree, bigWin, bal, bet]);

  useEffect(function () { if (!bigWin) return; const t = window.setTimeout(function () { setBigWin(null); }, 5000); return function () { window.clearTimeout(t); }; }, [bigWin]);

  useEffect(function () { const el = charRef.current; if (!el) return; if (spinning) gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: 0.3, yoyo: true, repeat: 1 }); }, [spinning]);
  useEffect(function () { const el = charRef.current; if (!el || mult <= 0) return; gsap.fromTo(el, { filter: "brightness(1)" }, { filter: "brightness(1.8)", duration: 0.2, yoyo: true, repeat: 1 }); }, [mult]);
  useEffect(function () { const el = charRef.current; if (!el || (!bigWin && !inFree)) return; gsap.fromTo(el, { y: 0 }, { y: -24, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" }); }, [bigWin, inFree]);

  const buyFeature = useCallback(function () {
    if (spinning || inFree) return;
    const cost = betRef.current * 100;
    if (cost > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    setBal(function (b) { return Math.round((b - cost) * 100) / 100; });
    setInFree(true); setFsLeft(15); setFsMult(0); setFsTotal(0); setMsg("FEATURE BOUGHT - 15 FREE SPINS");
  }, [spinning, inFree, bal]);

  return (
    <div className="at-root" ref={hostRef} style={{ ["--at-teal" as string]: g.color, ["--at-bronze" as string]: g.color2 }}>
      <div className="at-bg" style={{ backgroundImage: "url(" + asset("atlas-skyfall", "bg") + ")" }}/>
      <div className="at-scrim"/>
      <header className="at-head">
        <img className="at-logo" src={asset("atlas-skyfall", "logo")} alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
        <b className="at-title">ATLAS SKYFALL</b>
        <span className="at-vol">HIGH VOLATILITY</span>
        {inFree && <span className="at-freebanner">FREE SPINS {fsLeft} | x{fsMult} | {fsTotal.toFixed(2)}</span>}
        <div className="at-sp"/>
        <button className="at-hbtn" onClick={function () { setShowPay(true); }}>PAYS</button>
        <button className="at-hbtn" onClick={function () { setAutoLeft(function (a) { const opts = [0, 10, 25, 50, 100]; return opts[(opts.indexOf(a) + 1) % opts.length]!; }); }}>{autoLeft > 0 ? "AUTO " + autoLeft : "AUTO"}</button>
        <button className="at-turbo" onClick={function () { setTurbo(!turbo); }}>{turbo ? "TURBO ON" : "TURBO"}</button>
      </header>
      <div className="at-main">
        <aside className="at-left">
          <div className="at-panel"><b>MULTIPLIER</b><span ref={multRef} className="at-multcount">x{mult || 0}</span></div>
          <div className="at-panel"><b>CASCADE WIN</b><span className="at-casc">{cascade.toFixed(2)}</span></div>
          <div className="at-panel"><b>LAST WIN</b><span className="at-last">{lastWin.toFixed(2)}</span></div>
          <button className={"at-ante" + (ante ? " on" : "")} disabled={spinning || inFree} onClick={function () { setAnte(!ante); }}>{ante ? "ANTE ON (+25%)" : "ANTE BET"}</button>
          <button className="at-buy" disabled={spinning || inFree} onClick={buyFeature}>BUY FEATURE {(bet * 100).toFixed(0)}</button>
        </aside>
        <div className="at-gridwrap">
          <div className="at-grid" ref={gridRef}>
            {grid.map(function (col, c) { return col.map(function (cell, r) {
              return <div key={c + "-" + r} className="at-cell" data-c={c} data-r={r}><SymIcon sym={cell.sym} mult={cell.mult}/></div>;
            }); })}
          </div>
          <img className="at-frame" src="/assets/atlas-skyfall/frame.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
          <div className="at-msg">{msg}</div>
        </div>
        <aside className="at-char">
          <div className="at-atlas" ref={charRef}>
            <span className="at-charfallback">🗿</span>
            <img className="at-charimg" src="/assets/atlas-skyfall/character.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }} style={{ opacity: spinning ? 0 : 1 }}/>
            <img className="at-charimg" src="/assets/atlas-skyfall/character-cast.png" alt="" onError={function (e) { e.currentTarget.style.display = "none"; }} style={{ opacity: spinning ? 1 : 0 }}/>
          </div>
        </aside>
      </div>
      <footer className="at-foot">
        <div className="at-balbox"><span>BALANCE</span><b>{bal.toFixed(2)}</b></div>
        <div className="at-betbox">
          <button onClick={function () { setBet(Math.max(1, bet - 5)); }}>-</button>
          <span>{bet.toFixed(2)}</span>
          <button onClick={function () { setBet(bet + 5); }}>+</button>
        </div>
        <div className="at-sp"/>
        <button className="at-spin" onClick={function () { runSpin(inFree); }}>{spinning ? "STOP" : "SPIN"}</button>
      </footer>
      {bigWin && (
        <div className="at-bigwin">
          <b>{bigWin.mult >= 60 ? "EPIC WIN" : bigWin.mult >= 30 ? "MEGA WIN" : "BIG WIN"}</b>
          <strong>{bigWin.amt.toFixed(2)}</strong>
          <button onClick={function () { setBigWin(null); }}>SKIP</button>
        </div>
      )}
      {intro && (
        <div className="at-intro">
          <b className="at-intro-title">ATLAS SKYFALL</b>
          <span className="at-intro-win">WIN UP TO x25,000</span>
          <span className="at-vol">HIGH VOLATILITY</span>
          <label className="at-intro-hide"><input type="checkbox" checked={introHide} onChange={function (e) { setIntroHide(e.target.checked); try { window.localStorage.setItem("atlas_intro_hide", e.target.checked ? "1" : "0"); } catch (err) { /* ignore */ } }}/>{ " Don't show again"}</label>
          <button className="at-intro-start" onClick={function () { setIntro(false); }}>START</button>
        </div>
      )}
      {showPay && (
        <div className="at-pay">
          <b>PAYTABLE (PER UNIT BET)</b>
          <div className="at-pay-grid">
            {Object.keys(PAYS).map(function (s) { return (
              <div key={s} className="at-pay-row">
                <span className="at-glyph" style={{ color: SYMCOL[s] || "#fff" }}>{GLYPH[s] || "?"}</span>
                <span>{Object.keys(PAYS[s]!).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return n + ":" + PAYS[s]![n]; }).join("  ")}</span>
              </div>
            ); })}
          </div>
          <button onClick={function () { setShowPay(false); }}>CLOSE</button>
        </div>
      )}
    </div>
  );
}
