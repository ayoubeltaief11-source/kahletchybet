"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { COLS, ROWS, CELLS, JACKPOTS, holdBySlug } from "@/lib/kb2/holdMath";
import type { HoldResult, Coin } from "@/lib/kb2/holdMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function CoinArt({ value, jp, size = 62 }: { value: number; jp: number; size?: number }) {
  const j = jp >= 0 ? JACKPOTS[jp] : null;
  const hue = j ? j.hue : "#e8b33c";
  const uid = "cn" + Math.round(value * 100) + "j" + jp;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <radialGradient id={uid} cx="0.34" cy="0.28">
          <stop offset="0%" stopColor="#fffbe8"/><stop offset="46%" stopColor={hue}/><stop offset="100%" stopColor="#3a2705"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={"url(#" + uid + ")"} stroke="#2a1c04" strokeWidth="2.2"/>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#2a1c04" strokeWidth="1.3" opacity="0.55"/>
      <path d="M15 19a24 24 0 0 1 16-8" stroke="#fff" strokeWidth="3.6" opacity="0.6" fill="none" strokeLinecap="round"/>
      {j ? (
        <text x="32" y="37" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="Arial" fill="#2a1c04">{j.label}</text>
      ) : (
        <text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="900" fontFamily="Arial" fill="#2a1c04">{value.toFixed(1)}</text>
      )}
    </svg>
  );
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function HoldEngine({ slug }: { slug: string }) {
  const cfg = holdBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [board, setBoard] = useState<Coin[]>([]);
  const [fresh, setFresh] = useState<number[]>([]);
  const [respins, setRespins] = useState(3);
  const [running, setRunning] = useState(false);
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [pay, setPay] = useState(false);
  const [coinSum, setCoinSum] = useState(0);
  const [win, setWin] = useState<{ amt: number; mult: number; tx: string; tier: number; jp: number } | null>(null);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [err, setErr] = useState("");
  const [coins, setCoins] = useState<number[]>([]);
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const [lastJp, setLastJp] = useState(-1);
  const boardRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const stakeRef = useRef(stake);
  const startBal = useRef(0);
  autoRef.current = auto;
  stakeRef.current = stake;

  useEffect(function () {
    try { if (window.localStorage.getItem("k9_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const playResult = useCallback(async function (res: HoldResult, turbo: boolean) {
    setBoard([]); setFresh([]); setCoinSum(0); setRespins(3); setRunning(true);
    let acc = 0;
    for (const step of res.steps) {
      setBoard(step.board.slice());
      setRespins(step.respins);
      if (step.added.length > 0) {
        setFresh(step.added.map(function (a) { return a.cell; }));
        step.added.forEach(function (a) { acc += a.value; });
        setCoinSum(Math.round(acc * 100) / 100);
        if (step.added.some(function (a) { return a.jp >= 0; })) getAudio().scatter(); else getAudio().chip();
        const el = boardRef.current;
        if (el) {
          window.requestAnimationFrame(function () {
            const t = step.added.map(function (a) { return el.querySelector('[data-h="' + a.cell + '"]'); }).filter(Boolean);
            if (t.length > 0) gsap.fromTo(t, { scale: 0.3, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: 0, duration: turbo ? 0.24 : 0.46, stagger: 0.06, ease: "back.out(2)" });
          });
        }
        await new Promise(function (r) { window.setTimeout(r, turbo ? 300 : 620); });
        setFresh([]);
      } else {
        getAudio().reel();
        await new Promise(function (r) { window.setTimeout(r, turbo ? 200 : 420); });
      }
    }
    setRunning(false);
  }, []);
  const spin = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    const st = stakeRef.current;
    if (st < 1) { setErr("Minimum stake is 1 TD"); getAudio().warn(); return; }
    if (st > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); return; }
    setErr(""); setWin(null); setLastJp(-1);
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    let d: { ok: boolean; error?: string; result: HoldResult; paid: number; totalMult: number; tx: string };
    try {
      const r = await fetch("/api/kb2/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, stake: st }) });
      d = await r.json();
    } catch (e) { busyRef.current = false; setBusy(false); setErr("Network error - try again"); return; }
    if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Spin rejected"); getAudio().warn(); return; }
    refresh();
    setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + st, won: s.won + d.paid }; });
    await playResult(d.result, prefs.turbo);
    if (d.result.jackpot >= 0) {
      setLastJp(d.result.jackpot);
      getAudio().big();
      await new Promise(function (r) { window.setTimeout(r, 1100); });
    }
    if (d.paid > 0) {
      const tier = d.result.jackpot >= 2 ? 3 : d.result.jackpot >= 0 ? 2 : d.totalMult >= 8 ? 1 : 0;
      setWin({ amt: d.paid, mult: d.totalMult, tx: d.tx, tier: tier, jp: d.result.jackpot });
      if (tier >= 2) {
        getAudio().mega();
        setCoins(Array.from({ length: 36 }, function (_, i) { return i; }));
        window.setTimeout(function () { setCoins([]); }, 2700);
        const el = boardRef.current;
        if (el) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
      } else { getAudio().win(); }
      toast("HOLD WIN " + fmt(d.paid) + "  " + d.totalMult.toFixed(2) + "x  " + d.tx, "j");
      window.setTimeout(function () { setWin(null); }, tier >= 2 ? 3400 : 2000);
    } else { getAudio().lose(); }
    refresh();
    busyRef.current = false; setBusy(false);
    const a = autoRef.current;
    if (a.left > 0) {
      const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
      const stopLoss = a.stopLoss > 0 && (startBal.current - (me.balance - st + d.paid)) >= a.stopLoss;
      const next = a.left - 1;
      if (stopWin || stopLoss || next <= 0) {
        setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        if (stopWin) toast("Autoplay stopped: win limit reached", "g");
        if (stopLoss) toast("Autoplay stopped: loss limit reached", "g");
      } else {
        setAuto(function (o) { return Object.assign({}, o, { left: next }); });
        window.setTimeout(function () { void spin(); }, prefs.turbo ? 340 : 820);
      }
    }
  }, [me, cfg.slug, refresh, toast, playResult, prefs.turbo]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void spin();
  }, [me, spin]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("k9_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);

  const grid: (Coin | null)[] = Array.from({ length: CELLS }, function () { return null; });
  board.forEach(function (cc) { if (cc.cell >= 0 && cc.cell < CELLS) grid[cc.cell] = cc; });
  const filled = board.length;
  return (
    <div className="k9" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="k9-top">
        <Link href="/casino" className="k9-back">Lobby</Link>
        <span className="k9-demo">DEMO - no real money</span>
        <b className="k9-title">{cfg.name}</b>
        <div className="k9-sp"/>
        <div className="k9-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"k9-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
        <button className={"k9-ico" + (prefs.turbo ? " on" : "")} onClick={function () { update({ turbo: !prefs.turbo }); }}>TURBO</button>
        <button className="k9-ico" onClick={function () { setPay(true); }}>PAYS</button>
      </div>

      <div className="k9-jpbar">
        {JACKPOTS.slice().reverse().map(function (j) {
          const idx = JACKPOTS.indexOf(j);
          return (
            <div key={j.key} className={"k9-jp" + (lastJp === idx ? " hit" : "")} style={{ ["--jp" as string]: j.hue }}>
              <span>{j.label}</span>
              <b>{(j.value * stake).toLocaleString("en-US", { maximumFractionDigits: 0 })}</b>
              <em>{j.value}x</em>
            </div>
          );
        })}
      </div>

      <div className="k9-body">
        <div className="k9-stage" style={{ background: cfg.felt }}>
          <div className="k9-rays"/>
          <div className="k9-cracks"/>
          <div className="k9-frame" style={{ borderColor: cfg.frame }}>
            <span className="k9-cn tl"/><span className="k9-cn tr"/><span className="k9-cn bl"/><span className="k9-cn br"/>
            <div className="k9-banner">FILL ALL {CELLS} POSITIONS FOR THE GRAND</div>
            <div className="k9-meters">
              <div className={"k9-respins" + (running ? " live" : "")}>
                <span>RESPINS</span>
                <div>{[0,1,2].map(function (i) { return <i key={i} className={i < respins ? "on" : ""}/>; })}</div>
              </div>
              <div className="k9-collect"><span>COLLECTED</span><b>{coinSum.toFixed(2)}x</b></div>
              <div className="k9-fill"><span>FILLED</span><b>{filled}/{CELLS}</b></div>
            </div>
            <div className="k9-grid" ref={boardRef} style={{ gridTemplateColumns: "repeat(" + COLS + ",1fr)" }}>
              {grid.map(function (cc, i) {
                return (
                  <div key={i} data-h={i} className={"k9-cell" + (cc ? " held" : "") + (fresh.indexOf(i) >= 0 ? " fresh" : "") + (cc && cc.jp >= 0 ? " jackpot" : "")}>
                    {cc ? <CoinArt value={cc.value} jp={cc.jp}/> : <span className="k9-empty"/>}
                  </div>
                );
              })}
            </div>
            {coins.length > 0 && <div className="k9-coins">{coins.map(function (i) { return <i key={i} style={{ left: (i * 2.7 % 100) + "%", animationDelay: (i * 0.05) + "s" }}/>; })}</div>}
            {win && (
              <div className={"k9-big t" + win.tier}>
                <b>{win.jp >= 0 ? JACKPOTS[win.jp].label + " JACKPOT" : win.tier >= 1 ? "BIG HOLD" : "HOLD WIN"}</b>
                <strong>{fmt(win.amt)}</strong>
                <span>{win.mult.toFixed(2)}x - {filled} coins</span>
                <em>{win.tx}</em>
              </div>
            )}
          </div>
          <div className="k9-vol">
            <span>VOLATILITY</span>
            <div className="k9-vbar">{[0,1,2,3,4].map(function (i) { return <i key={i} className={i < (cfg.vol === "High" ? 5 : 3) ? "on" : ""}/>; })}</div>
            <em>{cfg.vol}</em>
          </div>
        </div>

        <aside className="k9-panel">
          <div className="k9-field">
            <label>BET (TD)</label>
            <div className="k9-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="k9-quick">{[1,5,10,25,50].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          <button className="k9-spin" disabled={busy || !me} onClick={function () { stopAuto(); void spin(); }}><span>{busy ? "..." : "SPIN"}</span></button>
          {auto.left > 0 ? <button className="k9-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="k9-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          <div className="k9-stats">
            <div><span>Spins</span><b>{session.spins}</b></div>
            <div><span>Staked</span><b>{fmt(session.bet)}</b></div>
            <div><span>Returned</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won)}</b></div>
            <div><span>Net</span><b className={session.won - session.bet >= 0 ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          {err && <div className="k9-err">{err}</div>}
          <p className="k9-note">Coins that land stay in place. You start with three respins and every new coin resets the counter to three. When the respins run out, every coin value is added together and paid. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="k9-modal">
          <div className="k9-intro" style={{ background: cfg.felt }}>
            <div className="k9-introjp">
              {JACKPOTS.slice().reverse().map(function (j) { return <div key={j.key} style={{ ["--jp" as string]: j.hue }}><span>{j.label}</span><b>{j.value}x</b></div>; })}
            </div>
            <h2>{cfg.name}</h2>
            <p className="k9-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="k9-ivol">{cfg.vol} VOLATILITY - HOLD AND WIN</span>
            <label className="k9-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="k9-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {pay && (
        <div className="k9-modal" onClick={function () { setPay(false); }}>
          <div className="k9-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>How it pays</h3>
            <div className="k9-paylist">
              {JACKPOTS.map(function (j) { return <div key={j.key}><span style={{ color: j.hue }}>{j.label}</span><b>{j.value}x your bet</b></div>; })}
              <div><span>Coin values</span><b>0.5x to 20x each</b></div>
              <div><span>Full screen</span><b>all {CELLS} positions held</b></div>
            </div>
            <p>Every coin that lands is held for the rest of the feature. Three respins are granted and reset to three whenever a new coin appears. The feature ends when no respins remain, then all held values and any jackpot are summed and paid once.</p>
            <button className="k9-close" onClick={function () { setPay(false); }}>CLOSE</button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="k9-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="k9-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="k9-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} SPINS</button>; })}</div>
            <label className="k9-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="k9-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="k9-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}