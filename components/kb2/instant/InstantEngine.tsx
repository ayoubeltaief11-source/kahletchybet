"use client";
import { GameCharacter } from "@/lib/kb2/imageLoader";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { instantBySlug, hiloMultiplier, CARD_NAMES, WHEEL_SEGMENTS } from "@/lib/kb2/instantMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function InstantEngine({ slug }: { slug: string }) {
  const cfg = instantBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [stake, setStake] = useState(10);
  const [busy, setBusy] = useState(false);
  const [currentCard, setCurrentCard] = useState(8);
  const [nextCard, setNextCard] = useState<number | null>(null);
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<{ win: boolean; mult: number }[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const displayRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("ki_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const higherMult = hiloMultiplier(currentCard, true, 0.97);
  const lowerMult = hiloMultiplier(currentCard, false, 0.97);

  const play = useCallback(async function (action?: string) {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setResult(null); setLastPaid(0); setLastTx("");
    busyRef.current = true; setBusy(true);
    getAudio().spin();
    if (startBal.current === 0) startBal.current = me.balance;
    
    const body: Record<string, unknown> = { slug: cfg.slug, stake: stake };
    if (cfg.type === "hilo") body.higher = action === "higher";
    if (cfg.type === "coin") body.bet = action || "heads";
    
    try {
      const r = await fetch("/api/kb2/instant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Play rejected"); getAudio().warn(); return; }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won + d.paid }; });
      
      if (displayRef.current) {
        gsap.fromTo(displayRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
      }
      
      setResult(d.result);
      setLastPaid(d.paid);
      setLastTx(d.tx);
      setHistory(function (h) { return [{ win: d.result.win, mult: d.result.mult }].concat(h).slice(0, 20); });
      
      if (cfg.type === "hilo") {
        setCurrentCard(d.result.next);
        setNextCard(d.result.next);
      } else if (cfg.type === "coin") {
        setCoinResult(d.result.flip);
      } else {
        const segAngle = 360 / 54;
        const targetAngle = d.result.segment * segAngle;
        setWheelRotation(function (prev) { return prev + 1440 + (360 - targetAngle); });
      }
      
      if (d.result.win) {
        if (d.result.mult >= 10) { getAudio().mega(); toast("MEGA WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
        else if (d.result.mult >= 3) { getAudio().big(); toast("BIG WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
        else { getAudio().win(); toast("WIN " + fmt(d.paid) + " at " + d.result.mult.toFixed(2) + "x", "j"); }
      } else {
        getAudio().lose();
        toast("No win", "e");
      }
      
      refresh();
      busyRef.current = false; setBusy(false);
      
      const a = autoRef.current;
      if (a.left > 0) {
        const stopWin = a.stopWin > 0 && d.paid >= a.stopWin;
        const stopLoss = a.stopLoss > 0 && (startBal.current - ((me ? me.balance : 0) - stake + d.paid)) >= a.stopLoss;
        const next = a.left - 1;
        if (stopWin || stopLoss || next <= 0) {
          setAuto(function (o) { return Object.assign({}, o, { left: 0 }); });
        } else {
          setAuto(function (o) { return Object.assign({}, o, { left: next }); });
          window.setTimeout(function () { void play(action); }, 1200);
        }
      }
    } catch (e) {
      busyRef.current = false; setBusy(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, cfg.type, stake, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void play(cfg.type === "coin" ? "heads" : "higher");
  }, [me, cfg.type, play]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("ki_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  return (
    <div className="ki" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="ki-top">
        <Link href="/casino" className="ki-back">Lobby</Link>
        <span className="ki-demo">DEMO - no real money</span>
        <img src={"/assets/" + slug + "/logo.png"} alt="" className="ki-logo" onError={function (e) { e.currentTarget.style.display = "none"; }}/>
        <b className="ki-title">{cfg.name}</b>
        <div className="ki-sp"/>
        <div className="ki-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"ki-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="ki-body">
        <div className="ki-stage" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="ki-rays"/>
          <div className="ki-mascot"><GameCharacter slug={slug} hue={cfg.accent} size={190} mood="idle"/></div>
          
          <div className="ki-display" ref={displayRef}>
            {cfg.type === "hilo" && (
              <div className="ki-card">
                <div className="ki-card-value">{CARD_NAMES[currentCard - 2]}</div>
                <div className="ki-card-suit">♠</div>
              </div>
            )}
            {cfg.type === "coin" && (
              <div className={"ki-coin " + (coinResult || "")}>
                <div className="ki-coin-face">{coinResult === "heads" ? "H" : "T"}</div>
              </div>
            )}
            {cfg.type === "wheel" && (
              <div className="ki-wheel" style={{ transform: "rotate(" + wheelRotation + "deg)" }}>
                {WHEEL_SEGMENTS.map(function (seg, i) {
                  const angle = (360 / WHEEL_SEGMENTS.length) * i;
                  return <div key={i} className="ki-wheel-seg" style={{ background: seg.color, transform: "rotate(" + angle + "deg)" }}><span>{seg.mult}x</span></div>;
                })}
              </div>
            )}
          </div>

          {result && (
            <div className={"ki-result " + (result.win ? "win" : "lose")}>
              <b>{result.win ? "WIN" : "LOSE"}</b>
              {result.mult > 0 && <span>{result.mult.toFixed(2)}x</span>}
            </div>
          )}

          {cfg.type === "hilo" && !result && (
            <div className="ki-odds">
              <div><span>HIGHER</span><b>{higherMult.toFixed(2)}x</b></div>
              <div><span>LOWER</span><b>{lowerMult.toFixed(2)}x</b></div>
            </div>
          )}

          {lastPaid > 0 && <div className="ki-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
        </div>

        <aside className="ki-panel">
          <div className="ki-field">
            <label>BET (TD)</label>
            <div className="ki-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>

          <div className="ki-quick">{[5, 10, 25, 50, 100].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>

          {cfg.type === "hilo" && (
            <div className="ki-actions">
              <button className="ki-btn higher" disabled={busy || !me} onClick={function () { void play("higher"); }}>HIGHER</button>
              <button className="ki-btn lower" disabled={busy || !me} onClick={function () { void play("lower"); }}>LOWER</button>
            </div>
          )}
          {cfg.type === "coin" && (
            <div className="ki-actions">
              <button className="ki-btn heads" disabled={busy || !me} onClick={function () { void play("heads"); }}>HEADS</button>
              <button className="ki-btn tails" disabled={busy || !me} onClick={function () { void play("tails"); }}>TAILS</button>
            </div>
          )}
          {cfg.type === "wheel" && (
            <button className="ki-spin" disabled={busy || !me} onClick={function () { void play(); }}>SPIN WHEEL</button>
          )}

          {auto.left > 0 ? <button className="ki-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="ki-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}

          <div className="ki-stats">
            <div><span>Plays</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>

          {err && <div className="ki-err">{err}</div>}
          <p className="ki-note">{cfg.type === "hilo" ? "Each correct guess multiplies your stake. Cash out anytime to lock profit." : cfg.type === "coin" ? "50/50 chance pays 1.94x instead of 2x. The 0.06x difference is the house edge." : "54 segments with different multipliers. Higher multipliers are rarer."} TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="ki-modal">
          <div className="ki-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="ki-introdisplay">
              {cfg.type === "hilo" && <div className="ki-introcard">A♠</div>}
              {cfg.type === "coin" && <div className="ki-introcoin">H</div>}
              {cfg.type === "wheel" && <div className="ki-introwheel">🎡</div>}
            </div>
            <h2>{cfg.name}</h2>
            <p className="ki-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="ki-ivol">{cfg.type === "hilo" ? "CARD LADDER" : cfg.type === "coin" ? "50/50 FLIP" : "54 SEGMENTS"} - RTP 97%</span>
            <label className="ki-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="ki-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="ki-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="ki-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="ki-autorow">{[10, 25, 50, 100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} PLAYS</button>; })}</div>
            <label className="ki-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="ki-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="ki-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}