"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import Sym from "./Sym";
import { useKbAudio } from "./audio";

export default function MinesGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const [stake, setStake] = useState(5);
  const [mines, setMines] = useState(3);
  const [live, setLive] = useState(false);
  const [rid, setRid] = useState("");
  const [opened, setOpened] = useState<number[]>([]);
  const [bombs, setBombs] = useState<number[]>([]);
  const [mult, setMult] = useState(1);
  const [next, setNext] = useState(1);
  const [dead, setDead] = useState(false);
  const [cashed, setCashed] = useState<{ paid: number; tx: string } | null>(null);
  const lock = useRef(false);

  const reset = useCallback(function () { setOpened([]); setBombs([]); setMult(1); setNext(1); setDead(false); setCashed(null); }, []);
  useEffect(function () { reset(); }, [g.id, reset]);

  const start = useCallback(async function () {
    if (lock.current) return;
    if (!me) { toast("Sign in to play", "e"); return; }
    if (stake < 1 || stake > me.balance) { toast("Check stake and TD balance", "e"); return; }
    lock.current = true; reset(); au.launch();
    const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "mines-start", stake: stake, mines: mines }) });
    const d = await r.json(); lock.current = false;
    if (!d.ok) { toast(d.error || "Rejected", "e"); return; }
    setRid(d.roundId); setNext(d.next); setLive(true); refresh();
  }, [me, stake, mines, g.id, reset, au, refresh, toast]);

  const open = useCallback(async function (i: number) {
    if (!live || dead || opened.indexOf(i) >= 0 || lock.current) return;
    lock.current = true; au.click();
    const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "mines-pick", roundId: rid, cell: i }) });
    const d = await r.json(); lock.current = false;
    if (!d.ok) { toast(d.error || "Rejected", "e"); return; }
    if (d.boom) {
      setBombs(d.bombs); setDead(true); setLive(false); au.bust();
      toast("BOOM - lost " + fmt(stake) + "  ID " + rid, "e"); refresh(); return;
    }
    setOpened(function (o) { return o.concat([i]); });
    setMult(d.mult); setNext(d.next); au.tick(d.mult);
  }, [live, dead, opened, g.id, rid, stake, au, toast, refresh]);

  const cash = useCallback(async function () {
    if (!live || dead || opened.length === 0 || lock.current) return;
    lock.current = true;
    const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "mines-cash", roundId: rid }) });
    const d = await r.json(); lock.current = false;
    if (!d.ok) { toast(d.error || "Rejected", "e"); return; }
    setBombs(d.bombs); setCashed({ paid: d.paid, tx: d.tx }); setLive(false); au.cash();
    toast("CASHED " + mult.toFixed(2) + "x  +" + fmt(d.paid) + "  ID " + d.tx, "j"); refresh();
  }, [live, dead, opened, g.id, rid, mult, au, toast, refresh]);

  const gem = g.syms[0] || "diamond";
  return (
    <div className="kbm" style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - fair odds x RTP {(rtp * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbm-body">
        <div className="kbm-field" style={{ background: "radial-gradient(90% 80% at 50% 0%," + g.sky[1] + "66, transparent 65%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbm-ladder">
            <span>NOW <b>{mult.toFixed(2)}x</b></span>
            <span>NEXT <b>{next.toFixed(2)}x</b></span>
            <span>SAFE <b>{opened.length}/{25 - mines}</b></span>
          </div>
          <div className="kbm-grid">
            {Array.from({ length: 25 }).map(function (_, i) {
              const isOpen = opened.indexOf(i) >= 0;
              const isBomb = bombs.indexOf(i) >= 0;
              const rev = isOpen || (bombs.length > 0 && isBomb);
              return (
                <button key={i} className={"kbm-cell" + (isOpen ? " safe" : "") + (isBomb && bombs.length ? " bomb" : "") + (rev ? " rev" : "")} disabled={!live || dead || isOpen} onClick={function () { void open(i); }}>
                  {isOpen && <Sym k={gem} size={38}/>}
                  {isBomb && bombs.length > 0 && <span className="kbm-bomb">X</span>}
                  {!rev && <span className="kbm-hide"/>}
                </button>
              );
            })}
          </div>
          {dead && <div className="kbm-tag lose">BOOM - Round {rid}</div>}
          {cashed && <div className="kbm-tag win"><b>+{fmt(cashed.paid)}</b><span>{mult.toFixed(2)}x</span><em>CASHOUT ID {cashed.tx}</em></div>}
          {!live && !dead && !cashed && <div className="kbm-tag idle">Set mines and stake, then start</div>}
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={live} onClick={function () { setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={live} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={live} onClick={function () { setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={live} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}</div>
          <div className="kbx-field">
            <label>Mines: {mines}</label>
            <div className="kbm-mines">{[1,3,5,10,15,24].map(function (m) { return <button key={m} className={mines === m ? "on" : ""} disabled={live} onClick={function () { au.click(); setMines(m); }}>{m}</button>; })}</div>
          </div>
          {!live
            ? <button className="kbx-play" disabled={!me} onClick={start}>START ROUND</button>
            : <button className="kbx-cashbtn" disabled={opened.length === 0} onClick={cash}>CASH OUT<b>{fmt(stake * mult)}</b><i>@ {mult.toFixed(2)}x</i></button>}
          <p className="kbx-note">Multiplier = C(25,k) / C(25-mines,k) x RTP. Fewer mines means smaller steps, more mines means steeper jumps and higher bust risk.</p>
        </aside>
      </div>
    </div>
  );
}
