"use client";
import Link from "next/link";
import { useRef } from "react";
import type { CrashConfig } from "@/lib/kb2/crashConfig";
import { getAudio } from "@/lib/kb2/audio";

function Craft({ kind, hue }: { kind: string; hue: string }) {
  if (kind === "rocket") {
    return (
      <svg viewBox="0 0 100 130" className="k4-art-svg">
        <path d="M50 8c16 16 23 38 23 62v34H27V70C27 46 34 24 50 8Z" fill={hue} stroke="#04060a" strokeWidth="2"/>
        <path d="M27 78 8 112l19-8Z" fill={hue} opacity="0.75"/>
        <path d="M73 78l19 34-19-8Z" fill={hue} opacity="0.75"/>
        <circle cx="50" cy="52" r="11" fill="#bfe9ff" stroke="#04060a" strokeWidth="2"/>
        <path d="M38 106h24l-12 24Z" fill="#ff9f43"/>
      </svg>
    );
  }
  if (kind === "airship") {
    return (
      <svg viewBox="0 0 130 100" className="k4-art-svg">
        <ellipse cx="60" cy="44" rx="52" ry="24" fill={hue} stroke="#04060a" strokeWidth="2"/>
        <path d="M108 30l20-12v52l-20-12Z" fill={hue} opacity="0.8"/>
        <rect x="46" y="66" width="28" height="14" rx="4" fill="#04060a"/>
        <ellipse cx="38" cy="34" rx="20" ry="7" fill="#fff" opacity="0.35"/>
      </svg>
    );
  }
  if (kind === "heli") {
    return (
      <svg viewBox="0 0 130 100" className="k4-art-svg">
        <rect x="8" y="22" width="114" height="5" rx="2.5" fill="#04060a"/>
        <rect x="62" y="26" width="5" height="12" fill="#04060a"/>
        <path d="M30 52c0-11 13-16 32-16h22c16 0 26 8 30 18l14 6-14 6c-4 10-14 14-30 14H56c-16 0-26-8-26-18Z" fill={hue} stroke="#04060a" strokeWidth="2"/>
        <ellipse cx="88" cy="54" rx="12" ry="8" fill="#bfe9ff" stroke="#04060a" strokeWidth="1.6"/>
        <path d="M40 74h48" stroke="#04060a" strokeWidth="3"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 130 100" className="k4-art-svg">
      <path d="M10 52 74 40l32-18 12 6-24 16 24 16-12 6-32-18-64-6Z" fill={hue} stroke="#04060a" strokeWidth="2"/>
      <path d="M52 44 30 14l14 3 26 24Z" fill={hue} opacity="0.8"/>
      <path d="M52 58 30 88l14-3 26-24Z" fill={hue} opacity="0.8"/>
      <ellipse cx="92" cy="40" rx="10" ry="5" fill="#bfe9ff" stroke="#04060a" strokeWidth="1.6"/>
      <path d="M10 52H-16l10 4-10 4Z" fill="#ff9f43"/>
    </svg>
  );
}

export default function LiveCrashRow({ games }: { games: CrashConfig[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const nudge = function (dir: number) {
    const el = strip.current;
    if (!el) return;
    getAudio().click();
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="k4-row">
      <div className="k4-head">
        <span className="k4-star">*</span>
        <h3>Live Crash</h3>
        <span className="k4-count">{games.length}</span>
        <span className="k4-live">SHARED ROUND</span>
        <div className="k4-sp"/>
        <button className="k4-arrow" onClick={function () { nudge(-1); }} aria-label="Scroll left">&#8249;</button>
        <button className="k4-arrow" onClick={function () { nudge(1); }} aria-label="Scroll right">&#8250;</button>
        <Link href="/casino/sky/skyward" className="k4-all">VIEW ALL</Link>
      </div>
      <div className="k4-strip" ref={strip}>
        {games.map(function (g) {
          return (
            <Link key={g.slug} href={"/casino/sky/" + g.slug} className="k4-card" style={{ ["--acc" as string]: g.accent }}>
              <div className="k4-art" style={{ background: g.sky }}>
                <div className="k4-rays"/>
                <div className="k4-glow"/>
                <span className={"k4-badge " + g.badge.toLowerCase()}>{g.badge}</span>
                <span className="k4-max">{g.maxWin}</span>
                <div className="k4-craft"><Craft kind={g.craft} hue={g.accent}/></div>
                <div className="k4-floor"/>
                <span className="k4-vol">{g.vol}</span>
                <div className="k4-shine"/>
              </div>
              <div className="k4-meta">
                <span className="k4-studio">KB STUDIO</span>
                <b>{g.name}</b>
                <em>{g.tag} - {g.craft}</em>
              </div>
              <div className="k4-hover"><span>JOIN ROUND</span></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
