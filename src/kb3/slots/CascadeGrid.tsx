"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sym, hasGame } from "../registry";
import { sfx } from "../audio/sfx";

interface Props {
  gameId: string;
  grid: number[];
  hits: number[];
  stepMult: number;
  bombs: { cell: number; value: number }[];
  cols: number;
  rows: number;
  turbo?: boolean;
  onSettle?: () => void;
}

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CascadeGrid({ gameId, grid, hits, stepMult, bombs, cols, rows, turbo, onSettle }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [totalWin, setTotalWin] = useState(0);
  const [countUp, setCountUp] = useState(0);
  const particlesRef = useRef<HTMLDivElement>(null);

  // count-up animation for total win
  useEffect(function () {
    if (stepMult <= 0) return;
    const target = totalWin + stepMult;
    setTotalWin(target);
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCountUp(Math.round(target * eased * 100) / 100);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(raf); };
  }, [stepMult]);

  // cascade animation
  useEffect(function () {
    if (hits.length === 0 || !boardRef.current) return;
    const el = boardRef.current;
    const div = turbo ? 2.5 : 1;

    // 1) highlight winning cells
    const targets = hits.map(function (i) { return el.querySelector('[data-cell="' + i + '"]'); }).filter(Boolean) as HTMLElement[];
    const others = Array.from(el.querySelectorAll("[data-cell]")).filter(function (n) { return hits.indexOf(Number((n as HTMLElement).dataset.cell)) < 0; }) as HTMLElement[];

    if (!reduced()) {
      gsap.to(targets, { scale: 1.15, duration: 0.18 / div, yoyo: true, repeat: 2, ease: "power2.out" });
      gsap.to(others, { opacity: 0.55, duration: 0.2 / div });
      sfx.pop(0);
    }

    // 2) spawn particles at winning cells
    if (particlesRef.current && !reduced()) {
      const host = particlesRef.current;
      targets.forEach(function (t, idx) {
        const rect = t.getBoundingClientRect();
        const hostRect = host.getBoundingClientRect();
        const cx = rect.left - hostRect.left + rect.width / 2;
        const cy = rect.top - hostRect.top + rect.height / 2;
        for (let p = 0; p < 8; p++) {
          const dot = document.createElement("div");
          dot.className = "kb3-particle";
          dot.style.left = cx + "px";
          dot.style.top = cy + "px";
          const angle = (Math.PI * 2 * p) / 8 + Math.random() * 0.5;
          const dist = 30 + Math.random() * 40;
          gsap.to(dot, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist - 20,
            opacity: 0,
            scale: 0.3,
            duration: (0.5 + Math.random() * 0.3) / div,
            ease: "power2.out",
            onComplete: function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }
          });
          if (particlesRef.current) particlesRef.current.appendChild(dot);
        }
      });
    }

    // 3) after highlight, drop new symbols
    const timer = window.setTimeout(function () {
      gsap.to(others, { opacity: 1, duration: 0.15 / div });
      const allCells = Array.from(el.querySelectorAll("[data-cell]")) as HTMLElement[];
      // group by column
      const byCol: HTMLElement[][] = Array.from({ length: cols }, function () { return []; });
      allCells.forEach(function (c) {
        const idx = Number(c.dataset.cell);
        const col = Math.floor(idx / rows);
        byCol[col].push(c);
      });
      byCol.forEach(function (colCells, ci) {
        colCells.forEach(function (c, ri) {
          gsap.fromTo(c, { y: -30 - ri * 8, opacity: 0.3 }, { y: 0, opacity: 1, duration: (0.35 + ri * 0.04) / div, delay: (ci * 0.04) / div, ease: "bounce.out" });
        });
      });
      sfx.pop(1);
      if (onSettle) window.setTimeout(onSettle, (400 / div));
    }, (460 / div));

    return function () { window.clearTimeout(timer); };
  }, [hits, turbo, cols, rows, onSettle]);

  const items = grid.map(function (k, idx) {
    const bomb = bombs.find(function (b) { return b.cell === idx; });
    const isHit = hits.indexOf(idx) >= 0;
    const src = hasGame(gameId) ? sym(gameId, bomb ? 8 : k) : "";
    return (
      <div key={idx} data-cell={idx} className={"kb3-casc-cell" + (isHit ? " hit" : "") + (bomb ? " bomb" : "")}>
        {src ? <img src={src} alt="" draggable={false}/> : null}
        {bomb ? <span className="kb3-bombval">{bomb.value}x</span> : null}
      </div>
    );
  });

  return (
    <div className="kb3-cascade-wrap">
      {stepMult > 0 && (
        <div className="kb3-mult-bar">
          <span className="kb3-mult-label">TOTAL WIN</span>
          <b className="kb3-mult-val">{countUp.toFixed(2)}x</b>
          {stepMult > 0 && <em className="kb3-mult-step">+{stepMult.toFixed(2)}x</em>}
        </div>
      )}
      <div className="kb3-casc-board" ref={boardRef} style={{ gridTemplateColumns: "repeat(" + cols + ",1fr)" }}>
        {items}
      </div>
      <div className="kb3-particles" ref={particlesRef}/>
    </div>
  );
}
