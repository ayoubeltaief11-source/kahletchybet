"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { getAudio } from "@/lib/kb2/audio";
import GameCover from "@/components/kb2/GameCover";


export function Row({ title, count, badge, href, children }: { title: string; count: number; badge?: string; href: string; children: ReactNode }) {
  const strip = useRef<HTMLDivElement>(null);
  const nudge = function (dir: number) {
    const el = strip.current;
    if (!el) return;
    getAudio().click();
    el.scrollBy({ left: dir * Math.max(260, el.clientWidth * 0.82), behavior: "smooth" });
  };
  return (
    <section className="k4-row">
      <div className="k4-head">
        <span className="k4-star">*</span>
        <h3>{title}</h3>
        <span className="k4-count">{count}</span>
        {badge && <span className="k4-live">{badge}</span>}
        <div className="k4-sp"/>
        <button className="k4-arrow" onClick={function () { nudge(-1); }} aria-label="Scroll left">&#8249;</button>
        <button className="k4-arrow" onClick={function () { nudge(1); }} aria-label="Scroll right">&#8250;</button>
        <Link href={href} className="k4-all">VIEW ALL</Link>
      </div>
      <div className="k4-strip" ref={strip}>{children}</div>
    </section>
  );
}

export function GameCard({ href, name, tag, badge, maxWin, vol, felt, accent, cover, slug }: {
  accent2?: string;
  href: string; name: string; tag: string; badge: string; maxWin: string; vol: string; felt: string; accent: string; cover?: ReactNode; slug?: string;
}) {
  const family = href.includes("/sky/") ? "crash" : href.includes("/cluster/") || href.includes("/lines/") || href.includes("/mega/") || href.includes("/hold/") || href.includes("/classic3/") ? "slots" : href.includes("/roulette2/") ? "roulette" : "instant";
  const [imgFailed, setImgFailed] = useState(false);
  
  const renderCover = () => {
    // استخدام GameCoverSvg دائمًا (لأنه يوفر أغلفة احترافية)
    return <GameCover slug={slug || "unknown"} name={name} accent={accent} accent2={accent} family={family} maxWin={maxWin} />;
  };

  return (
    <Link href={href} className="k4-card" style={{ ["--acc" as string]: accent }}>
      <div className="k4-art" style={{ background: felt }}>
        <div className="k4-rays"/>
        <div className="k4-glow"/>
        <span className={"k4-badge " + badge.toLowerCase()}>{badge}</span>
        <span className="k4-max">{maxWin}</span>
        <div className="k4-craft">
          {renderCover()}
        </div>
        <div className="k4-floor"/>
        <span className="k4-vol">{vol}</span>
        <div className="k4-shine"/>
      </div>
      <div className="k4-meta">
        <span className="k4-studio">KB STUDIO</span>
        <b>{name}</b>
        <em>{tag}</em>
      </div>
      <div className="k4-hover"><span>PLAY</span></div>
    </Link>
  );
}

export function Cover({ kind, hue, hue2 }: { kind: string; hue: string; hue2: string }) {
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
  if (kind === "jet") {
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
  if (kind === "cluster") {
    return (
      <svg viewBox="0 0 120 150" className="k4-art-svg">
        <defs><radialGradient id={"cg" + hue.replace("#","")} cx="0.36" cy="0.3"><stop offset="0%" stopColor="#fff6fb"/><stop offset="50%" stopColor={hue}/><stop offset="100%" stopColor="#2a0a18"/></radialGradient></defs>
        <circle cx="60" cy="70" r="34" fill={"url(#cg" + hue.replace("#","") + ")"} stroke="#04060a" strokeWidth="2.5"/>
        <ellipse cx="49" cy="64" rx="7" ry="9" fill="#fff"/>
        <ellipse cx="71" cy="64" rx="7" ry="9" fill="#fff"/>
        <circle cx="50" cy="66" r="3.6" fill="#1a0a12"/>
        <circle cx="72" cy="66" r="3.6" fill="#1a0a12"/>
        <path d="M48 84c6 8 18 8 24 0" stroke="#04060a" strokeWidth="3.4" fill="none" strokeLinecap="round"/>
        <path d="M26 46 14 32l4 18Z" fill={hue} stroke="#04060a" strokeWidth="1.6"/>
        <path d="M94 46l12-14-4 18Z" fill={hue} stroke="#04060a" strokeWidth="1.6"/>
        <path d="M60 110l5 11 12 1.6-8.8 8.4 2 12-10.2-6-10.2 6 2-12-8.8-8.4 12-1.6Z" fill={hue2} stroke="#04060a" strokeWidth="1.4"/>
        <circle cx="46" cy="50" r="6" fill="#fff" opacity="0.4"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 150" className="k4-art-svg">
      <defs><linearGradient id={"lg" + hue.replace("#","")} x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#fffdf6"/><stop offset="48%" stopColor={hue}/><stop offset="100%" stopColor="#0d1018"/></linearGradient></defs>
      <rect x="16" y="30" width="88" height="76" rx="9" fill="rgba(4,6,10,.6)" stroke={hue2} strokeWidth="3"/>
      {[0,1,2].map(function (c) {
        return [0,1,2].map(function (r) {
          return <rect key={c + "-" + r} x={22 + c * 27} y={36 + r * 23} width={23} height={19} rx="4" fill={c === r ? hue : "rgba(255,255,255,.12)"}/>;
        });
      })}
      <path d="M60 8 88 22v22c0 18-14 28-28 32-14-4-28-14-28-32V22Z" fill={"url(#lg" + hue.replace("#","") + ")"} stroke="#0a0d14" strokeWidth="2.4"/>
      <path d="M40 26 60 16l20 10-20 8Z" fill={hue2} stroke="#0a0d14" strokeWidth="1.6"/>
      <circle cx="52" cy="44" r="3.4" fill="#0a0d14"/>
      <circle cx="68" cy="44" r="3.4" fill="#0a0d14"/>
      <path d="M50 58c5 6 15 6 20 0" stroke="#0a0d14" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M22 118h76" stroke={hue2} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="34" cy="130" r="7" fill={hue} opacity="0.85"/>
      <circle cx="60" cy="130" r="7" fill={hue2} opacity="0.85"/>
      <circle cx="86" cy="130" r="7" fill={hue} opacity="0.85"/>
    </svg>
  );
}






