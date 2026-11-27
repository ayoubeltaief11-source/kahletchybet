"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import type { KBGame } from "@/lib/kb/catalog";
import { usePrefs } from "@/lib/kb/prefs";

export default function GameShell({ g, rtp, children }: { g: KBGame; rtp: number; children: ReactNode }) {
  const { me } = useApp();
  const { p, update } = usePrefs();
  const [help, setHelp] = useState(false);
  const [hist, setHist] = useState(false);
  const [full, setFull] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const toggleFull = useCallback(function () {
    const el = box.current;
    if (!el) return;
    if (!document.fullscreenElement) { void el.requestFullscreen?.(); setFull(true); }
    else { void document.exitFullscreen?.(); setFull(false); }
  }, []);
  useEffect(function () {
    const on = function () { setFull(Boolean(document.fullscreenElement)); };
    document.addEventListener("fullscreenchange", on);
    return function () { document.removeEventListener("fullscreenchange", on); };
  }, []);

  return (
    <div className="k2-shell" ref={box}>
      <div className="k2-shell-bar">
        <span className="k2-demo">Demo - no real money</span>
        <span className="k2-shell-title">{g.name}</span>
        <div className="k2-shell-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)}</b></div>
        <div className="k2-shell-bal"><span>RTP</span><b>{(rtp * 100).toFixed(1)}%</b></div>
        <div className="k2-shell-sp"/>
        <button className={"k2-icon" + (p.sound ? " on" : "")} onClick={function () { update({ sound: !p.sound }); }} title="Sound">{p.sound ? "SND" : "MUTE"}</button>
        <button className={"k2-icon" + (p.turbo ? " on" : "")} onClick={function () { update({ turbo: !p.turbo }); }} title="Turbo">TRB</button>
        <button className="k2-icon" onClick={function () { setHist(true); }} title="History">HST</button>
        <button className="k2-icon" onClick={function () { setHelp(true); }} title="Paytable and rules">?</button>
        <button className={"k2-icon" + (full ? " on" : "")} onClick={toggleFull} title="Fullscreen">FS</button>
      </div>
      {children}
      {help && (
        <div className="k2-modal" onClick={function () { setHelp(false); }}>
          <div className="k2-modal-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>{g.name}</h3>
            <dl>
              <dt>Engine</dt><dd>{g.variant}</dd>
              <dt>Family</dt><dd>{g.family}</dd>
              <dt>RTP</dt><dd>{(rtp * 100).toFixed(1)}% - configured by the administrator and read by the server on every round</dd>
              <dt>House edge</dt><dd>{((1 - rtp) * 100).toFixed(1)}% - the mathematical reason long sessions lose</dd>
              <dt>Volatility</dt><dd>{g.vol} - high means rare large hits, low means frequent small ones</dd>
              <dt>Currency</dt><dd>TD is a virtual educational point. It cannot be bought, sold, رصيدed or سحبn.</dd>
            </dl>
            <p>Every stake is debited once when the round opens. A payout is credited only on a win or a cashout. Rounds are locked after settlement so nothing can be paid twice.</p>
            <button className="k2-btn k2-btn-gold" onClick={function () { setHelp(false); }}>CLOSE</button>
          </div>
        </div>
      )}
      {hist && (
        <div className="k2-modal" onClick={function () { setHist(false); }}>
          <div className="k2-modal-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Round history</h3>
            <p>Round and cashout identifiers appear on the game stage at the moment of settlement, and are written to the server ledger with the RTP that was active for that round.</p>
            <button className="k2-btn k2-btn-gold" onClick={function () { setHist(false); }}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

