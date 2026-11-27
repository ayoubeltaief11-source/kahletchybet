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
  const uniqueId = `cover-${gameId.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`${uniqueId}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={color2} />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`${uniqueId}-glow`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="60%" stopColor={color2} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${uniqueId}-bg)`} />
      <circle cx="150" cy="180" r="120" fill={`url(#${uniqueId}-glow)`} />
      <g transform={`rotate(${angle} 150 180)`} opacity="0.8">
        <circle cx="150" cy="180" r="90" fill="none" stroke={color2} strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="150" cy="180" r="70" fill="none" stroke={color2} strokeWidth="1" strokeDasharray="4 4" />
      </g>
      <text x="150" y="200" fontSize="80" textAnchor="middle" fill="#fff" opacity="0.9" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
        {symbol}
      </text>
      <text x="150" y="340" fontSize="24" fontWeight="900" textAnchor="middle" fill="#fff" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
        {title}
      </text>
      {maxWin && (
        <text x="150" y="370" fontSize="16" fontWeight="700" textAnchor="middle" fill={color2} style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          {maxWin}
        </text>
      )}
    </svg>
  );
}
