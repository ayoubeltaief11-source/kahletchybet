"use client";
import { useMemo } from "react";

interface GameCoverSvgProps {
  gameId: string;
  type: string;
  color: string;
  color2: string;
  title: string;
  maxWin?: string;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getSymbol(type: string): string {
  const symbols: Record<string, string> = {
    plinko: "●", mines: "💎", sicbo: "🎲", baccarat: "🃏",
    hilo: "↕", coinflip: "🪙", wheel: "◎", keno: "⑦",
    tower: "▲", dice: "⚄", limbo: "📈", hold: "💰",
    cluster: "✦", payline: "≡", megaways: "▤", crash: "🚀",
    slots: "🎰", roulette: "◎", blackjack: "🂡", instant: "⚡"
  };
  return symbols[type.toLowerCase()] || "★";
}

export default function GameCoverSvg({ gameId, type, color, color2, title, maxWin }: GameCoverSvgProps) {
  const seed = useMemo(() => hashId(gameId), [gameId]);
  const angle = (seed % 360);
  const symbol = getSymbol(type);

  return (
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`bg-${gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <radialGradient id={`glow-${gameId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color2} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill={`url(#bg-${gameId})`} />
      <circle cx="200" cy="300" r="180" fill={`url(#glow-${gameId})`} />
      <g transform={`rotate(${angle} 200 300)`}>
        <text x="200" y="320" fontSize="120" textAnchor="middle" fill="rgba(255,255,255,0.15)">{symbol}</text>
      </g>
      <text x="200" y="520" fontSize="28" fontWeight="900" textAnchor="middle" fill="#fff" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{title}</text>
      {maxWin && <text x="200" y="560" fontSize="18" fontWeight="700" textAnchor="middle" fill={color2}>{maxWin}</text>}
    </svg>
  );
}
