"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import gsap from "gsap";
import { sym, hasGame } from "../registry";
import { sfx } from "../audio/sfx";

const STRIP_LEN = 30;
const CELL = 74;

export interface ReelStripHandle {
  spin(finalCol: number[], index: number, opts: { turbo?: boolean; anticipate?: boolean }): Promise<void>;
  quickStop(): void;
}

interface Props {
  gameId: string;
  rows: number;
  initial: number[];
  onSettle?: (index: number) => void;
}

function reduced(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const ReelStrip = forwardRef<ReelStripHandle, Props>(function ReelStrip(props, ref) {
  const stripRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const timers = useRef<number[]>([]);
  const [blur, setBlur] = useState(false);
  const [ant, setAnt] = useState(false);
  const [strip, setStrip] = useState<number[]>(function () {
    const a: number[] = [];
    for (let i = 0; i < STRIP_LEN; i++) a.push(Math.floor(Math.random() * 9));
    return a;
  });
  const alive = useRef(true);

  useEffect(function () {
    alive.current = true;
    function onHide() {
      if (document.hidden) { if (tweenRef.current) tweenRef.current.pause(); sfx.spinStop(); }
      else if (tweenRef.current) tweenRef.current.resume();
    }
    document.addEventListener("visibilitychange", onHide);
    return function () {
      alive.current = false;
      document.removeEventListener("visibilitychange", onHide);
      if (tweenRef.current) tweenRef.current.kill();
      timers.current.forEach(function (t) { window.clearTimeout(t); });
      timers.current = [];
    };
  }, []);

  useImperativeHandle(ref, function () {
    return {
      spin(finalCol: number[], index: number, opts: { turbo?: boolean; anticipate?: boolean }): Promise<void> {
        return new Promise(function (resolve) {
          const el = stripRef.current;
          if (!el || !alive.current) { resolve(); return; }
          const div = opts.turbo ? 2.5 : 1;
          const slow = opts.anticipate ? 2 : 1;
          const next: number[] = [];
          for (let i = 0; i < STRIP_LEN - props.rows; i++) next.push(Math.floor(Math.random() * 9));
          for (let i = 0; i < props.rows; i++) next.push(finalCol[i] !== undefined ? finalCol[i] : 0);
          setStrip(next);
          const target = -(STRIP_LEN - props.rows) * CELL;
          if (reduced()) {
            gsap.set(el, { y: target });
            if (props.onSettle) props.onSettle(index);
            resolve();
            return;
          }
          setBlur(true);
          if (opts.anticipate) { setAnt(true); sfx.anticipation(); }
          gsap.set(el, { y: 0 });
          const tl = gsap.timeline({
            onComplete: function () {
              setBlur(false);
              setAnt(false);
              sfx.reelStop(index);
              if (props.onSettle) props.onSettle(index);
              resolve();
            }
          });
          tl.to(el, { y: 8, duration: 0.12 / div, ease: "power2.out" })
            .to(el, { y: target * 0.55, duration: (0.5 * slow) / div, ease: "power2.in" })
            .to(el, { y: target - 12, duration: (0.42 * slow) / div, ease: "none" })
            .to(el, { y: target, duration: 0.34 / div, ease: "back.out(1.7)" });
          tweenRef.current = tl as unknown as gsap.core.Tween;
        });
      },
      quickStop(): void {
        if (tweenRef.current) tweenRef.current.timeScale(6);
      }
    };
  }, [props.rows, props.onSettle]);

  const items = strip.map(function (k, i) {
    const src = hasGame(props.gameId) ? sym(props.gameId, k) : "";
    return (
      <div className="kb3-strip-cell" key={i} style={{ height: CELL }}>
        {src ? <img src={src} alt="" draggable={false}/> : null}
      </div>
    );
  });

  return (
    <div className={"kb3-reel" + (ant ? " kb3-ant" : "")} style={{ height: props.rows * CELL }}>
      <div className="kb3-fade kb3-fade-t"/>
      <div className="kb3-fade kb3-fade-b"/>
      <div ref={stripRef} className={"kb3-strip" + (blur ? " kb3-blur" : "")}>{items}</div>
    </div>
  );
});
