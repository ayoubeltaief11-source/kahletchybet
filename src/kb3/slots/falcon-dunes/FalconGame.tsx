"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { makeGrid, mulberry32, REEL_WEIGHTS, evaluateRound, FS_MODES, PAYS } from "./engine";
import type { Cell, SymId, Win } from "./engine";
import { sfx } from "../shared/sfx";
import "./falcon.css";

const A = "/assets/falcon-dunes/";
const FILL = 12;
const SYM_SRC: Record<string, string> = {
  s1: A + "symbols/s1.png", s2: A + "symbols/s2.png", s3: A + "symbols/s3.png", s4: A + "symbols/s4.png",
  s5: A + "symbols/s5.png", s6: A + "symbols/s6.png", s7: A + "symbols/s7.png", s8: A + "symbols/s8.png",
  wild: A + "symbols/wild.png", scatter: A + "symbols/scatter.png"
};
const GLYPH: Record<string, string> = { s1:"❖", s2:"✦", s3:"☥", s4:"𓂀", s5:"🜲", s6:"🜍", s7:"𓅃", s8:"🜂", wild:"★", scatter:"☀" };
export const IMAGE_LIST: string[] = [
  A + "symbols/s1.png", A + "symbols/s2.png", A + "symbols/s3.png", A + "symbols/s4.png",
  A + "symbols/s5.png", A + "symbols/s6.png", A + "symbols/s7.png", A + "symbols/s8.png",
  A + "symbols/wild.png", A + "symbols/scatter.png",
  A + "corner.png", A + "falcon-statue.png", A + "logo.png", A + "cover.png", A + "bg.jpg", A + "feature-bg.jpg",
  A + "fx/spark.png", A + "fx/glow.png", A + "fx/flash.png", A + "fx/sand.png", A + "fx/coin.png"
];
function hide(e: { currentTarget: HTMLImageElement }) { e.currentTarget.style.display = "none"; }

function SymImg({ sym, mult }: { sym: SymId; mult?: number }) {
  const [err, setErr] = useState(false);
  if (sym === "wild") {
    return (
      <span className="fd-wildwrap">
        {err ? <span className="fd-glyph wild">★</span> : <img className="fd-sym" src={SYM_SRC.wild} alt="" onError={function () { setErr(true); }}/>}
        {mult && <b className="fd-wildbadge">x{mult}</b>}
      </span>
    );
  }
  if (!err) return <img className="fd-sym" src={SYM_SRC[sym]} alt="" onError={function () { setErr(true); }}/>;
  return <span className="fd-glyph">{GLYPH[sym] || "?"}</span>;
}

function buildStrip(rng: () => number, finalCol: Cell[]): Cell[] {
  const fill = makeGrid(rng, REEL_WEIGHTS)[0]!;
  const out: Cell[] = [];
  for (let i = 0; i < FILL; i++) out.push(fill[i % fill.length]!);
  return out.concat(finalCol);
}

export default function FalconGame({ debug }: { debug?: boolean }) {
  const [grid, setGrid] = useState<Cell[][]>(function () { return makeGrid(mulberry32(1234), REEL_WEIGHTS); });
  const [strips, setStrips] = useState<Cell[][]>(function () {
    const g = makeGrid(mulberry32(1234), REEL_WEIGHTS);
    return g.map(function (col, i) { return buildStrip(mulberry32(100 + i), col); });
  });
  const [msg, setMsg] = useState("PLACE YOUR BET");
  const [bal, setBal] = useState(1000);
  const [bet, setBet] = useState(20);
  const [win, setWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [imgStatus, setImgStatus] = useState<Record<string, boolean>>({});
  const [ante, setAnte] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [inFree, setInFree] = useState(false);
  const [fsLeft, setFsLeft] = useState(0);
  const [fsTotal, setFsTotal] = useState(0);
  const [fsMode, setFsMode] = useState(0);
  const [bigWin, setBigWin] = useState<{ amt: number; mult: number } | null>(null);
  const [intro, setIntro] = useState(true);
  const [introHide, setIntroHide] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const anteRef = useRef(ante); anteRef.current = ante;
  const inFreeRef = useRef(inFree); inFreeRef.current = inFree;
  const fsLeftRef = useRef(fsLeft); fsLeftRef.current = fsLeft;
  const spinFnRef = useRef<(free: boolean) => void>(function () {});
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spinRef = useRef(false);
  const abortRef = useRef(false);
  const turboRef = useRef(turbo); turboRef.current = turbo;
  const skipFns = useRef<(() => void)[]>([]);

  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    if (!debug) return;
    IMAGE_LIST.forEach(function (u) {
      const im = new Image();
      im.onload = function () { setImgStatus(function (s) { const n = Object.assign({}, s); n[u] = true; return n; }); };
      im.onerror = function () { setImgStatus(function (s) { const n = Object.assign({}, s); n[u] = false; return n; }); };
      im.src = u;
    });
  }, [debug]);

  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    function onVis() { if (document.hidden) gsap.globalTimeline.pause(); else gsap.globalTimeline.resume(); }
    document.addEventListener("visibilitychange", onVis);
    return function () {
      document.removeEventListener("visibilitychange", onVis);
      stripRefs.current.forEach(function (el) { if (el) gsap.killTweensOf(el); });
      skipFns.current.forEach(function (f) { f(); }); skipFns.current = [];
    };
  }, []);

  const cellH = useCallback(function (i: number) {
    const el = reelRefs.current[i];
    return el ? el.clientHeight / 3 : 60;
  }, []);
  const resting = useCallback(function (i: number) { return -FILL * cellH(i); }, [cellH]);

  const settle = useCallback(function (i: number) {
    const el = stripRefs.current[i];
    if (el) gsap.set(el, { y: resting(i), filter: "none" });
  }, [resting]);

  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    for (let i = 0; i < 5; i++) settle(i);
    function onRs() { for (let i = 0; i < 5; i++) settle(i); }
    window.addEventListener("resize", onRs);
    return function () { window.removeEventListener("resize", onRs); };
  }, [strips, settle]);

  const div = useCallback(function (ms: number) {
    const d = turboRef.current ? ms / 2.5 : ms;
    return new Promise<void>(function (res) { const t = window.setTimeout(res, d); skipFns.current.push(function () { window.clearTimeout(t); res(); }); });
  }, []);

  const highlightWins = useCallback(async function (wins: Win[]) {
    const cellsAll = function () { return Array.from(document.querySelectorAll(".fd-cell")) as HTMLElement[]; };
    let acc = 0;
    const shown = wins.slice(0, 4);
    for (let k = 0; k < shown.length; k++) {
      const w = shown[k]!;
      const set = new Set<string>();
      w.positions.forEach(function (p) { set.add(p[0] + "," + p[1]); });
      cellsAll().forEach(function (el) {
        const key = el.getAttribute("data-c") + "," + el.getAttribute("data-r");
        if (set.has(key)) el.classList.add("fd-win"); else el.classList.add("fd-dim");
      });
      sfx.pop(k);
      acc += w.pay * bet;
      setWin(Math.round(acc * 100) / 100);
      setMsg("WIN " + w.sym.toUpperCase() + " x" + w.ways + " = " + (w.pay * bet).toFixed(2));
      await div(600);
      cellsAll().forEach(function (el) { el.classList.remove("fd-win", "fd-dim"); });
      if (abortRef.current) break;
    }
    return acc;
  }, [bet, div]);

  const spin = useCallback(async function (free: boolean) {
    if (spinRef.current) { abortRef.current = true; skipFns.current.forEach(function (f) { f(); }); skipFns.current = []; return; }
    const cost = free ? 0 : (anteRef.current ? Math.round(bet * 1.25 * 100) / 100 : bet);
    if (!free && cost > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    spinRef.current = true; setSpinning(true); abortRef.current = false;
    if (!free) setBal(function (b) { return Math.round((b - cost) * 100) / 100; });
    setWin(0); setMsg("GOOD LUCK");
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    const r = evaluateRound(seed, bet, free ? false : anteRef.current);
    const t = turboRef.current ? 2.5 : 1;
    // bounce up then strips reload from top
    const stripsEls = stripRefs.current.filter(Boolean) as HTMLDivElement[];
    await new Promise<void>(function (res) { gsap.to(stripsEls, { y: "+=8", duration: 0.12 / t, ease: "power1.out", onComplete: function () { res(); } }); });
    setGrid(r.grid);
    setStrips(r.grid.map(function (col, i) { return buildStrip(mulberry32(seed + i * 31), col); }));
    await new Promise(function (res) { requestAnimationFrame(function () { requestAnimationFrame(res); }); });
    const ant = r.scatterCount >= 2 && r.scatterPositions.some(function (p) { return p[0] === 0; }) && r.scatterPositions.some(function (p) { return p[0] === 2; });
    if (ant) sfx.tension();
    const proms: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const el = stripRefs.current[i];
      if (!el) continue;
      const slow = ant && i >= 3 ? 2 : 1;
      const dur = (0.55 * slow) / t;
      const startY = resting(i) - 3 * cellH(i);
      if (ant && i >= 3) el.parentElement!.classList.add("fd-ant");
      proms.push(new Promise<void>(function (res) {
        gsap.set(el, { y: startY, filter: "blur(3px)" });
        gsap.to(el, { y: resting(i) + 12, duration: dur, delay: (i * 0.18) / t, ease: "power2.in", onComplete: function () {
          gsap.to(el, { y: resting(i), duration: 0.28 / t, ease: "back.out(1.7)", filter: "none", onComplete: function () {
            el.parentElement!.classList.remove("fd-ant");
            sfx.tick(i);
            res();
          } });
        } });
      }));
    }
    await Promise.all(proms);
    // wild badge pop
    document.querySelectorAll(".fd-wildbadge").forEach(function (b) { gsap.fromTo(b, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)" }); });
    let roundWin = 0;
    if (r.wins.length && !abortRef.current) {
      roundWin = Math.round((await highlightWins(r.wins)) * 100) / 100;
      setWin(roundWin);
      setBal(function (b) { return Math.round((b + roundWin) * 100) / 100; });
      setMsg(roundWin > 0 ? "WIN " + roundWin.toFixed(2) : "243 WAYS TO WIN");
      if (roundWin >= bet * 15) sfx.fanfare();
    } else {
      setMsg(free ? "FREE SPIN" : "243 WAYS TO WIN");
    }
    if (roundWin >= bet * 15) setBigWin({ amt: roundWin, mult: Math.round((roundWin / bet) * 10) / 10 });
    if (free) {
      setFsTotal(function (v) { return Math.round((v + roundWin) * 100) / 100; });
      const left = fsLeftRef.current - 1;
      setFsLeft(left);
      if (left <= 0) { setInFree(false); setMsg("FREE SPINS COMPLETE"); }
    } else if (r.featureTriggered) {
      setPickOpen(true);
      sfx.free();
    }
    spinRef.current = false; setSpinning(false); abortRef.current = false; skipFns.current = [];
  }, [bal, bet, resting, cellH, highlightWins]);
  spinFnRef.current = function (fr) { void spin(fr); };

  const startFree = useCallback(function (modeIndex: number) {
    setPickOpen(false);
    setFsMode(modeIndex);
    setFsLeft(FS_MODES[modeIndex]!.spins);
    setFsTotal(0);
    setInFree(true);
    setMsg("FREE SPINS START");
  }, []);
  const buyFeature = useCallback(function () {
    if (spinning || inFree || pickOpen) return;
    const c = bet * 80;
    if (c > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    setBal(function (b) { return Math.round((b - c) * 100) / 100; });
    setPickOpen(true);
  }, [spinning, inFree, pickOpen, bet, bal]);
  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    if (!inFree || fsLeft <= 0 || spinning || pickOpen) return;
    const tt = window.setTimeout(function () { spinFnRef.current(true); }, 800);
    return function () { window.clearTimeout(tt); };
  }, [inFree, fsLeft, spinning, pickOpen]);
  useEffect(function () {
    if (autoLeft <= 0 || spinning || inFree || bigWin || pickOpen) return;
    if (bal < (anteRef.current ? Math.round(bet * 1.25 * 100) / 100 : bet)) { setAutoLeft(0); return; }
    const tt = window.setTimeout(function () { setAutoLeft(function (a) { return a - 1; }); spinFnRef.current(inFree); }, 700);
    return function () { window.clearTimeout(tt); };
  }, [autoLeft, spinning, inFree, bigWin, pickOpen, bal, bet]);
  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    if (!bigWin) return;
    const tt = window.setTimeout(function () { setBigWin(null); }, 5000);
    return function () { window.clearTimeout(tt); };
  }, [bigWin]);
  useEffect(function () { try { if (window.localStorage.getItem("falcon_intro_hide") === "1") setIntro(false); } catch (e) {} }, []);
  useEffect(function () {
    if (!bigWin) return;
    const host = document.querySelector(".fd-root");
    if (!host) return;
    for (let i = 0; i < 36; i++) {
      const c = document.createElement("img");
      c.src = A + "fx/coin.png";
      c.className = "fd-coin";
      c.style.left = Math.random() * 100 + "%";
      c.style.top = "-40px";
      host.appendChild(c);
      gsap.to(c, { y: window.innerHeight + 80, rotation: Math.random() * 720 - 360, duration: 1.4 + Math.random() * 1.2, delay: Math.random() * 0.8, ease: "power1.in", onComplete: function () { c.remove(); } });
    }
  }, [bigWin]);

  return (
    <div className={"fd-root" + (debug ? " fd-debug" : "")}>
      <div className={"fd-bg" + (inFree ? " fd-bg-free" : "")} style={{ backgroundImage: "url(" + (inFree ? A + "feature-bg.jpg" : A + "bg.jpg") + ")" }}/>
      {inFree && <div className="fd-freebar">FREE SPINS <b>{fsLeft}</b> | TOTAL <b>{fsTotal.toFixed(2)}</b> | WILD x{FS_MODES[fsMode]!.mults.join("/")}</div>}
      {intro && (
        <div className="fd-intro">
          <b className="fd-intro-title">FALCON DUNES</b>
          <span className="fd-intro-win">WIN UP TO x5,000</span>
          <span className="fd-vol">MEDIUM-HIGH VOLATILITY</span>
          <label className="fd-intro-hide"><input type="checkbox" checked={introHide} onChange={function (e) { setIntroHide(e.target.checked); try { window.localStorage.setItem("falcon_intro_hide", e.target.checked ? "1" : "0"); } catch (err) {} }}/>{ " Don't show again"}</label>
          <button className="fd-intro-start" onClick={function () { setIntro(false); }}>START</button>
        </div>
      )}
      {showPay && (
        <div className="fd-pay">
          <b>PAYTABLE (PER UNIT BET)</b>
          <div className="fd-pay-grid">
            {["s1","s2","s3","s4","s5","s6","s7","s8"].map(function (s) { return (
              <div key={s} className="fd-pay-row"><span className="fd-glyph">{GLYPH[s]}</span><span>3:{PAYS[s][0]}  4:{PAYS[s][1]}  5:{PAYS[s][2]}</span></div>
            ); })}
            <div className="fd-pay-row"><span className="fd-glyph wild">★</span><span>WILD x2/x3/x5</span></div>
            <div className="fd-pay-row"><span className="fd-glyph">☀</span><span>3 SCATTER = FREE SPINS</span></div>
          </div>
          <button onClick={function () { setShowPay(false); }}>CLOSE</button>
        </div>
      )}
      <div className="fd-stage">
        <div className="fd-frame">
          <img className="fd-statue left" src={A + "falcon-statue.png"} alt="" onError={hide}/>
          <img className="fd-statue right" src={A + "falcon-statue.png"} alt="" onError={hide}/>
          <img className="fd-corner tl" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="fd-corner tr" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="fd-corner bl" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="fd-corner br" src={A + "corner.png"} alt="" onError={hide}/>
          <div className="fd-reels">
            <div className="fd-grid">
              {strips.map(function (strip, c) {
                return (
                  <div key={c} className="fd-reel" ref={function (el) { reelRefs.current[c] = el; }}>
                    <div className="fd-strip" ref={function (el) { stripRefs.current[c] = el; }}>
                      {strip.map(function (cell, r) {
                        return <div key={r} className="fd-cell" data-c={c} data-r={r >= FILL ? r - FILL : r}><SymImg sym={cell.sym} mult={cell.wildMult}/></div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="fd-msg">{msg}</div>
      </div>
      <footer className="fd-foot">
        <div className="fd-bal"><span>BALANCE</span><b>{bal.toFixed(2)}</b></div>
        <div className="fd-bet">
          <button onClick={function () { setBet(Math.max(1, bet - 5)); }}>-</button>
          <span>{bet.toFixed(2)}</span>
          <button onClick={function () { setBet(bet + 5); }}>+</button>
        </div>
        <div className="fd-sp"/>
        <button className={"fd-ante" + (ante ? " on" : "")} disabled={spinning || inFree} onClick={function () { setAnte(!ante); }}>{ante ? "ANTE ON" : "ANTE"}</button>
        <button className="fd-buy" disabled={spinning || inFree || pickOpen} onClick={buyFeature}>BUY x80</button>
        <button className="fd-hbtn" onClick={function () { setShowPay(true); }}>PAYS</button>
        <button className="fd-hbtn" onClick={function () { setAutoLeft(function (a) { const opts = [0, 10, 25, 50, 100]; return opts[(opts.indexOf(a) + 1) % opts.length]!; }); }}>{autoLeft > 0 ? "AUTO " + autoLeft : "AUTO"}</button>
        <button className="fd-turbo" onClick={function () { setTurbo(!turbo); }}>{turbo ? "TURBO ON" : "TURBO"}</button>
        <button className="fd-spin" onClick={function () { void spin(inFree); }}>{spinning ? "STOP" : "SPIN"}</button>
      </footer>
      {pickOpen && (
        <div className="fd-pick">
          <b>CHOOSE YOUR FREE SPINS</b>
          <div className="fd-pick-row">
            {FS_MODES.map(function (m, i) { return <button key={i} className="fd-pick-card" onClick={function () { startFree(i); }}><b>{m.spins}</b><span>WILD x{m.mults.join("/")}</span></button>; })}
            <button className="fd-pick-card mystery" onClick={function () { startFree(Math.floor(Math.random() * FS_MODES.length)); }}><b>?</b><span>MYSTERY</span></button>
          </div>
        </div>
      )}
      {bigWin && (
        <div className="fd-bigwin">
          <b>{bigWin.mult >= 60 ? "EPIC WIN" : bigWin.mult >= 30 ? "MEGA WIN" : "BIG WIN"}</b>
          <strong>{bigWin.amt.toFixed(2)}</strong>
          <button onClick={function () { setBigWin(null); }}>SKIP</button>
        </div>
      )}
      {debug && (
        <div className="fd-panel">
          <b>DEBUG - IMAGE STATUS</b>
          <div className="fd-panel-grid">
            {IMAGE_LIST.map(function (u) {
              const st = imgStatus[u];
              return <span key={u} className={st === false ? "bad" : st === true ? "good" : ""}>{(st === false ? "MISSING " : st === true ? "OK " : "... ") + u.replace(A, "")}</span>;
            })}
          </div>
          <b>DEBUG - GRID (red borders = cell bounds)</b>
        </div>
      )}
    </div>
  );
}
