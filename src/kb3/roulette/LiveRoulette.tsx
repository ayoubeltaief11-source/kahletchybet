"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getGame, asset } from "../registry";
import { useApp } from "@/components/Shell";
import RouletteTable from "./RouletteTable";
import { useRouletteBets } from "./useRouletteBets";
import type { BetApi } from "./useRouletteBets";
import { spinOnce, randomSeed, settle, pocketsFor } from "./engine";
import type { Bet, PocketColor, Settlement, SpinOutcome } from "./engine";
import { rlSfx } from "./sfx";
import { WinOverlay } from "../slots/WinOverlay";
import RouletteIntro from "./RouletteIntro";

const WheelScene = dynamic(() => import("./WheelScene"), { ssr: false, loading: function () { return <div className="rlc-boot">LOADING WHEEL</div>; } });

function r2(n: number): number { return Math.round(n * 100) / 100; }
function parity(p: string): string { if (p === "0") return "ZERO"; return Number(p) % 2 === 0 ? "EVEN" : "ODD"; }
function highlow(p: string): string { if (p === "0") return "—"; return Number(p) <= 18 ? "LOW" : "HIGH"; }
function hideImg(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.display = "none"; }

export default function LiveRoulette({ slug }: { slug: string }) {
  const g = getGame(slug);
  const { me, refresh } = useApp();
  const [bal, setBal] = useState(0);
  const [phase, setPhase] = useState<"betting" | "locked" | "spinning" | "result">("betting");
  const [secs, setSecs] = useState(20);
  const [round, setRound] = useState(1);
  const [spinId, setSpinId] = useState(0);
  const [target, setTarget] = useState(0);
  const [result, setResult] = useState<Settlement | null>(null);
  const [stake, setStake] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [history, setHistory] = useState<{ pocket: string; color: PocketColor }[]>([]);
  const [players, setPlayers] = useState(1480);
  const [muted, setMuted] = useState(false);
  const [intro, setIntro] = useState(true);
  const [jump, setJump] = useState(false);
  const [bigWin, setBigWin] = useState<{ amt: number; mult: number; tx: string; tier: number } | null>(null);
  const bets = useRouletteBets("european", bal, phase === "locked");
  const betsRef = useRef<BetApi>(bets);
  betsRef.current = bets;
  const balRef = useRef(bal);
  balRef.current = bal;
  const roundBetsRef = useRef<Bet[]>([]);
  const stakeRef = useRef(0);
  const outcomeRef = useRef<SpinOutcome | null>(null);

  useEffect(function () { if (me) setBal(me.balance); }, [me]);
  useEffect(function () { setMuted(rlSfx.isMuted()); }, []);
  useEffect(function () { try { if (window.localStorage.getItem("kb3_rl_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ } }, [slug]);

  const lockRound = useCallback(function () {
    const api = betsRef.current;
    const total = api.total;
    let placed: Bet[] = [];
    let st = 0;
    if (total > 0 && total <= balRef.current) {
      placed = api.confirm();
      st = total;
      setBal(function (b) { return r2(b - total); });
    } else if (total > 0) {
      api.clear();
    }
    roundBetsRef.current = placed;
    stakeRef.current = st;
    setStake(st);
    const out = spinOnce("european", randomSeed());
    outcomeRef.current = out;
    setTarget(out.index);
    setHighlight(null);
    setResult(null);
    setPhase("locked");
  }, []);

  const handleSettled = useCallback(function () {
    const out = outcomeRef.current;
    if (!out) return;
    const s = settle("european", roundBetsRef.current, out.pocket);
    setResult(s);
    setHighlight(s.pocket);
    if (s.totalReturn > 0) setBal(function (b) { return r2(b + s.totalReturn); });
    setLastWin(s.totalReturn);
    setHistory(function (h) { return [{ pocket: s.pocket, color: s.color }].concat(h).slice(0, 30); });
    const mult = stakeRef.current > 0 ? s.totalReturn / stakeRef.current : 0;
    if (s.totalReturn > 0 && stakeRef.current > 0) {
      rlSfx.win(mult > 15);
      setJump(true);
      window.setTimeout(function () { setJump(false); }, 900);
      if (mult > 15) setBigWin({ amt: s.totalReturn, mult: mult, tx: "AR-" + (1000 + round), tier: 2 });
    }
    refresh();
    setPhase("result");
  }, [refresh, round]);

  useEffect(function () {
    if (phase === "betting") {
      setSecs(20);
      const iv = window.setInterval(function () {
        setSecs(function (s) { if (s <= 6 && s > 1) rlSfx.count(); return Math.max(0, s - 1); });
      }, 1000);
      const to = window.setTimeout(lockRound, 20000);
      return function () { window.clearInterval(iv); window.clearTimeout(to); };
    }
    if (phase === "locked") {
      const to = window.setTimeout(function () {
        setSpinId(function (s) { return s + 1; });
        setSecs(13);
        setPhase("spinning");
      }, 2000);
      return function () { window.clearTimeout(to); };
    }
    if (phase === "spinning" || phase === "result") {
      const iv = window.setInterval(function () { setSecs(function (s) { return Math.max(0, s - 1); }); }, 1000);
      if (phase === "result") {
        const to = window.setTimeout(function () {
          setRound(function (r) { return r + 1; });
          setPlayers(function (p) { return Math.max(900, Math.min(2600, p + Math.floor(Math.random() * 81) - 40)); });
          setPhase("betting");
        }, 4000);
        return function () { window.clearInterval(iv); window.clearTimeout(to); };
      }
      return function () { window.clearInterval(iv); };
    }
  }, [phase, lockRound]);

  const counts: Record<string, number> = {};
  history.forEach(function (h) { counts[h.pocket] = (counts[h.pocket] || 0) + 1; });
  const sorted = pocketsFor("european").slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); });
  const hot = sorted.slice(0, 3);
  const cold = sorted.slice(-3).reverse();
  const msg = phase === "betting" ? "PLACE YOUR BETS — " + secs + "s" : phase === "locked" ? "NO MORE BETS" : "BETTING OPEN FOR NEXT ROUND";
  const vars = { ["--rl-felt" as string]: g.color, ["--rl-acc" as string]: g.color2 };

  return (
    <div className="rlc-root rll-root" style={vars}>
      <div className="rlc-bg" style={{ backgroundImage: "url(" + asset(slug, "bg") + ")" }}/>
      <div className="rlc-scrim"/>
      {intro && <RouletteIntro slug={slug} onPlay={function () { setIntro(false); rlSfx.unlock(); }}/>}
      <header className="rlc-head">
        <img className="rlc-logo" src={asset(slug, "logo")} alt="" onError={hideImg}/>
        <b className="rlc-title">{g.title}</b>
        <span className="rlc-tag rll-live">LIVE</span>
        <span className="rll-players">PLAYERS {players} <i>SIMULATION</i></span>
        <span className="rll-round">ROUND #{1000 + round} · AR-{1000 + round}</span>
        <div className="rlc-sp"/>
        <button className="rlc-mute" onClick={function () { setMuted(rlSfx.toggleMute()); }}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
        <div className="rlc-bal"><span>BALANCE</span><b>{bal.toFixed(2)} TD</b></div>
      </header>
      <div className="rll-top">
        <aside className={"rlc-char rll-char" + (jump ? " rlc-jump" : "")}>
          <img src={asset(slug, "character")} alt="" onError={hideImg}/>
        </aside>
        <div className="rll-wheelbox">
          <WheelScene variant="european" accent={g.color} accent2={g.color2} spinId={spinId} targetIndex={target} idleAfter={true} onSettled={handleSettled}/>
          {phase === "betting" && <div className="rll-banner rll-bet"><b>BETTING OPEN</b><span>{secs}</span></div>}
          {phase === "locked" && <div className="rll-banner rll-lock"><b>NO MORE BETS</b></div>}
          {phase === "spinning" && <div className="rll-banner rll-spin"><b>SPINNING</b><span>NEXT ROUND ~{secs}s</span></div>}
          {phase === "result" && result && (
            <div className="rlc-result rll-result">
              <div className={"rlc-num " + (result.color === "red" ? "rlc-red" : result.color === "black" ? "rlc-black" : "rlc-green")}>{result.pocket}</div>
              <div className="rlc-meta"><span>{parity(result.pocket)}</span><span>{highlow(result.pocket)}</span></div>
              <b className={result.totalReturn > 0 ? "rlc-won" : "rlc-lost"}>
                {stake === 0 ? "NO BET THIS ROUND" : result.totalReturn > stake ? "YOU WON " + result.totalReturn.toFixed(2) + " TD" : result.totalReturn > 0 ? "RETURNED " + result.totalReturn.toFixed(2) + " TD" : "YOU LOST " + stake.toFixed(2) + " TD"}
              </b>
            </div>
          )}
        </div>
        <aside className="rll-side">
          <div className="rll-hc">
            <b>HOT</b>
            {hot.map(function (n) { return <span key={n} className={"rlc-hdot rlc-h-" + (n === "0" ? "green" : "")}>{n}<i>{counts[n] || 0}</i></span>; })}
          </div>
          <div className="rll-hc">
            <b>COLD</b>
            {cold.map(function (n) { return <span key={n} className="rlc-hdot rll-cold">{n}<i>{counts[n] || 0}</i></span>; })}
          </div>
        </aside>
      </div>
      <WinOverlay win={bigWin} accent={g.color2} onDismiss={function () { setBigWin(null); }}>
        <RouletteTable gameId={slug} variant="european" balance={bal} locked={phase === "locked"} message={msg} highlight={highlight} lastWin={lastWin} bets={bets} autoMode={true}/>
      </WinOverlay>
      <div className="rlc-history">
        <span className="rlc-hlabel">LAST 15</span>
        {history.slice(0, 15).map(function (h, i) { return <span key={i} className={"rlc-hdot rlc-h-" + h.color}>{h.pocket}</span>; })}
      </div>
    </div>
  );
}
