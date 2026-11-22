"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { slotAudio } from "@/src/kb3/audio/slotAudio";
import { SlotChrome } from "@/src/kb3/ui/SlotChrome";
import { WinBanner, tierFor } from "@/src/kb3/motion/winFx";
import { burstAt } from "@/src/kb3/motion/particles";
import { Reels } from "@/src/kb3/slots/Reels";
import type { ReelHandle } from "@/src/kb3/slots/Reels";

const COLS = 5, ROWS = 4;

export default function Kb3Demo() {
  const reels = useRef<ReelHandle>(null);
  const [win, setWin] = useState<{ tier: number; amt: number } | null>(null);
  const [mood, setMood] = useState<"idle" | "win" | "freespin">("idle");
  const [turbo, setTurbo] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  function doSpin() {
    slotAudio.unlock();
    const finalGrid = Array.from({ length: COLS * ROWS }, function () { return Math.floor(Math.random() * 9); });
    const anticipate = Math.random() < 0.5 ? [0, 1] : [];
    if (reels.current) reels.current.spin(finalGrid, { turbo: turbo, anticipate: anticipate });
    window.setTimeout(function () {
      const mult = [0, 0, 18, 35, 70][Math.floor(Math.random() * 5)];
      if (mult > 0) {
        setWin({ tier: tierFor(mult), amt: mult * 10 });
        setMood("win");
        if (hostRef.current) burstAt(hostRef.current, "#ffd97a", 22);
        slotAudio.cash();
        window.setTimeout(function () { setMood("idle"); }, 2600);
      }
    }, turbo ? 900 : 1900);
  }

  return (
    <div className="kb3-demo" onClick={function () { slotAudio.unlock(); }}>
      <style>{[
        ".kb3-demo{position:relative;min-height:100vh;overflow:hidden;background:#04060a;font-family:Rajdhani,system-ui,sans-serif;color:#eaf1fa}",
        ".kb3-chrome{position:absolute;inset:0;overflow:hidden;z-index:0}",
        ".kb3-bg{position:absolute;inset:-4%;background-size:cover;background-position:center;animation:kb3par 60s ease-in-out infinite alternate;filter:saturate(1.05)}",
        "@keyframes kb3par{from{transform:translate3d(-1.5%,-1%,0) scale(1.06)}to{transform:translate3d(1.5%,1%,0) scale(1.1)}}",
        ".kb3-bg-dim{position:absolute;inset:0;background:rgba(4,6,10,.55)}",
        ".kb3-pfield{position:absolute;inset:0;width:100%;height:100%}",
        ".kb3-mascot{position:absolute;right:3%;bottom:6%;z-index:2;animation:kb3breathe 3s ease-in-out infinite}",
        "@keyframes kb3breathe{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.03) translateY(-6px)}}",
        ".kb3-mood-win{animation:kb3jump .6s ease-out}",
        "@keyframes kb3jump{0%{transform:scale(1)}40%{transform:scale(1.12) translateY(-16px)}100%{transform:scale(1.04)}}",
        ".kb3-mood-freespin{animation:kb3shake .5s ease-in-out infinite}",
        "@keyframes kb3shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}",
        ".kb3-stage{position:relative;z-index:3;max-width:760px;margin:0 auto;padding:40px 16px}",
        ".kb3-reels{display:flex;gap:8px;justify-content:center;padding:18px;border-radius:16px;background:rgba(4,6,10,.5);border:1px solid rgba(255,217,122,.25);backdrop-filter:blur(3px)}",
        ".kb3-reel{position:relative;display:flex;flex-direction:column;gap:6px;overflow:hidden;border-radius:10px}",
        ".kb3-blur .kb3-cell{filter:blur(3px)}",
        ".kb3-reel-fade{position:absolute;left:0;right:0;height:22%;pointer-events:none;z-index:2}",
        ".kb3-fade-top{top:0;background:linear-gradient(180deg,rgba(0,0,0,.7),transparent)}",
        ".kb3-fade-bot{bottom:0;background:linear-gradient(0deg,rgba(0,0,0,.7),transparent)}",
        ".kb3-cell{width:86px;height:86px;display:grid;place-items:center;background:linear-gradient(180deg,rgba(8,12,22,.42),rgba(4,6,12,.62));border-radius:8px}",
        ".kb3-cell img{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}",
        ".kb3-controls{display:flex;gap:10px;justify-content:center;margin-top:22px;flex-wrap:wrap}",
        ".kb3-btn{padding:12px 22px;border-radius:12px;border:1px solid #2a3a4f;background:#141d2b;color:#eaf1fa;font:900 12px/1 system-ui;letter-spacing:1.2px;cursor:pointer}",
        ".kb3-btn.gold{background:linear-gradient(135deg,#ffd97a,#e8b33c);color:#231400;border-color:transparent}",
        ".kb3-btn:hover{transform:translateY(-2px)}",
        ".kb3-winwrap{position:fixed;inset:0;z-index:60;display:grid;place-items:center;pointer-events:none}",
        ".kb3-coinrain{position:absolute;inset:0;width:100%;height:100%}",
        ".kb3-win{position:relative;text-align:center;padding:34px 60px;border-radius:22px;background:rgba(4,6,10,.82);border:2px solid #ffd97a;overflow:hidden}",
        ".kb3-rays{position:absolute;inset:-60%;background:conic-gradient(from 0deg,transparent 0 12deg,rgba(255,217,122,.22) 12deg 20deg,transparent 20deg 40deg);animation:kb3spin 6s linear infinite}",
        "@keyframes kb3spin{to{transform:rotate(360deg)}}",
        ".kb3-win-label{position:relative;font:900 20px/1 Orbitron,system-ui;letter-spacing:4px;color:#ffd97a}",
        ".kb3-win-amt{position:relative;display:block;font:900 64px/1 Orbitron,system-ui;color:#fff;text-shadow:0 0 26px rgba(255,217,122,.8)}",
        ".kb3-win-sub{position:relative;font:800 12px/1 system-ui;color:#93a6c0;letter-spacing:2px}",
        ".kb3-skip{position:relative;margin-top:14px;pointer-events:auto;padding:8px 18px;border-radius:9px;border:1px solid #2a3a4f;background:#0d1420;color:#93a6c0;font:800 10px/1 system-ui;cursor:pointer}",
        ".kb3-shake-2{animation:kb3shk .5s ease-in-out}",
        ".kb3-shake-3{animation:kb3shk .7s ease-in-out}",
        "@keyframes kb3shk{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,2px)}40%{transform:translate(6px,-2px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(4px,2px)}}",
        "@media(max-width:720px){.kb3-mascot{right:auto;left:50%;transform:translateX(-50%);bottom:auto;top:2%;}.kb3-cell{width:60px;height:60px}.kb3-cell img{width:50px;height:50px}}"
      ].join("\n")}</style>

      <SlotChrome slug="candy-cascade" accent="#ff6fb5" accent2="#ffd97a" mood={mood}/>

      <div className="kb3-stage" ref={hostRef}>
        <h1 style={{ textAlign: "center", font: "900 22px/1 Orbitron,system-ui", letterSpacing: "2px", color: "#ffd97a", marginBottom: 8 }}>KB3 MOTION LAB</h1>
        <p style={{ textAlign: "center", font: "600 12px/1.5 system-ui", color: "#93a6c0", marginBottom: 18 }}>Demo of the new motion engine: sequential reel stops, anticipation, tumble bursts, win tiers, parallax background and breathing mascot.</p>
        <Reels
          ref={reels}
          cols={COLS}
          rows={ROWS}
          onSettle={function () {}}
          renderSymbol={function (k) {
            return <img src={"/assets/packs/candy/s" + ((k % 9) + 1) + ".png"} alt="" draggable={false}/>;
          }}
        />
        <div className="kb3-controls">
          <button className="kb3-btn gold" onClick={doSpin}>SPIN</button>
          <button className="kb3-btn" onClick={function () { if (reels.current) reels.current.stopNow(); }}>QUICK STOP</button>
          <button className="kb3-btn" onClick={function () { setTurbo(function (t) { return !t; }); }}>TURBO: {turbo ? "ON" : "OFF"}</button>
          <button className="kb3-btn" onClick={function () { setWin({ tier: 3, amt: 700 }); slotAudio.win(3); }}>EPIC WIN</button>
          <button className="kb3-btn" onClick={function () { setMood("freespin"); }}>FREE SPINS</button>
        </div>
      </div>

      {win && <WinBanner tier={win.tier as any} amount={win.amt} onDone={function () { setWin(null); }}/>}
    </div>
  );
}
