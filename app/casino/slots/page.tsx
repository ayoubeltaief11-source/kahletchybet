"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";

export default function SlotsGame() {
  const { me, refresh, toast } = useApp();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([["ðŸ’","ðŸ‹","ðŸ‡"], ["ðŸ’","ðŸ‹","ðŸ‡"], ["ðŸ’","ðŸ‹","ðŸ‡"]]);
  const [lastWin, setLastWin] = useState(0);

  const spin = async () => {
    if (!me) return toast("Sign in to play", "e");
    if (bet > me.balance) return toast("Insufficient TD balance", "e");
    if (bet < 1) return toast("Minimum bet is 1 TD", "e");

    setSpinning(true);
    setLastWin(0);

    // Animate locally for UX
    let frames = 0;
    const symbols = ["ðŸ’", "ðŸ‹", "ðŸ‡", "ðŸ’Ž", "7ï¸âƒ£", "ðŸ‘‘"];
    const interval = setInterval(() => {
      setReels([
        [symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)]],
        [symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)]],
        [symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)], symbols[Math.floor(Math.random() * 6)]]
      ]);
      frames++;
      if (frames > 15) {
        clearInterval(interval);
        resolveSpin();
      }
    }, 80);
  };

  const resolveSpin = async () => {
    const res = await fetch("/api/casino/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: "slots", bet })
    });
    const data = await res.json();
    
    if (data.success) {
      setReels(data.gameResult.reels);
      setLastWin(data.winAmount);
      refresh(); // Update global wallet UI
      if (data.winAmount > 0) toast(`WIN! +${data.winAmount} TD`, "j");
    } else {
      toast(data.error, "e");
    }
    setSpinning(false);
  };

  return (
    <div className="col">
      <div className="bt wrap mb">
        <Link href="/casino" className="btn o s">← Back to Lobby</Link>
        <span className="kb-demobadge lg">Native Demo</span>
      </div>

      <div className="pro-game-container">
        <div className="slot-machine">
          <div className="reels-container">
            {reels.map((col, i) => (
              <div key={i} className="reel">
                {col.map((sym, j) => (
                  <div key={j} className="symbol" style={{ fontSize: "3.5rem" }}>{sym}</div>
                ))}
              </div>
            ))}
          </div>
          {lastWin > 0 && <div className="win-overlay animate-bounce">WIN: {lastWin} TD</div>}
        </div>
        
        <div className="controls">
          <div className="info-row">
            <span>Balance:</span>
            <span className="mono" style={{ color: "var(--gold-hi)" }}>{me ? me.balance.toFixed(2) : "0.00"} TD</span>
          </div>
          <div className="info-row">
            <span>Bet Amount:</span>
            <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} disabled={spinning} className="stake-input" />
          </div>
          <button className="spin-btn" onClick={spin} disabled={spinning || !me}>
            {spinning ? "SPINNING..." : "SPIN"}
          </button>
        </div>
      </div>
    </div>
  );
}