"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useApp } from "@/components/Shell";
import { fmt } from "@/lib/catalog";
import { createShoe, calcScore } from "@/lib/kb2/bjMath";
import type { Card, Hand, BJResult } from "@/lib/kb2/bjMath";
import { getAudio } from "@/lib/kb2/audio";
import { usePrefs } from "@/lib/kb/prefs";

function CardView({ card, faceDown, size = 80 }: { card: Card; faceDown?: boolean; size?: number }) {
  const suitColor = card.suit === "H" || card.suit === "D" ? "#c4202f" : "#1a1a1a";
  const suitIcon = card.suit === "H" ? "♥" : card.suit === "D" ? "♦" : card.suit === "S" ? "♠" : "♣";
  
  if (faceDown) {
    return (
      <div className="bj-card bj-card-back" style={{ width: size, height: size * 1.4 }}>
        <div className="bj-card-pattern"/>
      </div>
    );
  }
  
  return (
    <div className="bj-card" style={{ width: size, height: size * 1.4, color: suitColor }}>
      <div className="bj-card-tl"><span>{card.rank}</span><span>{suitIcon}</span></div>
      <div className="bj-card-center">{suitIcon}</div>
      <div className="bj-card-br"><span>{suitIcon}</span><span>{card.rank}</span></div>
    </div>
  );
}

export default function BJEngine() {
  const { me, refresh, toast } = useApp();
  const { p: prefs, update } = usePrefs();
  const [shoe, setShoe] = useState<Card[]>([]);
  const [pHand, setPHand] = useState<Hand>({ cards: [], score: 0, isBlackjack: false, isBust: false });
  const [dHand, setDHand] = useState<Hand>({ cards: [], score: 0, isBlackjack: false, isBust: false });
  const [stake, setStake] = useState(5);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"betting" | "playing" | "dealer" | "settled">("betting");
  const [result, setResult] = useState<BJResult | null>(null);
  const [err, setErr] = useState("");
  const [session, setSession] = useState({ spins: 0, bet: 0, won: 0 });
  const tableRef = useRef<HTMLDivElement>(null);
  const startBal = useRef(0);

  useEffect(function () {
    setShoe(createShoe(6));
  }, []);

  const deal = useCallback(async function () {
    if (busy) return;
    if (!me) { setErr("Sign in to play"); getAudio().warn(); return; }
    if (stake > me.balance) { setErr("Insufficient TD balance"); getAudio().warn(); return; }
    setErr(""); setResult(null); setPhase("playing");
    getAudio().card();
    if (startBal.current === 0) startBal.current = me.balance;
    
    let currentShoe = shoe.length < 52 ? createShoe(6) : [...shoe];
    const pCards = [currentShoe.pop()!, currentShoe.pop()!];
    const dCards = [currentShoe.pop()!, { ...currentShoe.pop()!, hidden: true }];
    setShoe(currentShoe);
    
    setPHand({ cards: pCards, ...calcScore(pCards) });
    setDHand({ cards: dCards, score: calcScore(dCards.filter(c => !c.hidden)).score, isBlackjack: false, isBust: false });
    
    if (tableRef.current) {
      const cards = tableRef.current.querySelectorAll(".bj-card");
      gsap.fromTo(cards, { y: -100, opacity: 0, rotation: -15 }, { y: 0, opacity: 1, rotation: 0, duration: 0.4, stagger: 0.15, ease: "back.out(1.5)" });
    }
    
    const pScore = calcScore(pCards);
    if (pScore.isBlackjack) {
      await settle("stand", pCards, dCards, currentShoe);
    }
  }, [busy, me, stake, shoe]);

  const hit = useCallback(async function () {
    if (phase !== "playing") return;
    setBusy(true); getAudio().card();
    let currentShoe = [...shoe];
    const newCard = currentShoe.pop()!;
    setShoe(currentShoe);
    const newPCards = [...pHand.cards, newCard];
    const pScore = calcScore(newPCards);
    setPHand({ cards: newPCards, ...pScore });
    setBusy(false);
    if (tableRef.current) {
      const cards = tableRef.current.querySelectorAll(".bj-card");
      const last = cards[cards.length - 1];
      if (last) gsap.fromTo(last, { y: -80, opacity: 0, rotation: -10 }, { y: 0, opacity: 1, rotation: (Math.random()-0.5)*10, duration: 0.3, ease: "back.out(1.5)" });
    }
    if (pScore.isBust) await settle("stand", newPCards, dHand.cards, currentShoe);
  }, [phase, shoe, pHand, dHand]);

  const stand = useCallback(async function () {
    if (phase !== "playing") return;
    await settle("stand", pHand.cards, dHand.cards, shoe);
  }, [phase, pHand, dHand, shoe]);

  const double = useCallback(async function () {
    if (phase !== "playing" || pHand.cards.length !== 2) return;
    setBusy(true); getAudio().card();
    let currentShoe = [...shoe];
    const newCard = currentShoe.pop()!;
    setShoe(currentShoe);
    const newPCards = [...pHand.cards, newCard];
    const pScore = calcScore(newPCards);
    setPHand({ cards: newPCards, ...pScore });
    if (tableRef.current) {
      const cards = tableRef.current.querySelectorAll(".bj-card");
      const last = cards[cards.length - 1];
      if (last) gsap.fromTo(last, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.5)" });
    }
    await settle("double", newPCards, dHand.cards, currentShoe);
  }, [phase, pHand, dHand, shoe]);

  const settle = useCallback(async function (action: string, pCards: Card[], dCards: Card[], currentShoe: Card[]) {
    setPhase("dealer"); setBusy(true);
    try {
      const r = await fetch("/api/kb2/bj", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stake: stake, action: action }) });
      const d = await r.json();
      if (!d.ok) { setErr(d.error); setPhase("betting"); setBusy(false); return; }
      
      setPHand(d.result.playerHand);
      setDHand(d.result.dealerHand);
      setResult(Object.assign({}, d.result, { tx: d.tx }));
      refresh();
      setSession(function (s) { return { spins: s.spins + 1, bet: s.bet + (action === "double" ? stake * 2 : stake), won: s.won + d.paid }; });
      
      if (d.result.outcome === "blackjack") { getAudio().mega(); toast("BLACKJACK! +" + fmt(d.paid), "j"); }
      else if (d.result.outcome === "win") { getAudio().win(); toast("YOU WIN +" + fmt(d.paid), "j"); }
      else if (d.result.outcome === "push") { getAudio().click(); toast("PUSH - Bet returned", "g"); }
      else { getAudio().lose(); toast("DEALER WINS", "e"); }
      
      await new Promise(function (res) { window.setTimeout(res, 2000); });
      setPhase("betting"); setBusy(false);
    } catch (e) {
      setErr("Network error"); setPhase("betting"); setBusy(false);
    }
  }, [stake, refresh, toast]);

  return (
    <div className="kbj">
      <div className="kbj-top">
        <Link href="/casino" className="kbj-back">Lobby</Link>
        <span className="kbj-demo">DEMO - no real money</span>
        <b className="kbj-title">Blackjack</b>
        <div className="kbj-sp"/>
        <div className="kbj-bal"><span>BALANCE</span><b>{fmt(me ? me.balance : 0)} TD</b></div>
        <button className={"kbj-ico" + (prefs.sound ? " on" : "")} onClick={function () { update({ sound: !prefs.sound }); }}>{prefs.sound ? "SND" : "MUTE"}</button>
      </div>

      <div className="kbj-table" ref={tableRef} style={{ background: "radial-gradient(ellipse at center, #0d5a24 0%, #062a1a 100%)" }}>
        <div className="kbj-rays"/>
        <div className="kbj-dealer">
          <span>DEALER {dHand.score > 0 ? dHand.score : ""}</span>
          <div className="kbj-hand">
            {dHand.cards.map(function (c, i) { return <CardView key={i} card={c} faceDown={c.hidden} size={72}/> })}
          </div>
        </div>
        
        <div className="kbj-info">
          {phase === "betting" && <span className="kbj-msg">PLACE YOUR BET</span>}
          {phase === "playing" && <span className="kbj-msg">HIT, STAND, OR DOUBLE?</span>}
          {result && (
            <div className={"kbj-result " + result.outcome}>
              <b>{result.outcome === "blackjack" ? "BLACKJACK!" : result.outcome === "win" ? "YOU WIN" : result.outcome === "push" ? "PUSH" : "DEALER WINS"}</b>
              <em>{result.tx}</em>
            </div>
          )}
        </div>

        <div className="kbj-player">
          <div className="kbj-hand">
            {pHand.cards.map(function (c, i) { return <CardView key={i} card={c} size={72}/> })}
          </div>
          <span>YOU {pHand.score > 0 ? pHand.score : ""}</span>
        </div>
      </div>

      <aside className="kbj-panel">
        <div className="kbj-field">
          <label>BET (TD)</label>
          <div className="kbj-stake">
            <button disabled={phase !== "betting"} onClick={function () { getAudio().click(); setStake(function (v) { return Math.max(1, v - 1); }); }}>-</button>
            <input type="number" min={1} value={stake} disabled={phase !== "betting"} onChange={function (e) { setStake(Math.max(1, Number(e.target.value) || 1)); }}/>
            <button disabled={phase !== "betting"} onClick={function () { getAudio().click(); setStake(function (v) { return v + 1; }); }}>+</button>
          </div>
        </div>
        <div className="kbj-quick">{[5,10,25,50,100].map(function (v) { return <button key={v} disabled={phase !== "betting"} onClick={function () { getAudio().chip(); setStake(v); }}>{v}</button>; })}</div>
        
        <div className="kbj-actions">
          <button className="kbj-btn deal" disabled={phase !== "betting" || busy} onClick={deal}>DEAL</button>
          <button className="kbj-btn hit" disabled={phase !== "playing" || busy} onClick={hit}>HIT</button>
          <button className="kbj-btn stand" disabled={phase !== "playing" || busy} onClick={stand}>STAND</button>
          <button className="kbj-btn double" disabled={phase !== "playing" || busy || pHand.cards.length !== 2} onClick={double}>DOUBLE</button>
        </div>
        
        {err && <div className="kbj-err">{err}</div>}
        <div className="kbj-stats">
          <div><span>Hands</span><b>{session.spins}</b></div>
          <div><span>Net</span><b className={session.won >= session.bet ? "up" : "dn"}>{fmt(session.won - session.bet)}</b></div>
        </div>
        <p className="kbj-note">Dealer stands on 17. Blackjack pays 3:2. Using basic strategy reduces the house edge to ~0.5%, but the long-run expectation remains negative. TD has no monetary value.</p>
      </aside>
    </div>
  );
}