"use client";
import { useEffect, useRef } from "react";
import { pocketsFor, colorOf } from "./engine";
import type { RouletteVariant } from "./engine";
import { makePlan, ballAt, wheelRotAt } from "./spinPlan";
import type { SpinPlan } from "./spinPlan";
import { makeRng } from "./engine";
import { rlSfx } from "./sfx";

interface Props {
  variant: RouletteVariant;
  accent: string;
  spinId: number;
  targetIndex: number;
  idleAfter?: boolean;
  skipSignal?: number;
  onSettled?: () => void;
}

export default function WheelFallback({ variant, accent, spinId, targetIndex, idleAfter, skipSignal, onSettled }: Props) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<SpinPlan | null>(null);
  const t0Ref = useRef(0);
  const offRef = useRef(0);
  const firedRef = useRef(false);
  const rotRef = useRef(0);
  const doneRef = useRef(onSettled);
  doneRef.current = onSettled;
  const pockets = pocketsFor(variant);
  const step = 360 / pockets.length;

  useEffect(function () {
    if (spinId <= 0) return;
    planRef.current = makePlan(pockets.length, targetIndex, makeRng(spinId * 7919 + 13), rotRef.current);
    t0Ref.current = performance.now();
    offRef.current = 0;
    firedRef.current = false;
    rlSfx.spinStart();
  }, [spinId, targetIndex, pockets.length]);

  useEffect(function () {
    if (!skipSignal || !planRef.current) return;
    const t = (performance.now() - t0Ref.current) / 1000 + offRef.current;
    offRef.current += Math.max(0, planRef.current.duration - 0.2 - t);
  }, [skipSignal]);

  useEffect(function () {
    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      const p = planRef.current;
      const now = performance.now();
      let rot = rotRef.current;
      let ang = 0.6;
      let r01 = 0;
      if (p) {
        const t = (now - t0Ref.current) / 1000 + offRef.current;
        rot = wheelRotAt(p, t, !!idleAfter);
        if (t >= p.duration) { ang = p.pocketAngle - rot; r01 = 0; }
        else { const b = ballAt(p, t); ang = b.angle; r01 = b.r01; }
        if (t >= p.duration && !firedRef.current) {
          firedRef.current = true;
          rlSfx.spinStop(); rlSfx.settle();
          if (doneRef.current) doneRef.current();
        }
      } else { rot = now / 1000 * 0.4; }
      rotRef.current = rot;
      if (wheelRef.current) wheelRef.current.style.transform = "rotate(" + (-rot * 180 / Math.PI) + "deg)";
      if (ballRef.current) {
        const r = 31 + 13 * r01;
        ballRef.current.style.left = (50 + r * Math.cos(ang)) + "%";
        ballRef.current.style.top = (50 + r * Math.sin(ang)) + "%";
      }
    }
    raf = requestAnimationFrame(loop);
    return function () { cancelAnimationFrame(raf); rlSfx.spinStop(); };
  }, [idleAfter]);

  const stops: string[] = [];
  pockets.forEach(function (n, i) {
    const c = colorOf(n);
    const col = c === "red" ? "#c22733" : c === "black" ? "#14181f" : "#0d8a52";
    stops.push(col + " " + (i * step) + "deg " + ((i + 1) * step) + "deg");
  });

  return (
    <div className="rlf-wrap">
      <div className="rlf-wheel" ref={wheelRef} style={{ background: "conic-gradient(" + stops.join(",") + ")", borderColor: accent }}>
        {pockets.map(function (n, i) {
          const a = (i / pockets.length) * Math.PI * 2;
          return (
            <span key={i} className="rlf-num" style={{ left: (50 + 40 * Math.cos(a)) + "%", top: (50 + 40 * Math.sin(a)) + "%", transform: "translate(-50%,-50%) rotate(" + (a * 180 / Math.PI + 90) + "deg)" }}>{n}</span>
          );
        })}
      </div>
      <div className="rlf-ball" ref={ballRef}/>
    </div>
  );
}
