"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "../audio/sfx";

interface Props {
  hits: number[];
  stepMult: number;
  turbo?: boolean;
  accent?: string;
  children: React.ReactNode;
}

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CascadeGrid({ hits, stepMult, turbo, accent, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [totalWin, setTotalWin] = useState(0);
  const [countUp, setCountUp] = useState(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // count-up animation
  useEffect(function () {
    if (stepMult <= 0) return;
    const target = totalWin + stepMult;
    setTotalWin(target);
    const start = performance.now();
    const dur = 500;
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

  // cascade animation via single gsap timeline
  useEffect(function () {
    if (hits.length === 0 || !wrapRef.current) return;
    const el = wrapRef.current;
    const div = turbo ? 2.5 : 1;

    // kill previous timeline
    if (tlRef.current) tlRef.current.kill();

    const targets = hits.map(function (i) { return el.querySelector('[data-cell="' + i + '"]'); }).filter(Boolean) as HTMLElement[];
    const others = Array.from(el.querySelectorAll("[data-cell]")).filter(function (n) { return hits.indexOf(Number((n as HTMLElement).dataset.cell)) < 0; }) as HTMLElement[];

    if (targets.length === 0) return;

    const tl = gsap.timeline({
      onComplete: function () {
        // restore opacity for non-winning cells
        gsap.to(others, { opacity: 1, duration: 0.15 / div });
        sfx.pop(1);
      }
    });
    tlRef.current = tl;

    if (!reduced()) {
      // 1) highlight winning cells (scale + pulse 3 times)
      tl.to(targets, { scale: 1.15, duration: 0.12 / div, ease: "power2.out" })
        .to(targets, { scale: 1.0, duration: 0.1 / div, yoyo: true, repeat: 2, ease: "power2.inOut" }, "<");

      // 2) dim others to 55%
      tl.to(others, { opacity: 0.55, duration: 0.15 / div }, "<");

      // 3) spawn particles at winning cells
      tl.call(function () {
        if (!particlesRef.current || reduced()) return;
        const host = particlesRef.current;
        targets.forEach(function (t) {
          const rect = t.getBoundingClientRect();
          const hostRect = host.getBoundingClientRect();
          const cx = rect.left - hostRect.left + rect.width / 2;
          const cy = rect.top - hostRect.top + rect.height / 2;
          for (let p = 0; p < 6; p++) {
            const dot = document.createElement("div");
            dot.className = "kb3-particle";
            dot.style.left = cx + "px";
            dot.style.top = cy + "px";
            dot.style.background = accent || "#ffd97a";
            const angle = (Math.PI * 2 * p) / 6 + Math.random() * 0.5;
            const dist = 25 + Math.random() * 35;
            gsap.to(dot, {
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist - 15,
              opacity: 0,
              scale: 0.2,
              duration: (0.4 + Math.random() * 0.2) / div,
              ease: "power2.out",
              onComplete: function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }
            });
            host.appendChild(dot);
          }
        });
        sfx.pop(0);
      }, [], 0.12 / div);

      // 4) drop animation for new symbols (after hits clear)
      tl.to({}, { duration: 0.2 / div }) // wait for hits to clear
        .call(function () {
          const allCells = Array.from(el.querySelectorAll("[data-cell]")) as HTMLElement[];
          const byCol: Record<number, HTMLElement[]> = {};
          allCells.forEach(function (c) {
            const idx = Number(c.dataset.cell);
            const col = Math.floor(idx / 5); // assume 5 cols for cluster
            if (!byCol[col]) byCol[col] = [];
            byCol[col].push(c);
          });
          Object.keys(byCol).forEach(function (colKey, ci) {
            const colCells = byCol[Number(colKey)];
            colCells.forEach(function (c, ri) {
              gsap.fromTo(c, { y: -25 - ri * 6, opacity: 0.4 }, { y: 0, opacity: 1, duration: (0.3 + ri * 0.03) / div, delay: (ci * 0.04) / div, ease: "bounce.out" });
            });
          });
        }, [], ">");
    } else {
      // reduced motion: just pop sound
      tl.call(function () { sfx.pop(0); }, [], 0);
    }

    return function () { if (tlRef.current) tlRef.current.kill(); };
  }, [hits, turbo, accent]);

  return (
    <div className="kb3-cascade-wrap" ref={wrapRef}>
      {stepMult > 0 && (
        <div className="kb3-mult-bar">
          <span className="kb3-mult-label">TOTAL WIN</span>
          <b className="kb3-mult-val">{countUp.toFixed(2)}x</b>
          <em className="kb3-mult-step">+{stepMult.toFixed(2)}x</em>
        </div>
      )}
      {children}
      <div className="kb3-particles" ref={particlesRef}/>
    </div>
  );
}
