"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { makeGrid, mulberry32, BASE_WEIGHTS, MYSTERY_WEIGHTS, evaluateBase, evaluateHoldWin, buyFeaturePrice, mysteryCost } from "./engine";
import type { Cell, SymId, CoinId } from "./engine";
import { sfx } from "../shared/sfx";
import "./moon.css";

const A = "/assets/moon-rabbit-mint/";
const SYM_SRC: Record<string, string> = {
  s1: A + "symbols/s1.png", s2: A + "symbols/s2.png", s3: A + "symbols/s3.png",
  s4: A + "symbols/s4.png", s5: A + "symbols/s5.png", s6: A + "symbols/s6.png", mystery: A + "symbols/mystery.png"
};
const COIN_SRC: Record<string, string> = {
  c5: A + "coins/coin-bronze.png", c10: A + "coins/coin-bronze.png", c25: A + "coins/coin-silver.png",
  c50: A + "coins/coin-silver.png", c100: A + "coins/coin-gold.png", c250: A + "coins/coin-gold.png",
  mini: A + "coins/coin-jade.png", minor: A + "coins/coin-jade.png", major: A + "coins/coin-mythic.png", grand: A + "coins/coin-mythic.png"
};
const GLYPH: Record<string, string> = { s1:"❀", s2:"✿", s3:"❃", s4:"✾", s5:"❁", s6:"✻", mystery:"?" };

function hide(e: { currentTarget: HTMLImageElement }) { e.currentTarget.style.display = "none"; }

function SymImg({ cell, isMerging }: { cell: Cell; isMerging?: boolean }) {
  const [err, setErr] = useState(false);
  const src = String(cell.sym).startsWith("c") ? COIN_SRC[cell.sym as CoinId] : SYM_SRC[cell.sym as SymId];
  if (!err && src) return <img className={"mm-sym" + (String(cell.sym).startsWith("c") ? " mm-coin" : "") + (isMerging ? " mm-merge-flash" : "")} src={src} alt="" onError={function () { setErr(true); }}/>;
  return <span className="mm-glyph">{GLYPH[cell.sym as SymId] || "●"}</span>;
}

export default function MoonGame({ debug }: { debug?: boolean }) {
  const [grid, setGrid] = useState<Cell[][]>(() => makeGrid(mulberry32(1), BASE_WEIGHTS, false));
  const [strips, setStrips] = useState<Cell[][]>([]);
  const [msg, setMsg] = useState("PLACE YOUR BET");
  const [bal, setBal] = useState(1000);
  const [bet, setBet] = useState(20);
  const [win, setWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [mysteryMode, setMysteryMode] = useState(false);
  const [inHoldWin, setInHoldWin] = useState(false);
  const [hwSteps, setHwSteps] = useState<{ grid: (Cell | null)[][]; wins: any[] }[]>([]);
  const [hwStepIdx, setHwStepIdx] = useState(0);
  const [respins, setRespins] = useState(3);
  const [bigWin, setBigWin] = useState<{ amt: number; mult: number } | null>(null);
  const [intro, setIntro] = useState(true);
  
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spinRef = useRef(false);
  const abortRef = useRef(false);
  const turboRef = useRef(turbo); turboRef.current = turbo;
  const skipFns = useRef<(() => void)[]>([]);

  useEffect(() => { try { if (localStorage.getItem("mm_intro") === "1") setIntro(false); } catch(e){} }, []);
  useEffect(() => {
    const onVis = () => document.hidden ? gsap.globalTimeline.pause() : gsap.globalTimeline.resume();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); stripRefs.current.forEach(el => el && gsap.killTweensOf(el)); skipFns.current.forEach(fn => fn()); skipFns.current = []; };
  }, []);

  const buildStrip = useCallback((rng: () => number, finalCol: Cell[]) => {
    const fill = makeGrid(rng, BASE_WEIGHTS, false)[0]!;
    const out: Cell[] = [];
    for (let i = 0; i < 15; i++) out.push(fill[i % fill.length]!);
    return out.concat(finalCol);
  }, []);

  const animateHoldWin = useCallback(async () => {
    for (let i = 0; i < hwSteps.length; i++) {
      if (abortRef.current) break;
      setHwStepIdx(i);
      const step = hwSteps[i];
      // Animate new coins dropping
      const newCoins = [];
      for (let c = 0; c < 3; c++) {
        for (let r = 0; r < 3; r++) {
          if (step.grid[c]![r] && String(step.grid[c]![r]!.sym).startsWith("c")) {
            // Check if it's new (simplified: just animate all coins for visual effect)
            newCoins.push({ c, r });
          }
        }
      }
      sfx.chime();
      await new Promise(res => setTimeout(res, turboRef.current ? 300 : 600));
      
      // Moon Merge Animation (mocked visual trigger if wins exist in step)
      if (step.wins && step.wins.length > 0) {
        sfx.fanfare();
        // Flash effect handled by CSS class on render
        await new Promise(res => setTimeout(res, turboRef.current ? 300 : 600));
      }
    }
    // Finish
    let total = 0;
    const finalGrid = hwSteps[hwSteps.length - 1].grid;
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
      const cell = finalGrid[c]![r];
      if (cell && String(cell.sym).startsWith("c")) {
        // Simplified value lookup for UI
        total += (cell.sym === "grand" ? 2000 : cell.sym === "major" ? 500 : cell.sym === "minor" ? 100 : cell.sym === "mini" ? 20 : 10) * bet;
      }
    }
    setWin(total);
    setBal(b => Math.round((b + total) * 100) / 100);
    setMsg("HOLD & WIN COMPLETE: " + total.toFixed(2));
    if (total >= bet * 15) { setBigWin({ amt: total, mult: total / bet }); sfx.fanfare(); }
    setInHoldWin(false);
    spinRef.current = false; setSpinning(false);
  }, [hwSteps, bet]);

  const spin = useCallback(async () => {
    if (spinRef.current) { abortRef.current = true; skipFns.current.forEach(f => f()); skipFns.current = []; return; }
    const cost = mysteryMode ? mysteryCost(bet) : bet;
    if (cost > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    
    spinRef.current = true; setSpinning(true); abortRef.current = false;
    setBal(b => Math.round((b - cost) * 100) / 100);
    setWin(0); setMsg("GOOD LUCK");
    
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    const rng = mulberry32(seed);
    const weights = mysteryMode ? MYSTERY_WEIGHTS : BASE_WEIGHTS;
    const resultGrid = makeGrid(rng, weights, mysteryMode);
    const base = evaluateBase(resultGrid, bet, mysteryMode);
    
    setGrid(resultGrid);
    setStrips(resultGrid.map((col, i) => buildStrip(mulberry32(seed + i), col)));
    
    // Reel animation
    const t = turboRef.current ? 2.5 : 1;
    const proms: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const el = stripRefs.current[i];
      if (!el) continue;
      proms.push(new Promise<void>(res => {
        gsap.set(el, { y: -180, filter: "blur(3px)" });
        gsap.to(el, { y: 10, duration: 0.5 / t, delay: (i * 0.12) / t, ease: "power2.in", onComplete: () => {
          gsap.to(el, { y: 0, duration: 0.25 / t, ease: "back.out(1.6)", filter: "none", onComplete: () => { sfx.tick(i); res(); } });
        }});
      }));
    }
    await Promise.all(proms);
    
    if (base.coinCount >= 5 && !abortRef.current) {
      setMsg("HOLD & WIN TRIGGERED!");
      sfx.free();
      const hw = evaluateHoldWin(seed ^ 0x9e3779b9, bet, []); // Simplified initial coins for demo
      setHwSteps(hw.steps);
      setInHoldWin(true);
      setRespins(3);
      await animateHoldWin();
    } else {
      setWin(base.totalWin);
      setBal(b => Math.round((b + base.totalWin) * 100) / 100);
      setMsg(base.totalWin > 0 ? "WIN " + base.totalWin.toFixed(2) : "GOOD LUCK");
      if (base.totalWin >= bet * 15) { setBigWin({ amt: base.totalWin, mult: base.totalWin / bet }); sfx.fanfare(); }
      spinRef.current = false; setSpinning(false);
    }
  }, [bal, bet, mysteryMode, buildStrip, animateHoldWin]);

  const buyFeature = () => {
    if (spinning) return;
    const c = buyFeaturePrice(bet);
    if (c > bal) { setMsg("INSUFFICIENT BALANCE"); return; }
    setBal(b => Math.round((b - c) * 100) / 100);
    setMsg("BONUS BOUGHT!");
    // Trigger hold win directly for demo
    const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    const hw = evaluateHoldWin(seed, bet, [{c:1, r:1, sym:"minor"}, {c:0, r:0, sym:"c50"}, {c:2, r:2, sym:"c25"}, {c:1, r:2, sym:"c10"}, {c:2, r:0, sym:"c25"}]);
    setHwSteps(hw.steps);
    setInHoldWin(true);
    setRespins(3);
    animateHoldWin();
  };

  return (
    <div className="mm-root">
      {intro && (
        <div className="mm-intro">
          <b className="mm-intro-title">MOON RABBIT MINT</b>
          <span className="mm-intro-win">WIN UP TO x5,000</span>
          <span className="mm-vol">HIGH VOLATILITY</span>
          <label className="mm-intro-hide"><input type="checkbox" onChange={e => { try { localStorage.setItem("mm_intro", e.target.checked ? "1" : "0"); } catch(err){} }}/> Don't show again</label>
          <button className="mm-intro-start" onClick={() => setIntro(false)}>START</button>
        </div>
      )}
      <div className={"mm-bg" + (inHoldWin ? " mm-bg-free" : "")} style={{ backgroundImage: `url(${inHoldWin ? A + "feature-bg.jpg" : A + "bg.jpg"})` }}/>
      
      <div className="mm-stage">
        <div className="mm-prize-panel">
          <div className="mm-prize-item"><span>MINI</span><b>x20</b></div>
          <div className="mm-prize-item"><span>MINOR</span><b>x100</b></div>
          <div className="mm-prize-item"><span>MAJOR</span><b>x500</b></div>
          <div className="mm-prize-item"><span>GRAND</span><b>x2000</b></div>
        </div>

        <div className="mm-frame">
          <img className="mm-lantern left" src={A + "lantern.png"} alt="" onError={hide}/>
          <img className="mm-lantern right" src={A + "lantern.png"} alt="" onError={hide}/>
          <img className="mm-corner tl" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="mm-corner tr" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="mm-corner bl" src={A + "corner.png"} alt="" onError={hide}/>
          <img className="mm-corner br" src={A + "corner.png"} alt="" onError={hide}/>
          <div className="mm-reels">
            <div className="mm-grid">
              {(inHoldWin ? hwSteps[hwStepIdx]?.grid : grid).map((col, c) => 
                (inHoldWin ? col : col).map((cell, r) => 
                  cell && <div key={c + "-" + r} className="mm-cell" data-c={c} data-r={r}><SymImg cell={cell as Cell}/></div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mm-side-controls">
          <button className={"mm-mystery-btn" + (mysteryMode ? " on" : "")} disabled={spinning || inHoldWin} onClick={() => setMysteryMode(!mysteryMode)}>MYSTERY +50%</button>
          <button className="mm-buy-btn" disabled={spinning || inHoldWin} onClick={buyFeature}>BUY x60</button>
        </div>
      </div>

      <div className="mm-msg-bar">{inHoldWin ? `RESPINS: ${3 - hwStepIdx}` : msg}</div>

      <footer className="mm-foot">
        <div className="mm-bal"><span>BALANCE</span><b>{bal.toFixed(2)}</b></div>
        <div className="mm-bet">
          <button onClick={() => setBet(Math.max(1, bet - 5))}>-</button>
          <span>{bet.toFixed(2)}</span>
          <button onClick={() => setBet(bet + 5)}>+</button>
        </div>
        <div className="mm-sp"/>
        <button className="mm-turbo" onClick={() => setTurbo(!turbo)}>{turbo ? "TURBO ON" : "TURBO"}</button>
        <button className="mm-spin" onClick={() => void spin()}>{spinning ? "STOP" : "SPIN"}</button>
      </footer>

      {debug && (
        <div className="mm-panel">
          <b>DEBUG - IMAGE STATUS</b>
          <div className="mm-panel-grid">
            {["symbols/s1.png","symbols/s2.png","symbols/s3.png","symbols/s4.png","symbols/s5.png","symbols/s6.png","symbols/mystery.png","coins/coin-bronze.png","coins/coin-silver.png","coins/coin-gold.png","coins/coin-jade.png","coins/coin-mythic.png","rabbit.png","lantern.png","corner.png","logo.png","cover.png","bg.jpg","feature-bg.jpg","fx/spark.png","fx/glow.png","fx/flash.png","fx/ring.png","fx/moondust.png"].map(function (u) {
              const [ok, setOk] = useState<boolean | null>(null);
              useEffect(function () { const im = new Image(); im.onload = function () { setOk(true); }; im.onerror = function () { setOk(false); }; im.src = A + u; }, []);
              return <span key={u} className={ok === false ? "bad" : ok === true ? "good" : ""}>{(ok === false ? "MISSING " : ok === true ? "OK " : "... ") + u}</span>;
            })}
          </div>
        </div>
      )}
      {bigWin && (
        <div className="mm-bigwin">
          <b>{bigWin.mult >= 60 ? "EPIC WIN" : bigWin.mult >= 30 ? "MEGA WIN" : "BIG WIN"}</b>
          <strong>{bigWin.amt.toFixed(2)}</strong>
          <button onClick={() => setBigWin(null)}>SKIP</button>
        </div>
      )}
    </div>
  );
}
