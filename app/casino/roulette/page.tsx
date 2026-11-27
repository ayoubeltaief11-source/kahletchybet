"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/Shell";
import Icon from "@/components/Icon";

export default function RouletteGame() {
  const { me, refresh, toast } = useApp();
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState("red");
  const [betValue, setBetValue] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const spin = async () => {
    if (!me) return toast("Sign in to play", "e");
    if (bet > me.balance) return toast("Insufficient TD balance", "e");
    if (betType === "number" && (betValue < 0 || betValue > 36)) return toast("Invalid number (0-36)", "e");

    setSpinning(true);
    setResult(null);

    // Local animation delay
    setTimeout(async () => {
      const res = await fetch("/api/casino/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "roulette", bet, betType, betValue })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.gameResult);
        refresh();
        if (data.winAmount > 0) toast(`WIN! +${data.winAmount} TD`, "j");
        else toast("No win this round", "g");
      } else {
        toast(data.error, "e");
      }
      setSpinning(false);
    }, 2000);
  };

  const isRed = (n: number) => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
  const getColor = (n: number) => n === 0 ? "bg-green-700" : isRed(n) ? "bg-red-700" : "bg-gray-900";

  return (
    <div className="col">
      <div className="bt wrap mb">
        <Link href="/casino" className="btn o s">← Back to Lobby</Link>
        <span className="kb-demobadge lg">Native Demo</span>
      </div>

      <div className="pro-game-container">
        <div className="crash-screen" style={{ height: "200px", flexDirection: "column", gap: "10px" }}>
          {spinning ? (
            <div className="text-4xl font-bold text-yellow-400 animate-pulse">Spinning...</div>
          ) : result ? (
            <>
              <div className={`text-6xl font-black p-4 rounded-full ${getColor(result.winningNumber)} text-white`}>
                {result.winningNumber}
              </div>
              <div className="text-xl text-gray-300">
                {result.winningNumber === 0 ? "Zero" : result.isRed ? "Red" : "Black"}
              </div>
            </>
          ) : (
            <div className="text-2xl text-gray-500">Place your bets</div>
          )}
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
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button className={`btn x ${betType === "red" ? "g" : "o"}`} onClick={() => setBetType("red")} disabled={spinning}>Red (2x)</button>
            <button className={`btn x ${betType === "black" ? "g" : "o"}`} onClick={() => setBetType("black")} disabled={spinning}>Black (2x)</button>
            <button className={`btn x ${betType === "even" ? "g" : "o"}`} onClick={() => setBetType("even")} disabled={spinning}>Even (2x)</button>
            <button className={`btn x ${betType === "odd" ? "g" : "o"}`} onClick={() => setBetType("odd")} disabled={spinning}>Odd (2x)</button>
          </div>
          
          <div className="info-row mb-2">
            <span>Or pick a number (0-36):</span>
            <input type="number" min="0" max="36" value={betValue} onChange={(e) => { setBetType("number"); setBetValue(Number(e.target.value)); }} disabled={spinning} className="stake-input" style={{ width: "80px" }} />
          </div>

          <button className="spin-btn" onClick={spin} disabled={spinning || !me}>
            {spinning ? "SPINNING..." : "SPIN WHEEL"}
          </button>
        </div>
      </div>
    </div>
  );
}