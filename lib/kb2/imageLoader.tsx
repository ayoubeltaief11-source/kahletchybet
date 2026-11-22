"use client";
import { useState, useEffect } from "react";

export interface AssetPaths {
  cover: string | null;
  bg: string | null;
  logo: string | null;
  character: string | null;
  symbols: (string | null)[];
}

export function getAssetPath(gameId: string, kind: "cover" | "bg" | "logo" | "character" | "symbol", index?: number): string | null {
  if (typeof window === "undefined") return null;
  const base = "/assets/" + gameId;
  if (kind === "symbol" && index !== undefined) {
    return base + "/s" + (index + 1) + ".png";
  }
  const map: Record<string, string> = { cover: "/cover.png", bg: "/bg.jpg", logo: "/logo.png", character: "/character.png" };
  return base + (map[kind] || "");
}

export function useAssets(gameId: string): AssetPaths {
  return {
    cover: getAssetPath(gameId, "cover"),
    bg: getAssetPath(gameId, "bg"),
    logo: getAssetPath(gameId, "logo"),
    character: getAssetPath(gameId, "character"),
    symbols: Array.from({ length: 9 }, function (_, i) { return getAssetPath(gameId, "symbol", i); })
  };
}

export function FallbackCover({ name, accent, accent2, family }: { name: string; accent: string; accent2: string; family: string }) {
  const uid = "fc" + name.replace(/\s+/g, "").toLowerCase().slice(0, 12);
  const words = name.toUpperCase().split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
  return (
    <svg viewBox="0 0 300 400" className="kb-fallback-cover" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={uid + "bg"} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={accent2} stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id={uid + "glow"} cx="0.5" cy="0.4">
          <stop offset="0%" stopColor={accent2} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={accent2} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={uid + "title"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbe8"/>
          <stop offset="50%" stopColor={accent2}/>
          <stop offset="100%" stopColor="#fff0b8"/>
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={"url(#" + uid + "bg)"}/>
      <rect width="300" height="400" fill={"url(#" + uid + "glow)"}/>
      {family === "crash" && (
        <g transform="translate(150 180)">
          <path d="M-60 10 L40 -10 L70 -25 L78 -18 L55 -5 L78 10 L70 18 L40 5 L-60 10Z" fill="#fff6d8" stroke="#2a1c04" strokeWidth="2"/>
          <path d="M-10 -5 L-30 -35 L-18 -33 L10 -5Z" fill={accent}/>
          <path d="M-10 5 L-30 35 L-18 33 L10 5Z" fill={accent}/>
          <ellipse cx="30" cy="-5" rx="12" ry="6" fill="#a9e6ff" stroke="#0d3550" strokeWidth="1.5"/>
        </g>
      )}
      {family === "slots" && (
        <g transform="translate(150 180)">
          <circle cx="0" cy="0" r="55" fill={accent2} opacity="0.3"/>
          <path d="M0-45 C25-45 45-25 45 0 C45 25 25 45 0 45 C-25 45 -45 25 -45 0 C-45-25-25-45 0-45Z" fill={accent} stroke="#2a1c04" strokeWidth="2.5"/>
          <circle cx="-12" cy="-8" r="6" fill="#0d3b1e"/>
          <circle cx="12" cy="-8" r="6" fill="#0d3b1e"/>
          <circle cx="-10" cy="-10" r="2" fill="#fff"/>
          <circle cx="14" cy="-10" r="2" fill="#fff"/>
          <path d="M-15 15 Q0 30 15 15" stroke="#2a1c04" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </g>
      )}
      {family === "roulette" && (
        <g transform="translate(150 180)">
          <circle cx="0" cy="0" r="60" fill={accent} stroke="#2a1c04" strokeWidth="3"/>
          <circle cx="0" cy="0" r="50" fill="#0a0e15"/>
          {Array.from({ length: 12 }).map(function (_, i) {
            const a = (i * 30 - 90) * Math.PI / 180;
            const a2 = ((i + 1) * 30 - 90) * Math.PI / 180;
            const x1 = 50 * Math.cos(a), y1 = 50 * Math.sin(a);
            const x2 = 50 * Math.cos(a2), y2 = 50 * Math.sin(a2);
            const x3 = 30 * Math.cos(a2), y3 = 30 * Math.sin(a2);
            const x4 = 30 * Math.cos(a), y4 = 30 * Math.sin(a);
            const fill = i % 2 === 0 ? "#c4202f" : "#141a24";
            return <path key={i} d={"M"+x1+","+y1+" A50,50 0 0,1 "+x2+","+y2+" L"+x3+","+y3+" A30,30 0 0,0 "+x4+","+y4+" Z"} fill={fill} stroke={accent2} strokeWidth="0.5"/>;
          })}
          <circle cx="0" cy="0" r="30" fill="#0a0e15" stroke={accent2} strokeWidth="1.5"/>
          <circle cx="0" cy="0" r="12" fill={accent2}/>
          <circle cx="28" cy="-42" r="5" fill="#fff"/>
        </g>
      )}
      {family === "instant" && (
        <g transform="translate(150 180)">
          <rect x="-50" y="-50" width="100" height="100" rx="12" fill={accent} opacity="0.3" stroke={accent2} strokeWidth="2"/>
          <circle cx="0" cy="0" r="30" fill={accent2} stroke="#2a1c04" strokeWidth="2"/>
          <text x="0" y="8" textAnchor="middle" fontSize="28" fontWeight="900" fill="#2a1c04">?</text>
        </g>
      )}
      <text x="150" y={line2 ? 290 : 310} textAnchor="middle" fontSize={line1.length > 12 ? 22 : 28} fontWeight="900" fontFamily="Arial Black, Arial" fill={"url(#" + uid + "title)"} stroke="#2a1c04" strokeWidth="2" paintOrder="stroke">{line1}</text>
      {line2 && <text x="150" y="325" textAnchor="middle" fontSize={line2.length > 12 ? 20 : 26} fontWeight="900" fontFamily="Arial Black, Arial" fill={"url(#" + uid + "title)"} stroke="#2a1c04" strokeWidth="2" paintOrder="stroke">{line2}</text>}
      <rect x="0" y="370" width="300" height="30" fill="#04070c" opacity="0.85"/>
      <text x="10" y="390" fontSize="8" fontWeight="900" fontFamily="Arial" letterSpacing="1.5" fill={accent2}>KB STUDIO</text>
      <text x="290" y="390" textAnchor="end" fontSize="7" fontWeight="800" fontFamily="Arial" letterSpacing="1" fill="#8fa2ba">{family.toUpperCase()}</text>
    </svg>
  );
}

export function FallbackSymbol({ k, accent, accent2 }: { k: number; accent: string; accent2: string }) {
  const uid = "fs" + k;
  const colors = [
    ["#ffd0e8", "#ff4fa3", "#8a0f47"],
    ["#d6f5ff", "#2fb6e8", "#0b4a66"],
    ["#e2ffd6", "#3fcf5f", "#0d5a24"],
    ["#fff2c4", "#f0b429", "#7a4a06"],
    ["#e6d6ff", "#9b5cf6", "#3d1a7a"],
    ["#ffdcc4", "#ff7a3d", "#7a2e06"],
    ["#ffe0e0", "#ef3b52", "#7a0d1c"],
    ["#d6fff2", "#17c9a4", "#065a48"],
    ["#e8e8f0", "#8290ad", "#2a3050"]
  ];
  const c = colors[k % colors.length];
  const shape = k % 4;
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={c[0]}/><stop offset="52%" stopColor={c[1]}/><stop offset="100%" stopColor={c[2]}/>
        </linearGradient>
        <radialGradient id={uid + "h"} cx="0.32" cy="0.26">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {shape === 0 && <g><circle cx="32" cy="34" r="22" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><circle cx="24" cy="26" r="6" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 1 && <g><path d="M32 4 56 22 32 60 8 22Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><path d="M32 4 56 22H8Z" fill="#fff" opacity="0.3"/></g>}
      {shape === 2 && <g><path d="M32 6c14 0 24 10 24 24S46 58 32 58 8 44 8 30 18 6 32 6Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><circle cx="25" cy="29" r="3.4" fill={c[2]}/><circle cx="39" cy="29" r="3.4" fill={c[2]}/></g>}
      {shape === 3 && <g><path d="M8 20h48v26a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><ellipse cx="32" cy="20" rx="24" ry="7" fill={c[0]} stroke={c[2]} strokeWidth="1.5"/></g>}
    </svg>
  );
}

export function GameCover({ slug, name, accent, accent2, family, className }: { slug: string; name: string; accent: string; accent2: string; family: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = "/assets/" + slug + "/cover.png";

  useEffect(function () {
    const img = new Image();
    img.onload = function () { setLoaded(true); };
    img.onerror = function () { setFailed(true); };
    img.src = src;
  }, [src]);

  if (!loaded || failed) {
    return <div className={className}><FallbackCover name={name} accent={accent} accent2={accent2} family={family}/></div>;
  }

  return (
    <div className={"kb-cover-real " + (className || "")}>
      <img src={src} alt={name} className="kb-cover-img"/>
      <div className="kb-cover-shade"/>
    </div>
  );
}

export function GameCharacter({ slug, hue, size = 200, className, mood }: { slug: string; hue: string; size?: number; className?: string; mood?: "idle" | "win" | "freespin" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = "/assets/" + slug + "/character.png";

  useEffect(function () {
    const img = new Image();
    img.onload = function () { setLoaded(true); };
    img.onerror = function () { setFailed(true); };
    img.src = src;
  }, [src]);

  if (!loaded || failed) {
    return null;
  }

  const moodClass = mood === "win" ? " kb-char-win" : mood === "freespin" ? " kb-char-freespin" : "";

  return (
    <div className={"kb-character " + (className || "") + moodClass} style={{ width: size, height: size, filter: "drop-shadow(0 0 20px " + hue + "80)" }}>
      <img src={src} alt="character" className="kb-char-img"/>
    </div>
  );
}
