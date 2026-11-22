"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./Shell";
import type { CasinoTitle } from "@/lib/casino-catalog";
import { fmt } from "@/lib/catalog";

export default function CasinoStage({ title }: { title: CasinoTitle }) {
  const { me, refresh, toast } = useApp();
  const [stake, setStake] = useState("5");
  const [choice, setChoice] = useState("red");
  const [target, setTarget] = useState("2.00");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [hist, setHist] = useState<{ m: number; w: boolean }[]>([]);
  const timer = useRef<any>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const play = async () => {
    if (!me) return toast("Sign in to play", "e");
    const s = Number(stake);
    if (!isFinite(s) || s < 1) return toast("Minimum stake is 1 TD", "e");
    if (s > me.balance) return toast("Insufficient TD balance", "e");
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/casino/play", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: title.slug, stake: s, choice, target: Number(target) || 2 }),
      });
      const d = await r.json();
      if (!d.ok) { setBusy(false); return toast(d.error ?? "Round failed", "e"); }
      animate(d);
    } catch { setBusy(false); toast("Network error", "e"); }
  };

  const animate = (d: any) => {
    if (title.engine === "slots") {
      let n = 0;
      timer.current = setInterval(() => {
        n++;
        setView({ reels: [randSym(), randSym(), randSym()], line: false });
        if (n > 14) { clearInterval(timer.current); finish(d); }
      }, 70);
    } else if (title.engine === "roulette") {
      let n = 0;
      timer.current = setInterval(() => {
        n++;
        setView({ pocket: String(Math.floor(Math.random() * 37)), color: "black", spin: true });
        if (n > 22) { clearInterval(timer.current); finish(d); }
      }, 80);
    } else {
      const curve: number[] = d.view.curve ?? [1];
      let i = 0;
      timer.current = setInterval(() => {
        i++;
        setView({ live: curve[Math.min(i, curve.length - 1)], crashed: false });
        if (i >= curve.length - 1) { clearInterval(timer.current); finish(d); }
      }, 90);
    }
  };

  const randSym = () => title.symbols[Math.floor(Math.random() * title.symbols.length)] ?? "*";

  const finish = (d: any) => {
    setView(d.view);
    setBusy(false);
    setHist(h => [{ m: d.mult, w: d.win }, ...h].slice(0, 14));
    setMsg(d.win ? "WIN " + fmt(d.payout) + "  (" + d.mult.toFixed(2) + "x)" : "No win this round");
    refresh();
  };

  const stakeBox = (
    <>
      <label className="f"><span>Stake (TD)</span>
        <input className="in mono" type="number" min={1} step={1} value={stake} disabled={busy} onChange={e => setStake(e.target.value)} />
      </label>
      <div className="chipline mb">
        {[1, 5, 10, 20].map(v => <button key={v} className="btn o s" disabled={busy} onClick={() => setStake(String(v))}>{v}</button>)}
        {me && <button className="btn o s" disabled={busy} onClick={() => setStake(String(Math.floor(me.balance)))}>MAX</button>}
      </div>
    </>
  );

  return (
    <div className="kb-split2">
      <div className="kb-stage2" style={{ background: `radial-gradient(75% 95% at 50% 0%, ${title.hue}22, #06080B 70%)` }}>
        <div className="kb-stagehead">
          <span className="kb-demobadge">Demo</span>
          <span className="tag n">{title.engine.toUpperCase()}</span>
          <span className="tag g">RTP {title.rtp}%</span>
        </div>

        {title.engine === "slots" && (
          <div className="kb-reels">
            {[0, 1, 2].map(i => (
              <div key={i} className={"kb-reel2" + (busy ? " spinning" : "")} style={{ borderColor: title.hue }}>
                {view?.reels?.[i] ?? title.symbols[i]}
              </div>
            ))}
          </div>
        )}

        {title.engine === "roulette" && (
          <div className="kb-wheel2">
            <div className={"kb-pocket" + (view?.spin ? " spinning" : "")}
              style={{ background: view?.color === "red" ? "#C42B3C" : view?.color === "green" ? "#0C7A4E" : "#141C2C", borderColor: title.hue }}>
              {view?.pocket ?? "0"}
            </div>
          </div>
        )}

        {title.engine === "crash" && (
          <div className="kb-crash2">
            <div className="kb-crashnum" style={{ color: view && !busy ? (msg.startsWith("WIN") ? title.hue : "#FF4757") : "#12D18E" }}>
              {(view?.live ?? view?.crash ?? 1).toFixed(2)}x
            </div>
            <div className="xxs faint">Target {Number(target).toFixed(2)}x</div>
          </div>
        )}

        <div className="kb-result" style={{ color: msg.startsWith("WIN") ? "var(--gold-hi)" : "var(--dim)" }}>{msg || "Place your demo stake to begin"}</div>

        <div className="kb-hist2">
          {hist.map((h, i) => <span key={i} className={"kb-hpill " + (h.w ? "up" : "down")}>{h.w ? h.m.toFixed(2) + "x" : "-"}</span>)}
        </div>
      </div>

      <div className="kb-panel2">
        <div className="bt mb"><h3 className="h3" style={{ margin: 0 }}>Round controls</h3><span className="kb-demobadge">Demo</span></div>
        {stakeBox}

        {title.engine === "roulette" && (
          <div className="kb-choices">
            {[["red","Red 2x"],["black","Black 2x"],["odd","Odd 2x"],["even","Even 2x"],["low","1-18 2x"],["high","19-36 2x"],["d1","1st 12 3x"],["d2","2nd 12 3x"],["d3","3rd 12 3x"],["zero","0 / 00 18x"]].map(([k, l]) => (
              <button key={k} className={"kb-choice" + (choice === k ? " on" : "")} disabled={busy} onClick={() => setChoice(k)}>{l}</button>
            ))}
          </div>
        )}

        {title.engine === "crash" && (
          <label className="f"><span>Auto cash-out target (x)</span>
            <input className="in mono" type="number" step="0.1" min="1.1" max="20" value={target} disabled={busy} onChange={e => setTarget(e.target.value)} />
          </label>
        )}

        {title.engine === "slots" && (
          <div className="kb-paytable">
            <div className="xxs faint mb">Three of a kind pays</div>
            <div className="kb-paygrid">
              {title.symbols.map((s, i) => <div key={i} className="kb-paycell"><span>{s}</span><b>{[40,18,10,6,4,3][i] ?? 3}x</b></div>)}
            </div>
          </div>
        )}

        <button className="btn g w kb-playbtn" disabled={busy} onClick={play}>{busy ? "Playing..." : "PLAY"}</button>
        <div className="bt xs mt"><span className="dim">Balance</span><b className="mono" style={{ color: "var(--gold-hi)" }}>{fmt(me?.balance ?? 0)}</b></div>
        <div className="note g mt">Demo simulation. TD has no monetary value. Outcomes are generated server-side for this educational environment.</div>
      </div>
    </div>
  );
}