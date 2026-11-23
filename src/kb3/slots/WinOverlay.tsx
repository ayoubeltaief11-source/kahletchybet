"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "../audio/sfx";

interface WinData { amt: number; mult: number; tx: string; tier: number; jp?: number }
interface Props { win: WinData | null; accent?: string; onDismiss?: () => void; children: React.ReactNode }

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WinOverlay({ win, accent, onDismiss, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const coinCanvasRef = useRef<HTMLCanvasElement>(null);
  const [countUp, setCountUp] = useState(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // count-up animation
  useEffect(function () {
    if (!win || win.amt <= 0) return;
    const target = win.amt;
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setCountUp(Math.round(target * eased * 100) / 100);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(raf); };
  }, [win]);

  // big/mega/epic effects
  useEffect(function () {
    if (!win || win.tier < 2 || !wrapRef.current) return;
    const el = wrapRef.current;
    const div = 1;

    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline({ onComplete: function () { if (onDismiss) onDismiss(); } });
    tlRef.current = tl;

    if (!reduced()) {
      // rotating rays behind number
      if (raysRef.current) {
        tl.to(raysRef.current, { rotation: 360, duration: 4, ease: "none", repeat: -1 }, 0);
      }

      // shake container lightly
      tl.fromTo(el, { x: -3 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.4)" }, 0);

      // coin rain via canvas
      if (coinCanvasRef.current) {
        const cv = coinCanvasRef.current;
        const rawCtx = cv.getContext("2d");
        if (!rawCtx) return;
        const ctx: CanvasRenderingContext2D = rawCtx;
        cv.width = el.offsetWidth;
        cv.height = el.offsetHeight;
          const coins: { x: number; y: number; vy: number; vx: number; r: number; rot: number }[] = [];
          for (let i = 0; i < 40; i++) {
            coins.push({ x: Math.random() * cv.width, y: -Math.random() * 200, vy: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 2, r: 6 + Math.random() * 8, rot: Math.random() * Math.PI * 2 });
          }
          let animId = 0;
          function draw() {
            ctx.clearRect(0, 0, cv.width, cv.height);
            coins.forEach(function (c) {
              c.y += c.vy;
              c.x += c.vx;
              c.rot += 0.1;
              if (c.y > cv.height + 20) { c.y = -20; c.x = Math.random() * cv.width; }
              ctx.save();
              ctx.translate(c.x, c.y);
              ctx.rotate(c.rot);
              ctx.beginPath();
              ctx.arc(0, 0, c.r, 0, Math.PI * 2);
              ctx.fillStyle = accent || "#ffd97a";
              ctx.fill();
              ctx.strokeStyle = "#fffbe8";
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.restore();
            });
            animId = requestAnimationFrame(draw);
          }
          draw();
          tl.call(function () { cancelAnimationFrame(animId); }, [], 5);
      }

      // sound per tier
      tl.call(function () {
        if (win.tier >= 3) sfx.win(3);
        else if (win.tier >= 2) sfx.win(2);
        else sfx.win(1);
      }, [], 0);

      // auto-dismiss after 5s
      tl.to({}, { duration: 5 }, ">");
    } else {
      tl.call(function () { sfx.win(win.tier); }, [], 0);
      tl.to({}, { duration: 3 }, ">");
    }

    return function () { if (tlRef.current) tlRef.current.kill(); };
  }, [win, accent, onDismiss]);

  const isBig = win && win.tier >= 2;
  const label = win ? (win.tier >= 3 ? "MEGA WIN" : win.tier >= 2 ? "BIG WIN" : "WIN") : "";

  return (
    <div className="kb3-win-wrap" ref={wrapRef}>
      {children}
      {isBig && win && (
        <>
          <div className="kb3-win-overlay">
            <div className="kb3-win-rays" ref={raysRef}/>
            <canvas className="kb3-win-coins" ref={coinCanvasRef}/>
            <div className="kb3-win-block">
              <b>{label}</b>
              <strong>{countUp.toFixed(2)} TD</strong>
              <span>{win.mult.toFixed(2)}x</span>
              <em>{win.tx}</em>
            </div>
            <button className="kb3-win-skip" onClick={function () { if (onDismiss) onDismiss(); }}>SKIP</button>
          </div>
        </>
      )}
      {!isBig && win && win.amt > 0 && (
        <div className="kb3-win-small">+{win.amt.toFixed(2)} TD ({win.mult.toFixed(2)}x)</div>
      )}
    </div>
  );
}
