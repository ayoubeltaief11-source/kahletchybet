"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";

export default function BlackjackGame() {
  const { me, refresh, toast } = useApp();
  const [bet, setBet] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const deal = async () => {
    if (!me) return toast("Sign in to play", "e");
    if (bet > me.balance) return toast("Insufficient TD balance", "e");
    if (bet < 1) return toast("Minimum bet is 1 TD", "e");

    setPlaying(true);
    setResult(null);

    const res = await fetch("/api/casino/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: "blackjack", bet })
    });
    const data = await res.json();
    
    if (data.success) {
      setResult(data.gameResult);
      refresh();
      if (data.winAmount > bet) toast(`WIN! +${data.winAmount - bet} TD`, "j");
      else if (data.gameResult.push) toast("Push - Bet returned", "g");
      else toast("Dealer wins", "e");
    } else {
      toast(data.error, "e");
    }
    setPlaying(false);
  };

  return (
    <div className="col">
      <div className="bt wrap mb">
        <Link href="/casino" className="btn o s">â† Back to Lobby</Link>
        <span className="kb-demobadge lg">Native Demo</span>
      </div>

      <div className="pro-game-container">
        <div className="crash-screen" style={{ height: "250px", flexDirection: "column", gap: "20px" }}>
          {playing ? (
            <div className="text-4xl font-bold text-yellow-400 animate-pulse">Dealing...</div>
          ) : result ? (
            <div className="text-center">
              <div className="text-2xl mb-4">
                Player: <span className="font-bold text-green-400">{result.playerScore}</span> | 
                Dealer: <span className="font-bold text-red-400">{result.dealerScore}</span>
              </div>
              <div className={`text-3xl font-black ${result.won ? "text-green-400" : result.push ? "text-yellow-400" : "text-red-400"}`}>
                {result.won ? "YOU WIN!" : result.push ? "PUSH" : "DEALER WINS"}
              </div>
            </div>
          ) : (
            <div className="text-2xl text-gray-500">Place your bet to deal</div>
          )}
        </div>

        <div className="controls">
          <div className="info-row">
            <span>Balance:</span>
            <span className="mono" style={{ color: "var(--gold-hi)" }}>{me ? me.balance.toFixed(2) : "0.00"} TD</span>
          </div>
          <div className="info-row">
            <span>Bet Amount:</span>
            <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} disabled={playing} className="stake-input" />
          </div>
          <button className="spin-btn" onClick={deal} disabled={playing || !me}>
            {playing ? "DEALING..." : "DEAL HAND"}
          </button>
          <div className="xxs faint ctr mt">
            Simplified auto-resolution demo. Dealer stands on 17. Blackjack pays 3:2.
          </div>
        </div>
      </div>
    </div>
  );
}