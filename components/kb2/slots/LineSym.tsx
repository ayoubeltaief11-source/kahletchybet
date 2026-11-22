"use client";
import { GameCharacter } from "@/lib/kb2/imageLoader";

const SETS: Record<string, [string, string, string][]> = {
  jade: [["#d6fff2","#17c9a4","#065a48"],["#e2ffd6","#3fcf5f","#0d5a24"],["#fff2c4","#f0b429","#7a4a06"],["#d6f5ff","#2fb6e8","#0b4a66"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#ffdcc4","#ff7a3d","#7a2e06"],["#ffe0e0","#ef3b52","#7a0d1c"],["#ffd0e8","#ff4fa3","#8a0f47"]],
  forge: [["#ffdcc4","#ff7a3d","#7a2e06"],["#ffe0e0","#ef3b52","#7a0d1c"],["#fff2c4","#f0b429","#7a4a06"],["#e8e8f0","#8290ad","#2a3050"],["#ffd0e8","#ff4fa3","#8a0f47"],["#d6f5ff","#2fb6e8","#0b4a66"],["#e2ffd6","#3fcf5f","#0d5a24"],["#e6d6ff","#9b5cf6","#3d1a7a"]],
  tide: [["#d6f5ff","#2fb6e8","#0b4a66"],["#d6fff2","#17c9a4","#065a48"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#fff2c4","#f0b429","#7a4a06"],["#ffd0e8","#ff4fa3","#8a0f47"],["#e2ffd6","#3fcf5f","#0d5a24"],["#ffdcc4","#ff7a3d","#7a2e06"],["#ffe0e0","#ef3b52","#7a0d1c"]],
  dusk: [["#e6d6ff","#9b5cf6","#3d1a7a"],["#ffd0e8","#ff4fa3","#8a0f47"],["#fff2c4","#f0b429","#7a4a06"],["#d6f5ff","#2fb6e8","#0b4a66"],["#ffe0e0","#ef3b52","#7a0d1c"],["#d6fff2","#17c9a4","#065a48"],["#e2ffd6","#3fcf5f","#0d5a24"],["#ffdcc4","#ff7a3d","#7a2e06"]],
  fruit: [["#ffe0e0","#ef3b52","#7a0d1c"],["#fff2c4","#f0b429","#7a4a06"],["#e2ffd6","#3fcf5f","#0d5a24"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#ffdcc4","#ff7a3d","#7a2e06"],["#d6fff2","#17c9a4","#065a48"],["#ffd0e8","#ff4fa3","#8a0f47"],["#d6f5ff","#2fb6e8","#0b4a66"]],
  bloom: [["#ffd0e8","#ff4fa3","#8a0f47"],["#ffe0e0","#ef3b52","#7a0d1c"],["#e2ffd6","#3fcf5f","#0d5a24"],["#fff2c4","#f0b429","#7a4a06"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#d6fff2","#17c9a4","#065a48"],["#d6f5ff","#2fb6e8","#0b4a66"],["#ffdcc4","#ff7a3d","#7a2e06"]],
  storm: [["#d6f5ff","#2fb6e8","#0b4a66"],["#e8e8f0","#8290ad","#2a3050"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#fff2c4","#f0b429","#7a4a06"],["#d6fff2","#17c9a4","#065a48"],["#ffe0e0","#ef3b52","#7a0d1c"],["#ffd0e8","#ff4fa3","#8a0f47"],["#e2ffd6","#3fcf5f","#0d5a24"]],
  sun: [["#fff2c4","#f0b429","#7a4a06"],["#ffdcc4","#ff7a3d","#7a2e06"],["#ffe0e0","#ef3b52","#7a0d1c"],["#e2ffd6","#3fcf5f","#0d5a24"],["#d6f5ff","#2fb6e8","#0b4a66"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#ffd0e8","#ff4fa3","#8a0f47"],["#d6fff2","#17c9a4","#065a48"]],
  verdant: [["#e2ffd6","#3fcf5f","#0d5a24"],["#d6fff2","#17c9a4","#065a48"],["#fff2c4","#f0b429","#7a4a06"],["#ffdcc4","#ff7a3d","#7a2e06"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#ffe0e0","#ef3b52","#7a0d1c"],["#d6f5ff","#2fb6e8","#0b4a66"],["#ffd0e8","#ff4fa3","#8a0f47"]],
  vault: [["#e8e8f0","#8290ad","#2a3050"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#d6f5ff","#2fb6e8","#0b4a66"],["#fff2c4","#f0b429","#7a4a06"],["#d6fff2","#17c9a4","#065a48"],["#ffe0e0","#ef3b52","#7a0d1c"],["#ffd0e8","#ff4fa3","#8a0f47"],["#e2ffd6","#3fcf5f","#0d5a24"]],
  coral: [["#ffd0e8","#ff4fa3","#8a0f47"],["#d6fff2","#17c9a4","#065a48"],["#d6f5ff","#2fb6e8","#0b4a66"],["#fff2c4","#f0b429","#7a4a06"],["#ffdcc4","#ff7a3d","#7a2e06"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#e2ffd6","#3fcf5f","#0d5a24"],["#ffe0e0","#ef3b52","#7a0d1c"]],
  obsidian: [["#fff2c4","#f0b429","#7a4a06"],["#e8e8f0","#8290ad","#2a3050"],["#ffe0e0","#ef3b52","#7a0d1c"],["#e6d6ff","#9b5cf6","#3d1a7a"],["#d6f5ff","#2fb6e8","#0b4a66"],["#d6fff2","#17c9a4","#065a48"],["#ffd0e8","#ff4fa3","#8a0f47"],["#e2ffd6","#3fcf5f","#0d5a24"]]
};

import { useState, useEffect } from "react";
import { symbolUrl } from "@/src/kb3/assets/gameAssets";
export function LineSym({ k, set, size = 56 }: { k: number; set: string; size?: number }) {
  const [slug, setSlug] = useState("");
  const [ok, setOk] = useState(false);
  useEffect(function () {
    try {
      const m = window.location.pathname.match(/\/casino\/[a-z0-9]+\/([a-z0-9-]+)/);
      if (m && m[1]) setSlug(m[1]);
    } catch (e) { /* ignore */ }
  }, []);
  const realSrc = slug ? symbolUrl(slug, k) : "";
  useEffect(function () {
    if (!realSrc) { setOk(false); return; }
    const im = new Image();
    im.onload = function () { setOk(true); };
    im.onerror = function () { setOk(false); };
    im.src = realSrc;
  }, [realSrc]);
  if (ok && realSrc) {
    return <img src={realSrc} width={size} height={size} alt="" draggable={false} style={{ objectFit: "contain", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.5))" }}/>;
  }
  const pal = SETS[set] || SETS.jade;
  if (k === 8) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs><linearGradient id="lw" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#fffbe8"/><stop offset="46%" stopColor="#ffd24a"/><stop offset="100%" stopColor="#8a5a06"/></linearGradient></defs>
        <rect x="5" y="5" width="54" height="54" rx="13" fill="url(#lw)" stroke="#5a3a04" strokeWidth="2"/>
        <path d="M14 44 20 20l6 15 6-15 6 15 6-15 6 24" fill="none" stroke="#5a3a04" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round"/>
        <rect x="10" y="10" width="44" height="9" rx="4.5" fill="#fff" opacity="0.3"/>
      </svg>
    );
  }
  if (k === 9) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <defs><radialGradient id="ls" cx="0.36" cy="0.3"><stop offset="0%" stopColor="#fffbe8"/><stop offset="52%" stopColor="#ff9f43"/><stop offset="100%" stopColor="#7a2e06"/></radialGradient></defs>
        <circle cx="32" cy="32" r="26" fill="url(#ls)" stroke="#5a2404" strokeWidth="2"/>
        <path d="M32 10l6.4 13.6L53 26l-11 10.6L44.8 52 32 44.4 19.2 52 22 36.6 11 26l14.6-2.4Z" fill="#fff" opacity="0.9"/>
        <circle cx="24" cy="22" r="4" fill="#fff" opacity="0.6"/>
      </svg>
    );
  }
  const c = pal[k] || pal[0];
  const uid = "ls" + set + k;
  const shape = k % 4;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stopColor={c[0]}/><stop offset="52%" stopColor={c[1]}/><stop offset="100%" stopColor={c[2]}/></linearGradient>
        <radialGradient id={uid + "h"} cx="0.32" cy="0.26"><stop offset="0%" stopColor="#fff" stopOpacity="0.92"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient>
      </defs>
      {shape === 0 && <g><path d="M32 4 56 22 32 60 8 22Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.9"/><path d="M32 4 56 22H8Z" fill="#fff" opacity="0.32"/><path d="M8 22h48L32 60Z" fill="#000" opacity="0.15"/><path d="M32 4 21 22l11 38 11-38Z" fill="#fff" opacity="0.2"/><circle cx="24" cy="17" r="5" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 1 && <g><circle cx="32" cy="32" r="24" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.9"/><circle cx="32" cy="32" r="17" fill="none" stroke={c[2]} strokeWidth="1.4" opacity="0.6"/><path d="M32 16l4.6 9.6L47 27l-7.6 7.4L41.4 45 32 39.8 22.6 45l2-10.6L17 27l10.4-1.4Z" fill="#fff" opacity="0.85"/><circle cx="22" cy="20" r="5" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 2 && <g><path d="M32 6c14 0 24 10 24 24S46 58 32 58 8 44 8 30 18 6 32 6Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.9"/><ellipse cx="32" cy="34" rx="15" ry="17" fill={c[0]} opacity="0.5"/><circle cx="25" cy="29" r="3.4" fill={c[2]}/><circle cx="39" cy="29" r="3.4" fill={c[2]}/><path d="M24 43c4 4 12 4 16 0" stroke={c[2]} strokeWidth="2.4" fill="none" strokeLinecap="round"/><circle cx="22" cy="18" r="6" fill={"url(#" + uid + "h)"}/></g>}
      {shape === 3 && <g><path d="M8 20h48v26a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8Z" fill={"url(#" + uid + ")"} stroke={c[2]} strokeWidth="1.9"/><ellipse cx="32" cy="20" rx="24" ry="7" fill={c[0]} stroke={c[2]} strokeWidth="1.5"/><circle cx="24" cy="15" r="5" fill={"url(#" + uid + ")"}/><circle cx="36" cy="12" r="6" fill={"url(#" + uid + ")"}/><path d="M16 34c6 4 16 4 22 0" stroke="#fff" strokeWidth="2.4" opacity="0.4" fill="none"/></g>}
    </svg>
  );
}

export function LineMascot({ hue, hue2, size = 200, slug }: { hue: string; hue2: string; size?: number; slug?: string }) {
  if (slug) {
    return <GameCharacter slug={slug} hue={hue} size={size} mood="idle"/>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="k6-mascot-svg">
      <defs>
        <radialGradient id="lmg" cx="0.36" cy="0.26"><stop offset="0%" stopColor="#fffdf6"/><stop offset="46%" stopColor={hue}/><stop offset="100%" stopColor="#0d1018"/></radialGradient>
        <linearGradient id="lmc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={hue2}/><stop offset="100%" stopColor={hue}/></linearGradient>
      </defs>
      <ellipse cx="100" cy="180" rx="58" ry="11" fill="#000" opacity="0.4"/>
      <path d="M100 24 148 46v50c0 40-24 62-48 70-24-8-48-30-48-70V46Z" fill="url(#lmg)" stroke="#0a0d14" strokeWidth="3"/>
      <path d="M100 34 140 52v44c0 32-19 50-40 58Z" fill="#fff" opacity="0.12"/>
      <path d="M64 52 100 36l36 16-36 14Z" fill="url(#lmc)" stroke="#0a0d14" strokeWidth="2"/>
      <ellipse cx="80" cy="92" rx="11" ry="13" fill="#0a0d14"/>
      <ellipse cx="120" cy="92" rx="11" ry="13" fill="#0a0d14"/>
      <circle cx="82" cy="89" r="4" fill={hue2}/>
      <circle cx="122" cy="89" r="4" fill={hue2}/>
      <path d="M78 124c8 10 36 10 44 0" stroke="#0a0d14" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      <path d="M52 62 30 46l8 26Z" fill={hue} stroke="#0a0d14" strokeWidth="2"/>
      <path d="M148 62l22-16-8 26Z" fill={hue} stroke="#0a0d14" strokeWidth="2"/>
      <path d="M74 148h52l-6 16H80Z" fill="url(#lmc)" stroke="#0a0d14" strokeWidth="2"/>
      <circle cx="100" cy="112" r="6" fill={hue2} opacity="0.85"/>
    </svg>
  );
}

export function ClusterCover({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 150" className="k4-art-svg">
      <defs>
        <radialGradient id="ccg" cx="0.36" cy="0.3"><stop offset="0%" stopColor="#fff6fb"/><stop offset="50%" stopColor={hue}/><stop offset="100%" stopColor="#4a0a28"/></radialGradient>
        <linearGradient id="ccs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fffbe8"/><stop offset="55%" stopColor="#ffd24a"/><stop offset="100%" stopColor="#a06a06"/></linearGradient>
      </defs>
      <circle cx="60" cy="72" r="34" fill="url(#ccg)" stroke="#3a0a1e" strokeWidth="2.5"/>
      <ellipse cx="49" cy="66" rx="7" ry="9" fill="#fff"/>
      <ellipse cx="71" cy="66" rx="7" ry="9" fill="#fff"/>
      <circle cx="50" cy="68" r="3.6" fill="#2a0a18"/>
      <circle cx="72" cy="68" r="3.6" fill="#2a0a18"/>
      <path d="M48 86c6 8 18 8 24 0" stroke="#3a0a1e" strokeWidth="3.4" fill="none" strokeLinecap="round"/>
      <path d="M26 48 14 34l4 18Z" fill={hue} stroke="#3a0a1e" strokeWidth="1.6"/>
      <path d="M94 48l12-14-4 18Z" fill={hue} stroke="#3a0a1e" strokeWidth="1.6"/>
      <path d="M60 112l5 11 12 1.6-8.8 8.4 2 12-10.2-6-10.2 6 2-12-8.8-8.4 12-1.6Z" fill="url(#ccs)" stroke="#5a3a04" strokeWidth="1.4"/>
      <circle cx="46" cy="52" r="6" fill="#fff" opacity="0.4"/>
    </svg>
  );
}

export function LineCover({ hue, hue2 }: { hue: string; hue2: string }) {
  return (
    <svg viewBox="0 0 120 150" className="k4-art-svg">
      <defs>
        <linearGradient id="lcg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#fffdf6"/><stop offset="48%" stopColor={hue}/><stop offset="100%" stopColor="#0d1018"/></linearGradient>
        <linearGradient id="lcf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={hue2}/><stop offset="100%" stopColor={hue}/></linearGradient>
      </defs>
      <rect x="16" y="30" width="88" height="76" rx="9" fill="rgba(4,6,10,.6)" stroke="url(#lcf)" strokeWidth="3"/>
      {[0,1,2].map(function (c) {
        return [0,1,2].map(function (r) {
          return <rect key={c + "-" + r} x={22 + c * 27} y={36 + r * 23} width={23} height={19} rx="4" fill={c === r ? hue : "rgba(255,255,255,.12)"} opacity={c === r ? 0.9 : 1}/>;
        });
      })}
      <path d="M60 8 88 22v22c0 18-14 28-28 32-14-4-28-14-28-32V22Z" fill="url(#lcg)" stroke="#0a0d14" strokeWidth="2.4"/>
      <path d="M40 26 60 16l20 10-20 8Z" fill="url(#lcf)" stroke="#0a0d14" strokeWidth="1.6"/>
      <circle cx="52" cy="44" r="3.4" fill="#0a0d14"/>
      <circle cx="68" cy="44" r="3.4" fill="#0a0d14"/>
      <path d="M50 58c5 6 15 6 20 0" stroke="#0a0d14" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M22 118h76" stroke="url(#lcf)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="34" cy="130" r="7" fill={hue} opacity="0.85"/>
      <circle cx="60" cy="130" r="7" fill={hue2} opacity="0.85"/>
      <circle cx="86" cy="130" r="7" fill={hue} opacity="0.85"/>
    </svg>
  );
}