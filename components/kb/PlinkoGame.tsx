"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { useKbAudio } from "./audio";

const ROWS = 16;
interface Ball { id: number; x: number; y: number; }
export default function PlinkoGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const [stake, setStake] = useState(5);
  const [risk, setRisk] = useState("medium");
  const [table, setTable] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [ball, setBall] = useState<Ball | null>(null);
  const [land, setLand] = useState<number>(-1);
  const [res, setRes] = useState<{ paid: number; mult: number; tx: string } | null>(null);
  const [hist, setHist] = useState<{ m: number; id: string }[]>([]);
  const raf = useRef<number>(0);
  useEffect(function () { return function () { if (raf.current) cancelAnimationFrame(raf.current); }; }, []);
  useEffect(function () {
    let on = true;
    fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "plinko-table", risk: risk }) })
      .then(function (r) { return r.json(); }).then(function (d) { if (on && d.ok) setTable(d.table); }).catch(function () { });
    return function () { on = false; };
  }, [g.id, risk, rtp]);

  const drop = useCallback(async function () {
    if (busy) return;
    if (!me) { toast("Sign in to play", "e"); return; }
    if (stake < 1 || stake > me.balance) { toast("Check stake and TD balance", "e"); return; }
    setBusy(true); setRes(null); setLand(-1); au.spin();
    const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "plinko", stake: stake, risk: risk }) });
    const d = await r.json();
    if (!d.ok) { setBusy(false); toast(d.error || "Rejected", "e"); return; }
    refresh();
    const path: number[] = d.path;
    let step = 0, x = 50;
    const tick = function () {
      if (step >= ROWS) {
        setBall(null); setLand(d.bucket);
        setRes({ paid: d.paid, mult: d.mult, tx: d.tx });
        setHist(function (h) { return [{ m: d.mult, id: d.tx }].concat(h).slice(0, 10); });
        setBusy(false);
        if (d.paid > stake) { au.big(); toast("BUCKET " + d.mult.toFixed(2) + "x  +" + fmt(d.paid) + "  ID " + d.tx, "j"); }
        else if (d.paid > 0) { au.win(); toast(d.mult.toFixed(2) + "x  " + fmt(d.paid) + "  ID " + d.tx, "g"); }
        else { au.lose(); toast("No return  ID " + d.tx, "e"); }
        refresh(); return;
      }
      x += path[step] === 1 ? 2.6 : -2.6;
      step++;
      setBall({ id: step, x: x, y: 6 + (step / ROWS) * 74 });
      au.ball();
      raf.current = requestAnimationFrame(function () { setTimeout(tick, 62); });
    };
    setBall({ id: 0, x: 50, y: 4 });
    setTimeout(tick, 120);
  }, [busy, me, stake, risk, g.id, au, toast, refresh]);

  const cols = table.length || 17;
  return (
    <div className="kbp" style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - binomial 16 rows - RTP {(rtp * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbp-body">
        <div className="kbp-stage" style={{ background: "radial-gradient(90% 80% at 50% 0%," + g.sky[1] + "66, transparent 65%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbp-pegs">
            {Array.from({ length: ROWS }).map(function (_, r) {
              return (
                <div key={r} className="kbp-row" style={{ width: ((r + 3) / (ROWS + 3)) * 100 + "%" }}>
                  {Array.from({ length: r + 3 }).map(function (_, i) { return <i key={i}/>; })}
                </div>
              );
            })}
          </div>
          {ball && <div className="kbp-ball" style={{ left: ball.x + "%", top: ball.y + "%" }}/>}
          <div className="kbp-buckets" style={{ gridTemplateColumns: "repeat(" + cols + ",1fr)" }}>
            {(table.length ? table : Array.from({ length: 17 }).map(function () { return 0; })).map(function (m, i) {
              const hot = m >= 5, mid = m >= 1;
              return <div key={i} className={"kbp-b" + (hot ? " hot" : mid ? " mid" : " cold") + (land === i ? " land" : "")}>{m.toFixed(m >= 10 ? 0 : 1)}</div>;
            })}
          </div>
          {res && <div className={"kbp-tag " + (res.paid > stake ? "win" : res.paid > 0 ? "mid" : "lose")}>{res.mult.toFixed(2)}x - {res.paid > 0 ? "+" + fmt(res.paid) : "-" + fmt(stake)}<em>ID {res.tx}</em></div>}
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={busy} onClick={function () { setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={busy} onClick={function () { setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}</div>
          <div className="kbx-field">
            <label>Risk profile</label>
            <div className="kbp-risk">{["low","medium","high"].map(function (x) { return <button key={x} className={risk === x ? "on" : ""} disabled={busy} onClick={function () { au.click(); setRisk(x); }}>{x.toUpperCase()}</button>; })}</div>
          </div>
          <button className="kbx-play" disabled={busy || !me} onClick={drop}>{busy ? "DROPPING" : "DROP BALL"}</button>
          {hist.length > 0 && <div className="kbs-log">{hist.slice(0,6).map(function (h, i) { return <div key={i} className={h.m >= 1 ? "up" : "dn"}><span>{h.m.toFixed(2)}x</span><em>{h.id}</em></div>; })}</div>}
          <p className="kbx-note">Centre buckets are common and pay little. Edge buckets are rare and pay big. The whole table is scaled so the expected return equals the configured RTP.</p>
        </aside>
      </div>
    </div>
  );
}
