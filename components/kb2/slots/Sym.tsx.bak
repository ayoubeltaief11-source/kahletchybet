"use client";
import { GameCharacter } from "@/lib/kb2/imageLoader";

const P: [string, string, string][] = [
  ["#ffd0e8", "#ff4fa3", "#8a0f47"],
  ["#d6f5ff", "#2fb6e8", "#0b4a66"],
  ["#e2ffd6", "#3fcf5f", "#0d5a24"],
  ["#fff2c4", "#f0b429", "#7a4a06"],
  ["#e6d6ff", "#9b5cf6", "#3d1a7a"],
  ["#ffdcc4", "#ff7a3d", "#7a2e06"],
  ["#ffe0e0", "#ef3b52", "#7a0d1c"],
  ["#d6fff2", "#17c9a4", "#065a48"]
];

export default function Sym({ k, size = 58 }: { k: number; size?: number }) {
  const uid = "sy" + k;
  if (k === 8) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs>
          <radialGradient id="sc" cx="0.35" cy="0.3"><stop offset="0%" stopColor="#fffbe8"/><stop offset="55%" stopColor="#ffd24a"/><stop offset="100%" stopColor="#a06a06"/></radialGradient>
        </defs>
        <path d="M32 3l8.6 18.4L61 24l-15 14.4L49.6 60 32 49.4 14.4 60 18 38.4 3 24l20.4-2.6Z" fill="url(#sc)" stroke="#5a3a04" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M32 11l5.6 12 13 1.7-9.6 9.2 2.4 13.2L32 40.6Z" fill="#fff" opacity="0.3"/>
        <circle cx="25" cy="20" r="3.4" fill="#fff" opacity="0.75"/>
      </svg>
    );
  }
  if (k === 9) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs>
          <radialGradient id="bm" cx="0.34" cy="0.28"><stop offset="0%" stopColor="#ffd0d0"/><stop offset="50%" stopColor="#e02020"/><stop offset="100%" stopColor="#5a0000"/></radialGradient>
        </defs>
        <circle cx="32" cy="36" r="23" fill="url(#bm)" stroke="#3a0000" strokeWidth="1.8"/>
        <path d="M32 13c5-6 12-7 16-3-3 5-9 7-16 3Z" fill="#3fcf5f"/>
        <rect x="29" y="8" width="6" height="8" rx="3" fill="#5a3a04"/>
        <circle cx="23" cy="28" r="6" fill="#fff" opacity="0.4"/>
        <path d="M18 44c6 5 16 5 22 0" stroke="#fff" strokeWidth="2" opacity="0.3" fill="none"/>
      </svg>
    );
  }
  const c = P[k] || P[0];
  const shape = k % 4;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={c[0]}/><stop offset="52%" stopColor={c[1]}/><stop offset="100%" stopColor={c[2]}/>
        </linearGradient>
        <radialGradient id={uid + "h"} cx="0.32" cy="0.26">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {shape === 0 && <g><circle cx="32" cy="34" r="22" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><path d="M32 12a22 22 0 0 1 0 44" fill="#fff" opacity="0.16"/><path d="M10 26 2 20l3 12-3 12 8-6Z" fill={c[1]} stroke={c[2]} strokeWidth="1.2"/><path d="M54 26l8-6-3 12 3 12-8-6Z" fill={c[1]} stroke={c[2]} strokeWidth="1.2"/><circle cx="24" cy="26" r="6" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 1 && <g><path d="M32 4 56 22 32 60 8 22Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><path d="M32 4 56 22H8Z" fill="#fff" opacity="0.3"/><path d="M8 22h48L32 60Z" fill="#000" opacity="0.14"/><path d="M32 4 21 22l11 38 11-38Z" fill="#fff" opacity="0.18"/><circle cx="24" cy="17" r="5" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 2 && <g><path d="M32 6c14 0 24 10 24 24S46 58 32 58 8 44 8 30 18 6 32 6Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><ellipse cx="32" cy="34" rx="15" ry="17" fill={c[0]} opacity="0.55"/><circle cx="25" cy="29" r="3.4" fill={c[2]}/><circle cx="39" cy="29" r="3.4" fill={c[2]}/><path d="M24 43c4 4 12 4 16 0" stroke={c[2]} strokeWidth="2.4" fill="none" strokeLinecap="round"/><circle cx="22" cy="18" r="6" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 3 && <g><path d="M32 58S6 42 6 25a13 13 0 0 1 26-7 13 13 0 0 1 26 7c0 17-26 33-26 33Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.8"/><path d="M17 21a9 9 0 0 1 9-5" stroke="#fff" strokeWidth="3.4" opacity="0.65" fill="none" strokeLinecap="round"/><circle cx="22" cy="20" r="5" fill={"url(#" + uid + "h)"}/></g>}
    </svg>
  );
}

export function Mascot({ hue, size = 210, slug }: { hue: string; size?: number; slug?: string }) {
  if (slug) {
    return <GameCharacter slug={slug} hue={hue} size={size} mood="idle"/>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="k5-mascot-svg">
      <defs>
        <radialGradient id="mg" cx="0.36" cy="0.28"><stop offset="0%" stopColor="#fff6fb"/><stop offset="48%" stopColor={hue}/><stop offset="100%" stopColor="#4a0a28"/></radialGradient>
        <linearGradient id="mh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.6"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>
      </defs>
      <ellipse cx="100" cy="176" rx="62" ry="12" fill="#000" opacity="0.35"/>
      <path d="M100 18c34 0 60 26 60 62 0 40-26 74-60 74S40 120 40 80c0-36 26-62 60-62Z" fill="url(#mg)" stroke="#3a0a1e" strokeWidth="3"/>
      <path d="M62 44c10-14 24-20 38-20" stroke="#fff" strokeWidth="6" opacity="0.4" fill="none" strokeLinecap="round"/>
      <ellipse cx="76" cy="82" rx="13" ry="16" fill="#fff"/>
      <ellipse cx="124" cy="82" rx="13" ry="16" fill="#fff"/>
      <circle cx="78" cy="86" r="7" fill="#2a0a18"/>
      <circle cx="126" cy="86" r="7" fill="#2a0a18"/>
      <circle cx="80" cy="83" r="2.6" fill="#fff"/>
      <circle cx="128" cy="83" r="2.6" fill="#fff"/>
      <path d="M74 116c10 14 42 14 52 0" stroke="#3a0a1e" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M84 120c6 8 26 8 32 0Z" fill="#ff8fb5"/>
      <circle cx="56" cy="106" r="9" fill="#ff8fb5" opacity="0.6"/>
      <circle cx="144" cy="106" r="9" fill="#ff8fb5" opacity="0.6"/>
      <path d="M40 62 22 44l6 22Z" fill={hue} stroke="#3a0a1e" strokeWidth="2"/>
      <path d="M160 62l18-18-6 22Z" fill={hue} stroke="#3a0a1e" strokeWidth="2"/>
      <ellipse cx="100" cy="46" rx="34" ry="14" fill="url(#mh)"/>
    </svg>
  );
}