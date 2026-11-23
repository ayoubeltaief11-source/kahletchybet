"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sfx } from "../audio/sfx";

interface Coin { cell: number; value: number; jp: number }
interface Props { board: Coin[]; fresh: number[]; respins: number; filled: number; totalCells: number; jackpotHit?: number; grandFull?: boolean; accent?: string; children: React.ReactNode }

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HoldWin({ board, fresh, respins, filled, totalCells, jackpotHit, grandFull, accent, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [filledAnim, setFilledAnim] = useState(filled);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // animate filled counter
  useEffect(function () {
    if (filled === filledAnim) return;
    const start = performance.now();
    const dur = 400;
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setFilledAnim(Math.round(filled * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function () { cancelAnimationFrame(raf); };
  }, [filled]);

  // coin drop animation when new coins land
  useEffect(function () {
    if (fresh.length === 0 || !wrapRef.current) return;
    const el = wrapRef.current;
    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline();
    tlRef.current = tl;

    if (!reduced()) {
      const targets = fresh.map(function (i) { return el.querySelector('[data-h="' + i + '"]'); }).filter(Boolean) as HTMLElement[];
      if (targets.length > 0) {
        // bounce down + flash
        tl.fromTo(targets, { y: -60, opacity: 0, scale: 0.7 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: "bounce.out" })
          .to(targets, { boxShadow: "0 0 20px " + (accent || "#ffd97a"), duration: 0.2, yoyo: true, repeat: 1 }, "<+=0.3");
        // pulse respins indicator
        tl.call(function () { sfx.coinLand(); }, [], 0);
      }
    } else {
      tl.call(function () { sfx.coinLand(); }, [], 0);
    }

    return function () { if (tlRef.current) tlRef.current.kill(); };
  }, [fresh, accent]);

  // grand celebration
  useEffect(function () {
    if (!grandFull || !wrapRef.current) return;
    const el = wrapRef.current;
    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline({ onComplete: function () {} });
    tlRef.current = tl;

    if (!reduced()) {
      tl.fromTo(el, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" })
        .call(function () { sfx.win(3); }, [], 0);
    } else {
      tl.call(function () { sfx.win(3); }, [], 0);
    }

    return function () { if (tlRef.current) tlRef.current.kill(); };
  }, [grandFull]);

  return (
    <div className="kb3-hold-wrap" ref={wrapRef}>
      {children}
      {jackpotHit !== undefined && jackpotHit >= 0 && (
        <div className={"kb3-jp-flash kb3-jp-" + jackpotHit}>{["MINI","MINOR","MAJOR","GRAND"][jackpotHit]} HIT!</div>
      )}
      {grandFull && <div className="kb3-grand-celebrate"><b>GRAND JACKPOT</b><strong>FULL BOARD!</strong></div>}
    </div>
  );
}
