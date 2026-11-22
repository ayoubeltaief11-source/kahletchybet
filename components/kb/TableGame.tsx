"use client";
import { useCallback, useState } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { useKbAudio } from "./audio";

interface Card { r: string; s: string; }
interface BJ { p: Card[]; d: Card[]; done: boolean; msg: string; paid: number; tx: string; }
const SU = ["S", "H", "D", "C"];
const RK = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
function draw(): Card { return { r: RK[Math.floor(Math.random() * 13)], s: SU[Math.floor(Math.random() * 4)] }; }
function val(cs: Card[]): number {
  let t = 0, a = 0;
  cs.forEach(function (c) { if (c.r === "A") { a++; t += 11; } else if (c.r === "J" || c.r === "Q" || c.r === "K" || c.r === "10") t += 10; else t += Number(c.r); });
  while (t > 21 && a > 0) { t -= 10; a--; }
  return t;
}
function Face({ c, hidden }: { c: Card; hidden?: boolean }) {
  if (hidden) return <div className="kbt-card back"><span/></div>;
  const red = c.s === "H" || c.s === "D";
  const glyph = c.s === "S" ? "\u2660" : c.s === "H" ? "\u2665" : c.s === "D" ? "\u2666" : "\u2663";
  return <div className={"kbt-card" + (red ? " red" : "")}><b>{c.r}</b><i>{glyph}</i></div>;
}

export default function TableGame({ g, rtp }: { g: KBGame; rtp: number }) {
  const { me, refresh, toast } = useApp();
  const au = useKbAudio();
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [bj, setBj] = useState<BJ | null>(null);
  const [side, setSide] = useState("player");
  const [res, setRes] = useState<{ msg: string; paid: number; tx: string; a: number; b: number; dice: number[] } | null>(null);

  const post = useCallback(async function (mode: string, extra: Record<string, unknown>) {
    const body: Record<string, unknown> = { gameId: g.id, mode: mode, stake: stake };
    Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
    const r = await fetch("/api/kb/round", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return r.json();
  }, [g.id, stake]);

  const deal = useCallback(async function () {
    if (!me) { toast("Sign in to play", "e"); return; }
    if (stake < 1 || stake > me.balance) { toast("Check stake and balance", "e"); return; }
    setBusy(true); setRes(null); setBj(null); au.spin();
    const d = await post("table-deal", { side: side });
    if (!d.ok) { setBusy(false); toast(d.error || "Rejected", "e"); return; }
    refresh();
    if (g.variant === "blackjack") {
      const p = [draw(), draw()], dl = [draw(), draw()];
      const nat = val(p) === 21;
      if (nat || d.forceDone) {
        let dd = dl.slice();
        while (val(dd) < 17) dd.push(draw());
        const pv = val(p), dv = val(dd);
        let paid = 0, msg = "Dealer wins";
        if (pv > 21) { paid = 0; msg = "Bust"; }
        else if (nat && dv !== 21) { paid = Math.round(stake * 2.5 * 100) / 100; msg = "BLACKJACK 3:2"; }
        else if (dv > 21 || pv > dv) { paid = stake * 2; msg = "You win"; }
        else if (pv === dv) { paid = stake; msg = "Push"; }
        const s = await post("table-settle", { roundId: d.roundId, paid: paid });
        setBj({ p: p, d: dd, done: true, msg: msg, paid: s.paid || 0, tx: s.tx || d.roundId });
        if (paid > stake) au.win(); else if (paid === stake) au.click(); else au.lose();
        toast(msg + "  ID " + (s.tx || d.roundId), paid > stake ? "j" : paid === stake ? "g" : "e");
        refresh(); setBusy(false);
      } else {
        setBj({ p: p, d: dl, done: false, msg: "Hit or stand", paid: 0, tx: d.roundId });
        setBusy(false);
      }
    } else {
      const dd = d;
      setRes({ msg: dd.msg, paid: dd.paid, tx: dd.tx, a: dd.a, b: dd.b, dice: dd.dice || [] });
      if (dd.paid > 0) au.win(); else au.lose();
      toast(dd.msg + "  ID " + dd.tx, dd.paid > 0 ? "j" : "e");
      refresh(); setBusy(false);
    }
  }, [me, stake, side, g.variant, post, refresh, toast, au]);

  const hit = useCallback(async function () {
    if (!bj || bj.done) return;
    const p = bj.p.concat([draw()]);
    if (val(p) > 21) {
      const s = await post("table-settle", { roundId: bj.tx, paid: 0 });
      setBj({ p: p, d: bj.d, done: true, msg: "Bust", paid: 0, tx: s.tx || bj.tx });
      au.lose(); toast("Bust  ID " + (s.tx || bj.tx), "e"); refresh(); return;
    }
    au.click(); setBj({ p: p, d: bj.d, done: false, msg: "Hit or stand", paid: 0, tx: bj.tx });
  }, [bj, post, au, toast, refresh]);

  const stand = useCallback(async function () {
    if (!bj || bj.done) return;
    setBusy(true);
    let dd = bj.d.slice();
    while (val(dd) < 17) dd.push(draw());
    const pv = val(bj.p), dv = val(dd);
    let paid = 0, msg = "Dealer wins";
    if (dv > 21 || pv > dv) { paid = stake * 2; msg = "You win"; }
    else if (pv === dv) { paid = stake; msg = "Push"; }
    const s = await post("table-settle", { roundId: bj.tx, paid: paid });
    setBj({ p: bj.p, d: dd, done: true, msg: msg, paid: s.paid || 0, tx: s.tx || bj.tx });
    if (paid > stake) au.win(); else if (paid === stake) au.click(); else au.lose();
    toast(msg + "  ID " + (s.tx || bj.tx), paid > stake ? "j" : paid === stake ? "g" : "e");
    refresh(); setBusy(false);
  }, [bj, stake, post, au, toast, refresh]);

  return (
    <div className="kbt" style={{ ["--acc" as string]: g.hue }}>
      <div className="kbx-top">
        <span className="kb-demo">Demo</span>
        <span className="kbx-meta">{g.name} - RTP {(rtp * 100).toFixed(1)}% - Edge {((1 - rtp) * 100).toFixed(1)}%</span>
        <button className="kbx-snd" onClick={au.toggle}>{au.muted ? "SOUND OFF" : "SOUND ON"}</button>
      </div>
      <div className="kbt-body">
        <div className="kbt-felt" style={{ background: "radial-gradient(90% 80% at 50% 0%," + g.sky[1] + "77, transparent 65%), linear-gradient(170deg," + g.sky[0] + "," + g.sky[1] + ")" }}>
          {g.variant === "blackjack" && (
            <div className="kbt-bj">
              <div className="kbt-hand"><label>DEALER {bj ? val(bj.done ? bj.d : [bj.d[0]]) : ""}</label><div className="kbt-cards">{bj ? bj.d.map(function (c, i) { return <Face key={i} c={c} hidden={!bj.done && i === 1}/>; }) : <><Face c={{r:"A",s:"S"}} hidden/><Face c={{r:"K",s:"H"}} hidden/></>}</div></div>
              <div className="kbt-msg">{bj ? bj.msg : "Place a stake and deal"}</div>
              <div className="kbt-hand"><label>YOU {bj ? val(bj.p) : ""}</label><div className="kbt-cards">{bj ? bj.p.map(function (c, i) { return <Face key={i} c={c}/>; }) : <><Face c={{r:"A",s:"D"}} hidden/><Face c={{r:"Q",s:"C"}} hidden/></>}</div></div>
              {bj && bj.done && <div className={"kbt-res " + (bj.paid > stake ? "win" : bj.paid === stake ? "push" : "lose")}>{bj.paid > 0 ? "+" + fmt(bj.paid) : "-" + fmt(stake)}<em>ID {bj.tx}</em></div>}
            </div>
          )}
          {g.variant === "baccarat" && (
            <div className="kbt-bac">
              <div className="kbt-two">
                <div><label>PLAYER</label><b>{res ? res.a : "-"}</b></div>
                <div><label>BANKER</label><b>{res ? res.b : "-"}</b></div>
              </div>
              <div className="kbt-msg">{res ? res.msg : "Bet Player, Banker or Tie"}</div>
              {res && <div className={"kbt-res " + (res.paid > 0 ? "win" : "lose")}>{res.paid > 0 ? "+" + fmt(res.paid) : "-" + fmt(stake)}<em>ID {res.tx}</em></div>}
            </div>
          )}
          {g.variant === "sicbo" && (
            <div className="kbt-dice">
              <div className="kbt-cubes">{(res && res.dice.length ? res.dice : [1,1,1]).map(function (v, i) { return <div key={i} className="kbt-die">{v}</div>; })}</div>
              <div className="kbt-msg">{res ? res.msg + " - total " + (res.a) : "Bet Small (4-10) or Big (11-17)"}</div>
              {res && <div className={"kbt-res " + (res.paid > 0 ? "win" : "lose")}>{res.paid > 0 ? "+" + fmt(res.paid) : "-" + fmt(stake)}<em>ID {res.tx}</em></div>}
            </div>
          )}
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
          {g.variant === "baccarat" && (
            <div className="kbt-sides">{[["player","PLAYER 2x"],["banker","BANKER 1.95x"],["tie","TIE 9x"]].map(function (o) { return <button key={o[0]} className={side === o[0] ? "on" : ""} disabled={busy} onClick={function () { setSide(o[0]); }}>{o[1]}</button>; })}</div>
          )}
          {g.variant === "sicbo" && (
            <div className="kbt-sides">{[["small","SMALL 4-10"],["big","BIG 11-17"]].map(function (o) { return <button key={o[0]} className={side === o[0] ? "on" : ""} disabled={busy} onClick={function () { setSide(o[0]); }}>{o[1]}</button>; })}</div>
          )}
          {g.variant === "blackjack" && bj && !bj.done
            ? <div className="kbt-hs"><button onClick={hit} disabled={busy}>HIT</button><button onClick={stand} disabled={busy}>STAND</button></div>
            : <button className="kbx-play" disabled={busy || !me} onClick={deal}>{busy ? "DEALING" : g.variant === "blackjack" ? "DEAL" : "PLAY ROUND"}</button>}
          <p className="kbx-note">Dealer stands on 17. Blackjack pays 3:2. Educational simulation - TD has no monetary value.</p>
        </aside>
      </div>
    </div>
  );
}
