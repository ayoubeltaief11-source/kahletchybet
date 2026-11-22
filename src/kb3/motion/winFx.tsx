"use client";
import { useEffect, useRef, useState } from "react";
import { CoinRain } from "./particles";
import { slotAudio } from "../audio/slotAudio";

export type WinTier = 0 | 1 | 2 | 3;

export function tierFor(mult: number): WinTier {
  if (mult >= 60) return 3;
  if (mult >= 30) return 2;
  if (mult >= 15) return 1;
  return 0;
}

const LABELS = ["", "BIG WIN", "MEGA WIN", "EPIC WIN"];

export function WinBanner({ tier, amount, onDone }: { tier: WinTier; amount: number; onDone?: () => void }) {
  const [val, setVal] = useState(0);
  const [gone, setGone] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(function () {
    if (tier <= 0) return;
    slotAudio.win(tier);
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(amount * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const hide = window.setTimeout(function () {
      setGone(true);
      if (doneRef.current) doneRef.current();
    }, 5000);
    return function () { cancelAnimationFrame(raf); window.clearTimeout(hide); };
  }, [tier, amount]);

  if (tier <= 0 || gone) return null;

  return (
    <div className={"kb3-winwrap kb3-shake-" + tier}>
      <CoinRain active={true} duration={4200}/>
      <div className={"kb3-win kb3-win-" + tier}>
        <div className="kb3-rays"/>
        <span className="kb3-win-label">{LABELS[tier]}</span>
        <b className="kb3-win-amt">{val.toLocaleString()}</b>
        <span className="kb3-win-sub">TD</span>
        <button className="kb3-skip" onClick={function () { setGone(true); if (doneRef.current) doneRef.current(); }}>SKIP</button>
      </div>
    </div>
  );
}
