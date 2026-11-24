"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { stateAt, historyOf, botsOf, seedHash, roundHash, BET_MS } from "@/lib/kb2/crashLoop";
import { stateAt as localStateAt, cleanupEngine } from "@/src/kb3/crash/crashEngine";
import type { LiveRound, BotBet } from "@/lib/kb2/crashLoop";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";
import ClientOnly from "@/components/kb2/ClientOnly";
import Stage from "./Stage";
import { usePathname } from "next/navigation";
import { crashBySlug } from "@/lib/kb2/crashConfig";

interface Panel {
  stake: number;
  autoOn: boolean;
  autoAt: number;
  autoBet: boolean;
  index: number;
  state: "none" | "queued" | "live" | "cashed" | "lost";
  paid: number;
  tx: string;
  busy: boolean;
}

function fresh(stake: number): Panel {
  return { stake: stake, autoOn: false, autoAt: 2, autoBet: false, index: -1, state: "none", paid: 0, tx: "", busy: false };
}

export default function CrashLive() {
  const route = usePathname();
  const cfg = crashBySlug(route.split("/").pop() || "skyward");
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [rtp, setRtp] = useState(0.97);
  const [offset, setOffset] = useState(0);
  const slug = route.split("/").pop() || "skyward-jet";
  const [live, setLive] = useState<LiveRound>(function () { return stateAt(Date.now(), 0.97); });
  const [panels, setPanels] = useState<Panel[]>(function () { return [fresh(20), fresh(50)]; });
  const [tab, setTab] = useState("players");
  const [fair, setFair] = useState(false);
  const [clientSeed, setClientSeed] = useState("player-seed-01");
  const [err, setErr] = useState("");
  const [bots, setBots] = useState<BotBet[]>([]);
  const [viewers, setViewers] = useState(1180);
  const rtpRef = useRef(0.97);
  const offRef = useRef(0);
  const panRef = useRef<Panel[]>(panels);
  const idxRef = useRef(-1);
  const phaseRef = useRef("betting");
  const beatRef = useRef(0);
  panRef.current = panels;
  rtpRef.current = rtp;
  offRef.current = offset;

  const setPanel = useCallback(function (i: number, patch: Partial<Panel>) {
    setPanels(function (old) {
      return old.map(function (p, k) { return k === i ? Object.assign({}, p, patch) : p; });
    });
  }, []);

  const sync = useCallback(async function () {
    try {
      const r = await fetch("/api/kb2/crash", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) { setRtp(d.rtp); setOffset(d.now - Date.now()); }
    } catch (e) { /* local clock keeps running */ }
  }, []);

  useEffect(function () {
    void sync();
    const iv = window.setInterval(function () { void sync(); }, 5000);
    return function () { clearInterval(iv); };
  }, [sync]);

  useEffect(function () { setViewers(function (v) { return Math.max(700, Math.min(2600, v + Math.floor(Math.random() * 121) - 60)); }); }, [live.index]);

  const cash = useCallback(async function (i: number, at: number) {
    const p = panRef.current[i];
    if (p.state !== "live" || p.busy) return;
    setPanel(i, { busy: true });
    try {
      const r = await fetch("/api/kb2/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cash", panel: i, mult: at })
      });
      const d = await r.json();
      if (d.ok) {
        setPanel(i, { state: "cashed", paid: d.paid, tx: d.tx, busy: false });
        if (d.mult >= 5) getAudio().mega(); else getAudio().cash();
        toast("CASHED " + d.mult.toFixed(2) + "x +" + fmt(d.paid) + " " + d.tx, "j");
        refresh();
      } else {
        setPanel(i, { busy: false });
        setErr(d.error || "Cashout failed");
        getAudio().warn();
      }
    } catch (e) {
      setPanel(i, { busy: false });
      setErr("Network error on cashout");
    }
  }, [setPanel, toast, refresh]);

  const bet = useCallback(async function (i: number) {
    const p = panRef.current[i];
    if (p.busy) return;
    if (!me) { setErr("Sign in to place a bet"); getAudio().warn(); return; }
    if (p.stake < 1) { setErr("Minimum stake is 1"); getAudio().warn(); return; }
    if (p.stake > me.balance) { setErr("Insufficient balance"); getAudio().warn(); return; }
    setErr("");
    setPanel(i, { busy: true });
    getAudio().chip();
    try {
      const r = await fetch("/api/kb2/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "bet", panel: i, stake: p.stake, auto: p.autoOn ? p.autoAt : 0 })
      });
      const d = await r.json();
      if (d.ok) {
        setPanel(i, { state: d.queued ? "queued" : "live", index: d.index, paid: 0, tx: "", busy: false });
        toast(d.queued ? "Queued for round " + d.index : "Bet placed on round " + d.index, "g");
        refresh();
      } else {
        setPanel(i, { busy: false });
        setErr(d.error || "Bet rejected");
        getAudio().warn();
      }
    } catch (e) {
      setPanel(i, { busy: false });
      setErr("Network error on bet");
    }
  }, [me, setPanel, toast, refresh]);

  useEffect(function () {
    let raf = 0;
    const loop = function () {
      const s = stateAt(Date.now() + offRef.current, rtpRef.current);
      setLive(s);
      if (s.index !== idxRef.current) {
        idxRef.current = s.index;
        setBots(botsOf(s.index, slug));
        setPanels(function (old) {
          return old.map(function (p) {
            if (p.state === "queued" && p.index === s.index) return Object.assign({}, p, { state: "live" });
            if (p.state === "cashed" || p.state === "lost") return Object.assign({}, p, { state: "none", index: -1, paid: 0, tx: "" });
            if (p.state === "live" && p.index !== s.index) return Object.assign({}, p, { state: "none", index: -1 });
            return p;
          });
        });
        getAudio().count(3);
        setBots(botsOf(s.index, slug));
      }
      if (s.phase !== phaseRef.current) {
        if (s.phase === "flying") { getAudio().launch(); getAudio().hum(true); }
        if (s.phase === "crashed") {
          getAudio().hum(false);
          getAudio().riseStop();
          getAudio().bust();
          setPanels(function (old) {
            return old.map(function (p) { return p.state === "live" ? Object.assign({}, p, { state: "lost" }) : p; });
          });
        }
        if (s.phase === "betting") { getAudio().hum(false); getAudio().riseStop(); }
        phaseRef.current = s.phase;
      }
      if (s.phase === "flying") {
        getAudio().humLevel(s.mult);
        beatRef.current += 1;
        if (beatRef.current % 6 === 0) getAudio().rise(s.mult);
        panRef.current.forEach(function (p, i) {
          if (p.state === "live" && p.autoOn && s.mult >= p.autoAt && s.mult <= s.crashAt && !p.busy) void cash(i, p.autoAt);
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return function () {
      cancelAnimationFrame(raf);
      getAudio().hum(false);
      getAudio().riseStop();
      cleanupEngine(slug);
    };
  }, [cash]);

  useEffect(function () {
    panRef.current.forEach(function (p, i) {
      if (p.autoBet && p.state === "none" && live.phase === "betting" && me && p.stake <= me.balance && !p.busy) void bet(i);
    });
  }, [live.index, live.phase, me, bet]);

  const hist = historyOf(live.index, rtp, 16);
  const totalBets = bots.reduce(function (a, b) { return a + b.stake; }, 0);
  const totalWin = bots.reduce(function (a, b) { return a + (b.cash <= live.crashAt ? b.stake * b.cash : 0); }, 0);
  const winners = bots.filter(function (b) { return b.cash <= live.crashAt; }).length;
  const liveCount = panels.filter(function (p) { return p.state === "live"; }).length;

  const renderPanel = function (i: number) {
    const p = panels[i];
    const inRound = p.state === "live" && live.phase === "flying";
    const canBet = p.state === "none" && !p.busy;
    let label = "BET " + fmt(p.stake);
    if (inRound) label = "CASH OUT";
    else if (p.state === "queued") label = "QUEUED";
    else if (p.state === "cashed") label = "CASHED";
    else if (p.state === "lost") label = "BUSTED";
    else if (live.phase !== "betting") label = "BET NEXT ROUND";
    const amount = inRound ? p.stake * live.mult : p.stake;
    const locked = p.busy || p.state === "queued" || p.state === "cashed" || p.state === "lost" || (!inRound && !canBet);
    return (
      <div className={"kb3-panel" + (inRound ? " hot" : "")} key={i}>
        <div className="kb3-panel-head">
          <b>PANEL {i + 1}</b>
          <span className={"kb3-tag " + p.state}>{p.state === "none" ? "READY" : p.state.toUpperCase()}</span>
        </div>
        <div className="kb3-stake">
          <button disabled={p.busy || inRound} onClick={function () { getAudio().click(); setPanel(i, { stake: Math.max(1, p.stake - 5) }); }}>-</button>
          <input type="number" min={1} value={p.stake} disabled={p.busy || inRound} onChange={function (e) { setPanel(i, { stake: Math.max(1, Number(e.target.value) || 1) }); }}/>
          <button disabled={p.busy || inRound} onClick={function () { getAudio().click(); setPanel(i, { stake: p.stake + 5 }); }}>+</button>
        </div>
        <div className="kb3-quick">
          {[20, 50, 100].map(function (v) {
            return <button key={v} disabled={p.busy || inRound} onClick={function () { getAudio().chip(); setPanel(i, { stake: v }); }}>{v}</button>;
          })}
          <button disabled={p.busy || inRound} onClick={function () { getAudio().chip(); setPanel(i, { stake: Math.max(1, Math.floor(me ? me.balance : 1)) }); }}>Max</button>
        </div>
        <div className="kb3-sw">
          <label><input type="checkbox" checked={p.autoOn} onChange={function (e) { setPanel(i, { autoOn: e.target.checked }); }}/><span>Auto cashout</span></label>
          <input className="kb3-mini" type="number" min={1.01} step={0.1} value={p.autoAt} disabled={!p.autoOn} onChange={function (e) { setPanel(i, { autoAt: Math.max(1.01, Number(e.target.value) || 1.01) }); }}/>
          <em>x</em>
        </div>
        <div className="kb3-sw">
          <label><input type="checkbox" checked={p.autoBet} onChange={function (e) { setPanel(i, { autoBet: e.target.checked }); }}/><span>Auto play</span></label>
        </div>
        <button className={"kb3-go" + (inRound ? " cash" : "") + (p.state === "cashed" ? " done" : "") + (p.state === "lost" ? " dead" : "")} disabled={locked} onClick={function () { if (inRound) void cash(i, live.mult); else void bet(i); }}>
          <span>{p.busy ? "WORKING" : label}</span>
          <b>{fmt(amount)}</b>
          {inRound && <i>@ {live.mult.toFixed(2)}x</i>}
        </button>
        {p.state === "cashed" && <div className="kb3-receipt">+{fmt(p.paid)}<em>{p.tx}</em></div>}
      </div>
    );
  };

  return (
    <div className={"kb3 " + cfg.skin}>
      <div className="kb3-top">
        <Link href="/casino" className="kb3-back">Lobby</Link>
        <span className="kb3-demo">DEMO - no real money</span>
        <b className="kb3-title">{cfg.name} <span className="kb3-live-tag">LIVE</span></b>
        <div className="kb3-sp"/>
        <div className="kb3-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)}</b></div>
        <button className={"kb3-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"kb3-ico" + (fair ? " on" : "")} onClick={function () { setFair(function (v) { return !v; }); }}>FAIR</button>
      </div>

      <div className="kb3-hist">
        {hist.map(function (h) {
          const cls = h.crash >= 10 ? "mega" : h.crash >= 2 ? "hi" : h.crash >= 1.3 ? "mid" : "lo";
          return <span key={h.index} className={"kb3-chip " + cls}>{h.crash.toFixed(2)}x</span>;
        })}
      </div>

      <div className="kb3-main">
        <div className="kb3-scene" style={{ background: cfg.sky }}>
          <ClientOnly minHeight={380}>
            <Stage input={{ phase: live.phase, mult: live.mult, progress: live.progress, hue: cfg.hue, countdown: Math.ceil(live.betLeft / 1000), betCount: bots.length + liveCount }} craft={cfg.craft}/>
          </ClientOnly>
          <div className="kb3-overlay">
            <div className="kb3-bets">{bots.length + liveCount} bets this round</div>
          </div>
          {fair && (
            <div className="kb3-fair">
              <b>PROVABLY FAIR (DEMO)</b>
              <dl>
                <dt>Server seed hash</dt><dd>{seedHash()}</dd>
                <dt>Round hash</dt><dd>{roundHash(live.index)}</dd>
                <dt>Round index</dt><dd>{live.index}</dd>
                <dt>Formula</dt><dd>max(1, floor(100 x RTP / (1 - r)) / 100)</dd>
                <dt>RTP</dt><dd>{(rtp * 100).toFixed(1)}% - set by the administrator</dd>
              </dl>
              <label>Client seed<input value={clientSeed} onChange={function (e) { setClientSeed(e.target.value); }}/></label>
              <p>Shared round: the outcome derives from the server seed and round index only, so every player sees the same flight. The client seed is shown for verification practice and does not alter a shared result.</p>
              <button onClick={function () { setFair(false); }}>CLOSE</button>
            </div>
          )}
        </div>
        <div className="kb3-panels">{renderPanel(0)}{renderPanel(1)}</div>
      </div>

      {err && <div className="kb3-err">{err}</div>}

      <div className="kb3-tabs">
        <div className="kb3-tabbar">
          {[["players", "Players"], ["rounds", "Rounds"], ["top", "Best"]].map(function (o) {
            return <button key={o[0]} className={tab === o[0] ? "on" : ""} onClick={function () { setTab(o[0]); }}>{o[1]}</button>;
          })}
          <div className="kb3-sp"/>
          <span className="kb3-sum">~{viewers} watching</span>
          <span className="kb3-sum">{bots.length} players</span>
          <span className="kb3-sum">{fmt(totalBets)} staked</span>
          <span className="kb3-sum win">{fmt(totalWin)} paid</span>
          <span className="kb3-sim">SIMULATED</span>
        </div>
        <div className="kb3-table">
          {tab === "players" && bots.map(function (b, i) {
            const won = b.cash <= live.crashAt && live.phase === "crashed";
            const out = live.phase !== "crashed" && b.cash <= live.mult;
            return (
              <div key={i} className={"kb3-row" + (won ? " win" : "")}>
                <span className="kb3-user">{b.name}<em>BOT</em></span>
                <span>{fmt(b.stake)}</span>
                <span className={out || won ? "ok" : ""}>{out || won ? b.cash.toFixed(2) + "x" : "-"}</span>
                <span className={won ? "ok" : ""}>{won ? fmt(b.stake * b.cash) : "-"}</span>
              </div>
            );
          })}
          {tab === "rounds" && hist.map(function (h) {
            return (
              <div key={h.index} className="kb3-row">
                <span className="kb3-user">R{h.index}</span>
                <span>{roundHash(h.index).slice(0, 12)}</span>
                <span className={h.crash >= 2 ? "ok" : "no"}>{h.crash.toFixed(2)}x</span>
                <span>{h.crash >= 2 ? "paid" : "house"}</span>
              </div>
            );
          })}
          {tab === "top" && bots.slice().sort(function (a, b) { return b.stake * b.cash - a.stake * a.cash; }).slice(0, 8).map(function (b, i) {
            return (
              <div key={i} className="kb3-row win">
                <span className="kb3-user">{b.name}<em>BOT</em></span>
                <span>{fmt(b.stake)}</span>
                <span className="ok">{b.cash.toFixed(2)}x</span>
                <span className="ok">{fmt(b.stake * b.cash)}</span>
              </div>
            );
          })}
        </div>
        <p className="kb3-note">{winners} of {bots.length} simulated players cashed before the crash. House edge {((1 - rtp) * 100).toFixed(1)}% means the long-run result is always negative. Virtual currency has no monetary value.</p>
      </div>
    </div>
  );
}
