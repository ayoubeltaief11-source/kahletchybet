"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { baccaratBySlug } from "@/lib/kb2/baccaratMath";
import type { Card, BaccaratResult } from "@/lib/kb2/baccaratMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function CardView({ card, faceDown, size = 72 }: { card: Card; faceDown?: boolean; size?: number }) {
  const suitColor = card.suit === "H" || card.suit === "D" ? "#c4202f" : "#1a1a1a";
  const suitIcon = card.suit === "H" ? "♥" : card.suit === "D" ? "♦" : card.suit === "S" ? "♠" : "♣";
  
  if (faceDown) {
    return (
      <div className="ba-card ba-card-back" style={{ width: size, height: size * 1.4 }}>
        <div className="ba-card-pattern"/>
      </div>
    );
  }
  
  return (
    <div className="ba-card" style={{ width: size, height: size * 1.4, color: suitColor }}>
      <div className="ba-card-tl"><span>{card.rank === "10" ? "10" : card.rank}</span><span>{suitIcon}</span></div>
      <div className="ba-card-center">{suitIcon}</div>
      <div className="ba-card-br"><span>{suitIcon}</span><span>{card.rank === "10" ? "10" : card.rank}</span></div>
    </div>
  );
}

interface Auto { left: number; stopWin: number; stopLoss: number; }

export default function BaccaratEngine({ slug }: { slug: string }) {
  const cfg = baccaratBySlug(slug);
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [selectedBet, setSelectedBet] = useState<"player" | "banker" | "tie">("player");
  const [stake, setStake] = useState(10);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BaccaratResult | null>(null);
  const [lastPaid, setLastPaid] = useState(0);
  const [lastTx, setLastTx] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [auto, setAuto] = useState<Auto>({ left: 0, stopWin: 0, stopLoss: 0 });
  const [autoPanel, setAutoPanel] = useState(false);
  const [intro, setIntro] = useState(true);
  const [hideIntro, setHideIntro] = useState(false);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const tableRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const autoRef = useRef(auto);
  const startBal = useRef(0);
  autoRef.current = auto;

  useEffect(function () {
    try { if (window.localStorage.getItem("kb_intro_" + slug) === "1") setIntro(false); } catch (e) { /* ignore */ }
  }, [slug]);

  const play = useCallback(async function () {
    if (busyRef.current) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setResult(null); setLastPaid(0); setLastTx("");
    busyRef.current = true; setBusy(true);
    getAudio().card();
    if (startBal.current === 0) startBal.current = me.balance;
    
    try {
      const r = await fetch("/api/kb2/baccarat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: cfg.slug, betType: selectedBet, stake: stake }) });
      const d = await r.json();
      if (!d.ok) { busyRef.current = false; setBusy(false); setErr(d.error || "Bet rejected"); getAudio().warn(); return; }
      
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + stake, won: s.won + d.paid }; });
      
      const pCards = d.result.playerCards;
      const bCards = d.result.bankerCards;
      
      if (tableRef.current) {
        const cards = tableRef.current.querySelectorAll(".ba-card");
        gsap.fromTo(cards, { y: -100, opacity: 0, rotation: -15 }, { y: 0, opacity: 1, rotation: 0, duration: 0.4, stagger: 0.12, ease: "back.out(1.5)" });
      }
      
      await new Promise(function (res) { window.setTimeout(res, 1800); });
      
      setResult(d.result);
      setLastPaid(d.paid);
      setLastTx(d.tx);
      setHistory(function (h) { return [d.result.winner].concat(h).slice(0, 20); });
      
      if (d.result.winner === selectedBet) {
        if (d.result.winner === "tie") { getAudio().big(); toast("TIE! +" + fmt(d.paid), "j"); }
        else { getAudio().win(); toast(selectedBet.toUpperCase() + " WINS +" + fmt(d.paid), "j"); }
      } else {
        getAudio().lose();
        toast(d.result.winner.toUpperCase() + " WINS", "e");
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
          window.setTimeout(function () { void play(); }, 1200);
        }
      }
    } catch (e) {
      busyRef.current = false; setBusy(false); setErr("Network error - try again");
    }
  }, [me, cfg.slug, selectedBet, stake, refresh, toast]);

  const startAuto = useCallback(function (n: number) {
    setAuto(function (a) { return Object.assign({}, a, { left: n }); });
    setAutoPanel(false);
    startBal.current = me ? me.balance : 0;
    void play();
  }, [me, play]);
  const stopAuto = useCallback(function () { setAuto(function (a) { return Object.assign({}, a, { left: 0 }); }); }, []);
  const closeIntro = useCallback(function () {
    if (hideIntro) { try { window.localStorage.setItem("kb_intro_" + slug, "1"); } catch (e) { /* ignore */ } }
    setIntro(false); getAudio().click();
  }, [hideIntro, slug]);
  return (
    <div className="ba" style={{ ["--acc" as string]: cfg.accent, ["--acc2" as string]: cfg.accent2 }}>
      <div className="ba-top">
        <Link href="/casino" className="ba-back">Lobby</Link>
        <span className="ba-demo">DEMO - no real money</span>
        <b className="ba-title">{cfg.name}</b>
        <div className="ba-sp"/>
        <div className="ba-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"ba-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="ba-body">
        <div className="ba-table" ref={tableRef} style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
          <div className="ba-rays"/>
          
          <div className="ba-section banker">
            <span className="ba-label">BANKER</span>
            <div className="ba-hand">
              {result ? result.bankerCards.map(function (c, i) { return <CardView key={i} card={c} size={72}/> }) : <><CardView card={{rank:"A",suit:"S",value:1}} faceDown size={72}/><CardView card={{rank:"K",suit:"H",value:0}} faceDown size={72}/></>}
            </div>
            {result && <span className="ba-score">{result.bankerScore}</span>}
          </div>

          <div className="ba-center">
            {result && (
              <div className={"ba-result " + result.winner}>
                <b>{result.winner.toUpperCase()} WINS</b>
                {result.natural && <em>NATURAL</em>}
              </div>
            )}
            {!result && <span className="ba-msg">PLACE YOUR BET</span>}
            {lastPaid > 0 && <div className="ba-paid">+{fmt(lastPaid)} TD<em>{lastTx}</em></div>}
          </div>

          <div className="ba-section player">
            <span className="ba-label">PLAYER</span>
            <div className="ba-hand">
              {result ? result.playerCards.map(function (c, i) { return <CardView key={i} card={c} size={72}/> }) : <><CardView card={{rank:"Q",suit:"D",value:0}} faceDown size={72}/><CardView card={{rank:"9",suit:"C",value:9}} faceDown size={72}/></>}
            </div>
            {result && <span className="ba-score">{result.playerScore}</span>}
          </div>

          <div className="ba-history">
            <span>HISTORY</span>
            {history.map(function (w, i) { return <b key={i} className={w}>{w === "player" ? "P" : w === "banker" ? "B" : "T"}</b>; })}
          </div>
        </div>

        <aside className="ba-panel">
          <div className="ba-bets">
            <button className={"ba-bet player" + (selectedBet === "player" ? " on" : "")} disabled={busy} onClick={function () { getAudio().click(); setSelectedBet("player"); }}>
              <span>PLAYER</span><b>1:1</b>
            </button>
            <button className={"ba-bet tie" + (selectedBet === "tie" ? " on" : "")} disabled={busy} onClick={function () { getAudio().click(); setSelectedBet("tie"); }}>
              <span>TIE</span><b>8:1</b>
            </button>
            <button className={"ba-bet banker" + (selectedBet === "banker" ? " on" : "")} disabled={busy} onClick={function () { getAudio().click(); setSelectedBet("banker"); }}>
              <span>BANKER</span><b>0.95:1</b>
            </button>
          </div>

          <div className="ba-field">
            <label>BET (TD)</label>
            <div className="ba-stake">
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
              <input type="number" min={1} value={stake} disabled={busy} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
              <button disabled={busy} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
            </div>
          </div>
          <div className="ba-quick">{[10,25,50,100,500].map(function (v) { return <button key={v} disabled={busy} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
          
          <button className="ba-deal" disabled={busy || !me} onClick={play}>{busy ? "DEALING..." : "DEAL"}</button>
          
          {auto.left > 0 ? <button className="ba-stop" onClick={stopAuto}>STOP AUTO ({auto.left})</button> : <button className="ba-auto" disabled={busy || !me} onClick={function () { setAutoPanel(true); }}>AUTOPLAY</button>}
          
          <div className="ba-stats">
            <div><span>Hands</span><b>{session.spins}</b></div>
            <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
          </div>
          
          {err && <div className="ba-err">{err}</div>}
          <p className="ba-note">Banker bet has the lowest house edge (~1.06%) but pays 0.95:1 due to commission. Player bet pays 1:1 with ~1.24% edge. Tie bet pays 8:1 but has ~14.4% edge. TD has no monetary value.</p>
        </aside>
      </div>

      {intro && (
        <div className="ba-modal">
          <div className="ba-intro" style={{ backgroundImage: "linear-gradient(rgba(5,8,14,.58),rgba(5,8,14,.74)), url(/assets/" + slug + "/bg.jpg)", backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0a0f18" }}>
            <div className="ba-introcards">
              <CardView card={{rank:"A",suit:"S",value:1}} size={64}/>
              <CardView card={{rank:"9",suit:"H",value:9}} size={64}/>
            </div>
            <h2>{cfg.name}</h2>
            <p className="ba-imax">WIN UP TO <b>{cfg.maxWin}</b> YOUR BET</p>
            <span className="ba-ivol">8 DECKS - NATURAL 8/9</span>
            <label className="ba-check"><input type="checkbox" checked={hideIntro} onChange={function (e) { setHideIntro(e.target.checked); }}/><span>Do not show this again</span></label>
            <button className="ba-igo" onClick={closeIntro}><span>START</span></button>
          </div>
        </div>
      )}

      {autoPanel && (
        <div className="ba-modal" onClick={function () { setAutoPanel(false); }}>
          <div className="ba-box" onClick={function (e) { e.stopPropagation(); }}>
            <h3>Autoplay</h3>
            <div className="ba-autorow">{[10,25,50,100].map(function (n) { return <button key={n} onClick={function () { startAuto(n); }}>{n} HANDS</button>; })}</div>
            <label className="ba-af"><span>Stop on single win at least (TD, 0 = off)</span><input type="number" min={0} value={auto.stopWin} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopWin: Number(e.target.value) || 0 }); }); }}/></label>
            <label className="ba-af"><span>Stop if balance drops by (TD, 0 = off)</span><input type="number" min={0} value={auto.stopLoss} onChange={function (e) { setAuto(function (a) { return Object.assign({}, a, { stopLoss: Number(e.target.value) || 0 }); }); }}/></label>
            <button className="ba-close" onClick={function () { setAutoPanel(false); }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}