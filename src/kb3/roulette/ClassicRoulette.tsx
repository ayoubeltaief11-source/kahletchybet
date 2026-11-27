"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBalance } from "@/lib/balance-context";
import dynamic from "next/dynamic";
import { getGame, asset } from "../registry";
import { useApp } from "@/components/Shell";
import RouletteTable from "./RouletteTable";
import { useRouletteBets } from "./useRouletteBets";
import type { BetApi } from "./useRouletteBets";
import { spinOnce, randomSeed, settle, colorOf } from "./engine";
import type { Bet, PocketColor, RouletteVariant, Settlement, SpinOutcome } from "./engine";
import { rlSfx } from "./sfx";
import { WinOverlay } from "../slots/WinOverlay";
import RouletteIntro from "./RouletteIntro";

const WheelScene = dynamic(() => import("./WheelScene"), { ssr: false, loading: function () { return <div className="rlc-boot">LOADING WHEEL</div>; } });

const VARIANTS: Record<string, RouletteVariant> = {
  "emerald-roulette": "european",
  "crimson-roulette": "american",
  "royal-velvet": "french"
};

function r2(n: number): number { return Math.round(n * 100) / 100; }
function parity(p: string): string { if (p === "0" || p === "00") return "ZERO"; return Number(p) % 2 === 0 ? "EVEN" : "ODD"; }
function highlow(p: string): string { if (p === "0" || p === "00") return "â€”"; return Number(p) <= 18 ? "LOW 1-18" : "HIGH 19-36"; }
function hideImg(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.display = "none"; }

export default function ClassicRoulette({ slug }: { slug: string }) {
  const g = getGame(slug);
  const variant = VARIANTS[slug] || "european";
  const { me, refresh } = useApp();
  const [bal, setBal] = useState(0);
  const [phase, setPhase] = useState<"table" | "wheel" | "result">("table");
  const [msg, setMsg] = useState("PLACE YOUR BETS");
  const [spinId, setSpinId] = useState(0);
  const [target, setTarget] = useState(0);
  const [skipSig, setSkipSig] = useState(0);
  const [result, setResult] = useState<Settlement | null>(null);
  const [stake, setStake] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [history, setHistory] = useState<{ pocket: string; color: PocketColor }[]>([]);
  const [muted, setMuted] = useState(false);
  const [intro, setIntro] = useState(true);
  const [jump, setJump] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const [bigWin, setBigWin] = useState<{ amt: number; mult: number; tx: string; tier: number } | null>(null);
  const bets = useRouletteBets(variant, bal, phase !== "table");
  const betsRef = useRef<BetApi>(bets);
  betsRef.current = bets;
  const spinBetsRef = useRef<Bet[]>([]);
  const outcomeRef = useRef<SpinOutcome | null>(null);
  const stakeRef = useRef(0);
  const idRef = useRef("");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(function () { if (me) setBal(me.balance); }, [me]);
  useEffect(function () { setMuted(rlSfx.isMuted()); }, []);
  useEffect(function () { try { if (window.localStorage.getItem("kb3_rl_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ } }, [slug]);

  const doSpin = useCallback(function () {
    if (phaseRef.current !== "table") return;
    rlSfx.unlock();
    const api = betsRef.current;
    const total = api.total;
    if (total <= 0) { setMsg("PLACE YOUR BETS FIRST"); return; }
    if (total > bal) { setMsg("INSUFFICIENT BALANCE"); setAutoLeft(0); return; }
    const placed = api.confirm();
    if (placed.length === 0) return;
    spinBetsRef.current = placed;
    stakeRef.current = total;
    setStake(total);
    setBal(function (b) { return r2(b - total); });
    const out = spinOnce(variant, randomSeed());
    outcomeRef.current = out;
    idRef.current = "RL-" + Date.now().toString(36).toUpperCase();
    setTarget(out.index);
    setSpinId(function (s) { return s + 1; });
    setResult(null);
    setHighlight(null);
    setMsg("NO MORE BETS");
    setPhase("wheel");
    rlSfx.chip();
  }, [bal, variant]);

  const handleSettled = useCallback(function () {
    const out = outcomeRef.current;
    if (!out) return;
    const s = settle(variant, spinBetsRef.current, out.pocket);
    setResult(s);
    setPhase("result");
    setHighlight(s.pocket);
    setBal(function (b) { return r2(b + s.totalReturn); });
    setLastWin(s.totalReturn);
    setHistory(function (h) { return [{ pocket: s.pocket, color: s.color }].concat(h).slice(0, 15); });
    const mult = stakeRef.current > 0 ? s.totalReturn / stakeRef.current : 0;
    if (s.totalReturn > 0) {
      rlSfx.win(mult > 15);
      setJump(true);
      window.setTimeout(function () { setJump(false); }, 900);
      if (mult > 15) setBigWin({ amt: s.totalReturn, mult: mult, tx: idRef.current, tier: 2 });
      setMsg("YOU WON " + s.totalReturn.toFixed(2) + " TD");
    } else {
      rlSfx.lose();
      setMsg("YOU LOST " + stakeRef.current.toFixed(2) + " TD");
    }
    refresh();
  }, [variant, refresh]);

  const backToTable = useCallback(function () {
    setPhase("table");
    setMsg("REBET READY â€” PLACE YOUR BETS");
  }, []);

  useEffect(function () {
    if (phase !== "result") return;
    const t = window.setTimeout(backToTable, 4200);
    return function () { window.clearTimeout(t); };
  }, [phase, backToTable]);

  useEffect(function () {
    if (autoLeft <= 0 || phase !== "table") return;
    const t = window.setTimeout(function () {
      if (betsRef.current.state.placements.length === 0) betsRef.current.rebet();
      window.setTimeout(function () {
        doSpin();
        setAutoLeft(function (a) { return a - 1; });
      }, 80);
    }, 700);
    return function () { window.clearTimeout(t); };
  }, [autoLeft, phase, doSpin]);

  const vars = { ["--rl-felt" as string]: g.color, ["--rl-acc" as string]: g.color2 };

  return (
    <div className="rlc-root" style={vars}>
      <div className="rlc-bg" style={{ backgroundImage: "url(" + asset(slug, "bg") + ")" }}/>
      <div className="rlc-scrim"/>
      {intro && <RouletteIntro slug={slug} onPlay={function () { setIntro(false); rlSfx.unlock(); }}/>}
      <header className="rlc-head">
        <img className="rlc-logo" src={asset(slug, "logo")} alt="" onError={hideImg}/>
        <b className="rlc-title">{g.title}</b>
        <span className="rlc-tag">{variant === "american" ? "DOUBLE ZERO" : variant === "french" ? "LA PARTAGE" : "SINGLE ZERO"}</span>
        <div className="rlc-sp"/>
        {autoLeft > 0 && <button className="rlc-mute" onClick={function () { setAutoLeft(0); }}>STOP AUTO ({autoLeft})</button>}
        <button className="rlc-mute" onClick={function () { setMuted(rlSfx.toggleMute()); }}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
        <div className="rlc-bal"><span>BALANCE</span><b>{bal.toFixed(2)} TD</b></div>
      </header>
      <div className="rlc-main">
        <aside className={"rlc-char" + (jump ? " rlc-jump" : "")}>
          <img src={asset(slug, "character")} alt="" onError={hideImg}/>
        </aside>
        <div className={"rlc-stage" + (phase === "result" ? " rlc-sweep" : "")}>
          <WinOverlay win={bigWin} accent={g.color2} onDismiss={function () { setBigWin(null); }}>
            {phase === "table" ? (
              <RouletteTable gameId={slug} variant={variant} balance={bal} locked={false} message={msg} highlight={highlight} lastWin={lastWin} bets={bets} onSpin={doSpin} onAuto={function (n) { setAutoLeft(n); }}/>
            ) : (
              <div className="rlc-wheelbox">
                <WheelScene variant={variant} accent={g.color} accent2={g.color2} spinId={spinId} targetIndex={target} idleAfter={false} skipSignal={skipSig} onSettled={handleSettled}/>
                {phase === "wheel" && <button className="rlc-skip" onClick={function () { setSkipSig(function (s) { return s + 1; }); }}>CLICK TO SKIP</button>}
                {phase === "result" && result && (
                  <div className="rlc-result">
                    <div className={"rlc-num " + (result.color === "red" ? "rlc-red" : result.color === "black" ? "rlc-black" : "rlc-green")}>{result.pocket}</div>
                    <div className="rlc-meta"><span>{parity(result.pocket)}</span><span>{highlow(result.pocket)}</span></div>
                    <b className={result.totalReturn > 0 ? "rlc-won" : "rlc-lost"}>
                      {result.totalReturn > stake ? "YOU WON " + result.totalReturn.toFixed(2) + " TD" : result.totalReturn > 0 ? "RETURNED " + result.totalReturn.toFixed(2) + " TD" : "YOU LOST " + stake.toFixed(2) + " TD"}
                    </b>
                    <button className="rl-btn" onClick={backToTable}>CONTINUE</button>
                  </div>
                )}
              </div>
            )}
          </WinOverlay>
          <div className="rlc-history">
            <span className="rlc-hlabel">LAST 15</span>
            {history.map(function (h, i) { return <span key={i} className={"rlc-hdot rlc-h-" + h.color}>{h.pocket}</span>; })}
          </div>
        </div>
      </div>
    </div>
  );
}

