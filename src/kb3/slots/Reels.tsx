"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import gsap from "gsap";
import { slotAudio } from "../audio/slotAudio";

export interface ReelHandle {
  spin: (finalGrid: number[], opts?: { turbo?: boolean; anticipate?: number[] }) => void;
  stopNow: () => void;
}

interface Props {
  cols: number;
  rows: number;
  renderSymbol: (k: number, col: number, row: number) => any;
  onSettle?: () => void;
}

export const Reels = forwardRef<ReelHandle, Props>(function Reels(props, ref) {
  const [grid, setGrid] = useState<number[]>(function () {
    return Array.from({ length: props.cols * props.rows }, function (_, i) { return i % 9; });
  });
  const [blur, setBlur] = useState<boolean[]>(Array(props.cols).fill(false));
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelines = useRef<(gsap.core.Timeline | null)[]>([]);
  const settleRef = useRef<(() => void) | undefined>(props.onSettle);
  settleRef.current = props.onSettle;

  useImperativeHandle(ref, function () {
    return {
      spin: function (finalGrid: number[], opts?: { turbo?: boolean; anticipate?: number[] }) {
        const turbo = !!(opts && opts.turbo);
        const div = turbo ? 2.5 : 1;
        const anticipate = (opts && opts.anticipate) || [];
        slotAudio.spinStart();
        setGrid(finalGrid.slice());
        for (let c = 0; c < props.cols; c++) {
          const el = colRefs.current[c];
          if (!el) continue;
          const isAnt = anticipate.indexOf(c) >= 0;
          setBlur(function (b) { const n = b.slice(); n[c] = true; return n; });
          gsap.fromTo(el, { y: 6 }, { y: 0, duration: 0.12 / div, ease: "power2.out" });
          const spinDur = (isAnt ? 1.5 : 0.9) / div;
          const delay = (c * 0.15) / div;
          const tl = gsap.timeline({ delay: delay });
          tl.to(el, { y: -26, duration: spinDur * 0.35, ease: "power2.in" })
            .to(el, { y: 0, duration: spinDur * 0.65, ease: "none" })
            .to(el, {
              y: 12, duration: 0.14 / div, ease: "back.out(1.7)",
              onStart: function () {
                setBlur(function (b) { const n = b.slice(); n[c] = false; return n; });
                slotAudio.reelTick(c);
              }
            })
            .to(el, { y: 0, duration: 0.18 / div, ease: "elastic.out(1,0.4)" });
          if (isAnt) {
            tl.to(el, { boxShadow: "0 0 0 3px #ffd97a, 0 0 22px rgba(255,217,122,.7)", duration: 0.2, yoyo: true, repeat: 3 }, 0);
            slotAudio.anticipation();
          }
          timelines.current[c] = tl;
        }
        const total = ((props.cols - 1) * 0.15 + 1.3) / div;
        window.setTimeout(function () { if (settleRef.current) settleRef.current(); }, total * 1000 + 120);
      },
      stopNow: function () {
        for (let c = 0; c < props.cols; c++) {
          const tl = timelines.current[c];
          if (tl) tl.timeScale(4);
        }
      }
    };
  }, [props.cols]);

  return (
    <div className="kb3-reels">
      {Array.from({ length: props.cols }).map(function (_, c) {
        return (
          <div
            key={c}
            className={"kb3-reel" + (blur[c] ? " kb3-blur" : "")}
            ref={function (el) { colRefs.current[c] = el; }}
          >
            <div className="kb3-reel-fade kb3-fade-top"/>
            <div className="kb3-reel-fade kb3-fade-bot"/>
            {Array.from({ length: props.rows }).map(function (_, r) {
              return <div className="kb3-cell" key={r}>{props.renderSymbol(grid[c * props.rows + r] || 0, c, r)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
});
