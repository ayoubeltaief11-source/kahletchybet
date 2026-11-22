"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { sigOf, FRAME_NAME, FEATURE_NAME } from "@/lib/kb/sig";
import Sym from "./Sym";
import { useKbAudio } from "./audio";

interface Spin { grid: string[][]; hits: number[]; paid: number; mult: number; tx: string; ways: number; tier: number; }
export default function SlotsGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const sg = sigOf(g.id);
  const [stake, setStake] = useState(5);
  const [turbo, setTurbo] = useState(false);
  const [auto, setAuto] = useState(0);
  const [busy, setBusy] = useState(false);
  const [grid, setGrid] = useState<string[][]>([]);
  const [rows, setRows] = useState<number[]>([]);
  const [res, setRes] = useState<Spin | null>(null);
  const [pop, setPop] = useState(false);
  const [cascade, setCascade] = useState<number>(-1);
  const [trail, setTrail] = useState<number>(0);
  const [shake, setShake] = useState(false);
  const [err, setErr] = useState("");
  const [hist, setHist] = useState<{ m: number; id: string }[]>([]);
  const iv = useRef<number>(0);
  const autoRef = useRef<number>(0);
  const busyRef = useRef<boolean>(false);
  const cascadeMode = g.variant === "tumble5" || g.variant === "cluster6";

  const shape = useCallback(function (): number[] {
    if (g.variant === "mega5") return Array.from({ length: g.reels }, function () { return 2 + Math.floor(Math.random() * (g.rows - 1)); });
    return Array.from({ length: g.reels }, function () { return g.rows; });
  }, [g.reels, g.rows, g.variant]);
  const fill = useCallback(function (rp: number[]): string[][] {
    return rp.map(function (n) { return Array.from({ length: n }, function () { return g.syms[Math.floor(Math.random() * g.syms.length)]; }); });
  }, [g.syms]);
  useEffect(function () { const rp = shape(); setRows(rp); setGrid(fill(rp)); setRes(null); setTrail(0); }, [g.id, shape, fill]);
  useEffect(function () { return function () { if (iv.current) clearInterval(iv.current); autoRef.current = 0; }; }, []);

  const run = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    if (!isFinite(stake) || stake < 1) { setErr("Minimum stake is 1 TD"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    setErr(""); busyRef.current = true; setBusy(true); setRes(null); setPop(false); setCascade(-1); au.spin();
    let d: { ok: boolean; error?: string; grid: string[][]; rows: number[]; hits: number[]; paid: number; mult: number; tx: string; ways: number; tier: number };
    try {
      const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: g.id, mode: "spin", stake: stake }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); autoRef.current = 0; setAuto(0); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Spin rejected"); au.warn(); autoRef.current = 0; setAuto(0); return; }
    refresh();
    const frames = turbo ? 8 : 18;
    let f = 0;
    iv.current = window.setInterval(function () {
      f++; au.reel();
      setGrid(fill(d.rows));
      if (f >= frames) {
        clearInterval(iv.current); iv.current = 0;
        setRows(d.rows); setGrid(d.grid);
        const out: Spin = { grid: d.grid, hits: d.hits || [], paid: d.paid, mult: d.mult, tx: d.tx, ways: d.ways, tier: d.tier };
        setRes(out); busyRef.current = false; setBusy(false);
        setHist(function (h) { return [{ m: out.mult, id: out.tx }].concat(h).slice(0, 10); });
        if (out.paid > 0) {
          setPop(true);
          if (sg.feature === 2) setTrail(function (t) { return t + 1; });
          if (cascadeMode) {
            let c = 0;
            const casc = window.setInterval(function () {
              setCascade(c); au.reel(); c++;
              if (c >= d.grid.length) { clearInterval(casc); setCascade(-1); }
            }, 90);
          }
          if (out.mult >= 20) { au.big(); setShake(true); setTimeout(function () { setShake(false); }, 420); } else au.win();
          toast("WIN " + fmt(out.paid) + "  " + out.mult.toFixed(2) + "x  ID " + out.tx, "j");
          setTimeout(function () { setPop(false); }, 2400);
        } else { au.lose(); setTrail(0); }
        refresh();
        if (autoRef.current > 0) {
          autoRef.current -= 1; setAuto(autoRef.current);
          if (autoRef.current > 0) setTimeout(function () { void run(); }, turbo ? 340 : 900);
        }
      }
    }, turbo ? 52 : 84);
  }, [me, stake, g.id, turbo, sg.feature, cascadeMode, refresh, au, fill, toast]);

  const startAuto = useCallback(function (n: number) { if (busyRef.current) return; autoRef.current = n; setAuto(n); void run(); }, [run]);
  const stopAuto = useCallback(function () { autoRef.current = 0; setAuto(0); }, []);

  const label = g.variant === "mega5" ? "MEGAWAYS" : g.variant === "cluster6" ? "CLUSTER PAYS" : g.variant === "tumble5" ? "TUMBLE" : g.variant === "holdwin" ? "HOLD AND WIN" : g.variant === "jackpot5" ? "JACKPOT GRID" : "PAYLINES";
  const ways = g.variant === "mega5" ? rows.reduce(function (a, b) { return a * b; }, 1) : g.variant === "cluster6" ? 0 : g.reels === 3 ? 5 : 20;
  let off = 0;
  const idx: number[][] = grid.map(function (col) { const s = off; off += col.length; return col.map(function (_, i) { return s + i; }); });
  const wildCol = sg.feature === 1 && res && res.paid > 0 ? res.hits.length % Math.max(1, grid.length) : -1;

  return (
    <div className={"kbs f" + sg.frame + (pop ? " kb-flash" : "") + (shake ? " kb-shake" : "")} style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - {label} - {FRAME_NAME[sg.frame]} - {FEATURE_NAME[sg.feature]} - RTP {(rtp * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      {g.jp.length > 0 && g.jp[0] !== "" && (
        <div className="kbs-jp">
          {g.jp.map(function (j, i) {
            const parts = j.split(" ");
            return <div key={i} className={"kbs-jpc t" + i}><span>{parts[0]}</span><b>{parts.slice(1).join(" ")}</b></div>;
          })}
        </div>
      )}
      <div className="kbs-body">
        <div className="kbs-frame" style={{ background: "radial-gradient(110% 90% at 50% 0%," + g.sky[1] + "70, transparent 66%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          <div className="kbs-orn tl"/><div className="kbs-orn tr"/><div className="kbs-orn bl"/><div className="kbs-orn br"/>
          <div className="kbs-side"><span className="kbs-lines">{ways > 0 ? ways + " WAYS" : "CLUSTERS"}</span></div>
          {sg.feature === 2 && trail > 0 && <div className="kbs-trail">TRAIL x{trail + 1}</div>}
          <div className="kbs-grid" style={{ gridTemplateColumns: "repeat(" + (grid.length || g.reels) + ",1fr)" }}>
            {grid.map(function (col, c) {
              return (
                <div key={c} className={"kbs-col" + (cascade === c ? " casc" : "") + (wildCol === c ? " wild" : "")}>
                  {col.map(function (s, r) {
                    const hit = res ? res.hits.indexOf(idx[c][r]) >= 0 : false;
                    return <div key={r} className={"kbs-cell" + (hit ? " hit" : "") + (busy ? " roll" : "") + (g.variant === "holdwin" && hit ? " lock" : "")}><Sym k={s} size={54}/></div>;
                  })}
                </div>
              );
            })}
          </div>
          {res && res.paid > 0 && (
            <div className="kbs-pop">
              <b>{res.mult >= 20 ? "MEGA WIN" : res.mult >= 5 ? "BIG WIN" : "WIN"}</b>
              <strong>{fmt(res.paid)}</strong>
              <span>{res.mult.toFixed(2)}x</span>
              <em>ID {res.tx}</em>
            </div>
          )}
          {res && res.paid === 0 && <div className="kbs-miss">No win - ID {res.tx}</div>}
        </div>
        <aside className="kbx-panel">
          <div className="kbx-bal"><span>Balance</span><b>{fmt(me ? me.balance : 0)}</b></div>
          <div className="kbx-field">
            <label>Stake (TD)</label>
            <div className="kbx-step">
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Number(e.target.value) || 1); }}/>
              <button disabled={busy} onClick={function () { au.click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="kbx-chips">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { au.chip(); setStake(v); }}>{v}</button>; })}<button disabled={busy} onClick={function () { au.chip(); setStake(Math.max(1, Math.floor(me ? me.balance : 1))); }}>MAX</button></div>
          <div className="kbx-toggle"><label><input type="checkbox" checked={turbo} onChange={function (e) { setTurbo(e.target.checked); au.click(); }}/><span>Turbo spin</span></label></div>
          <button className="kbs-spin" disabled={busy || !me} onClick={function () { stopAuto(); void run(); }}>{busy ? "SPINNING" : "SPIN"}</button>
          <div className="kbs-auto">{auto > 0 ? <button className="kbs-stop" onClick={stopAuto}>STOP AUTO ({auto})</button> : [10,25,50].map(function (n) { return <button key={n} disabled={busy || !me} onClick={function () { startAuto(n); }}>AUTO {n}</button>; })}</div>
          {hist.length > 0 && <div className="kbs-log">{hist.slice(0,5).map(function (h, i) { return <div key={i} className={h.m > 0 ? "up" : "dn"}><span>{h.m > 0 ? h.m.toFixed(2) + "x" : "-"}</span><em>{h.id}</em></div>; })}</div>}
          {err && <div className="kbx-err">{err}</div>}
          <p className="kbx-note">{g.vol} volatility. House edge {((1 - rtp) * 100).toFixed(1)}% guarantees long-term loss.</p>
        </aside>
      </div>
    </div>
  );
}
