"use client";
import { useState } from "react";
import type { Featured } from "../../lib/lobby-featured";

const GLYPH: Record<string, string> = {
  crash: "M4 26 L14 18 L22 21 L34 6", roulette: "M18 4 A14 14 0 1 1 17.9 4",
  hold3: "M6 8 H30 V28 H6 Z", hold: "M6 8 H30 V28 H6 Z",
  cluster: "M10 10 L18 6 L26 10 L26 22 L18 26 L10 22 Z",
  lines: "M6 8 H30 M6 18 H30 M6 28 H30",
  mega: "M8 6 V30 M18 6 V30 M28 6 V30",
  instant: "M20 4 L10 20 H18 L16 32 L28 14 H20 Z",
  "virtual-sports": "M18 4 A14 14 0 1 1 17.9 4 M18 4 V32 M4 18 H32"
};

export default function FeaturedCover({ g }: { g: Featured }) {
  const [bad, setBad] = useState(false);
  const grad = "linear-gradient(150deg," + g.color + " 0%," + g.color2 + " 100%)";
  if (!bad) {
    return (
      <div style={{ position: "absolute", inset: 0, background: grad }}>
        <img
          src={g.cover}
          alt={g.title}
          loading="lazy"
          decoding="async"
          onError={function () { setBad(true); }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: grad, display: "grid", placeItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,.34), transparent 62%)" }}/>
      <svg viewBox="0 0 36 36" width="52%" height="52%" fill="none" stroke="rgba(255,255,255,.92)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 4px 14px rgba(0,0,0,.45))" }}>
        <path d={GLYPH[g.type] || GLYPH.cluster}/>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 12px", background: "linear-gradient(180deg,transparent,rgba(6,8,14,.88))", font: "900 13px/1.25 system-ui", color: "#fff", letterSpacing: ".2px" }}>
        {g.title}
      </div>
    </div>
  );
}
